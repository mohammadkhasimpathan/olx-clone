import json
import asyncio
import logging
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.utils import timezone
from .models import Conversation, Message
from .serializers import MessageSerializer

logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    """Production-grade WebSocket consumer for real-time chat"""

    async def connect(self):
        """Handle WebSocket connection with proper error handling"""
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.room_group_name = f"chat_{self.conversation_id}"

        # Parse token safely (FIX #1: Safe JWT extraction)
        query_params = parse_qs(self.scope["query_string"].decode())
        token = query_params.get("token", [None])[0]

        # FIX #2: Accept FIRST, then close if needed
        await self.accept()

        if not token:
            logger.warning(f"[WebSocket] No token provided for conversation {self.conversation_id}")
            await self.close(code=4001)
            return

        try:
            UntypedToken(token)
            self.user = await self.get_user_from_token(token)
        except (InvalidToken, TokenError) as e:
            logger.error(f"[WebSocket] Auth failed: {e}")
            await self.close(code=4003)
            return

        if not self.user:
            logger.warning(f"[WebSocket] Invalid user for conversation {self.conversation_id}")
            await self.close(code=4003)
            return

        # Verify user is participant
        if not await self.verify_participant():
            logger.warning(f"[WebSocket] User {self.user.id} not participant in conversation {self.conversation_id}")
            await self.close(code=4003)
            return

        # FIX #6: Join group AFTER accept
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # FIX #4: Add heartbeat to prevent Render timeouts
        self.heartbeat_task = asyncio.create_task(self.heartbeat())

        # Mark user as online
        await self.update_user_status(True)

        logger.info(f"[WebSocket] User {self.user.id} connected to chat_{self.conversation_id}")

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection with safe cleanup"""
        # FIX #3: Safe user access
        user_id = getattr(self, "user", None)
        if user_id:
            user_id = user_id.id if hasattr(user_id, "id") else user_id

        logger.info(f"[WebSocket] User {user_id} disconnected from chat_{self.conversation_id} ({close_code})")

        # Cancel heartbeat task
        if hasattr(self, "heartbeat_task"):
            self.heartbeat_task.cancel()

        # Leave room group
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

        # Mark user as offline
        if hasattr(self, "user"):
            await self.update_user_status(False)

    async def heartbeat(self):
        """FIX #4: Send periodic ping to prevent Render timeout"""
        try:
            while True:
                await self.send(text_data=json.dumps({"type": "ping"})
                await asyncio.sleep(25)  # Every 25 seconds
        except asyncio.CancelledError:
            pass

    async def receive(self, text_data):
        """Receive message from WebSocket with safety checks"""
        # FIX #7: JSON safety
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            logger.warning("[WebSocket] Invalid JSON received")
            return

        message_type = data.get("type")

        if message_type == "chat_message":
            content = data.get("content")
            if not content:
                return

            # Save message to database
            message = await self.save_message(content)

            # Broadcast message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "message": message
                }
            )
            logger.info(f"[WebSocket] Message broadcast to chat_{self.conversation_id}")

        elif message_type == "typing":
            # Broadcast typing indicator
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "user_typing",
                    "user_id": self.user.id,
                    "username": self.user.username,
                    "is_typing": data.get("is_typing", False)
                }
            )

        elif message_type == "pong":
            # Client responded to ping
            pass

    async def chat_message(self, event):
        """Handle chat message event from channel layer"""
        await self.send(text_data=json.dumps({
            "type": "chat_message",
            "message": event["message"]
        })

    async def message_status_update(self, event):
        """Handle message status update event"""
        await self.send(text_data=json.dumps({
            "type": "message_status",
            "message_id": event["message_id"],
            "is_delivered": event.get("is_delivered"),
            "is_read": event.get("is_read"),
            "delivered_at": event.get("delivered_at"),
            "read_at": event.get("read_at")
        })

    async def user_typing(self, event):
        """Send typing indicator to WebSocket"""
        await self.send(text_data=json.dumps({
            "type": "typing",
            "user_id": event["user_id"],
            "username": event["username"],
            "is_typing": event["is_typing"]
        })

    @database_sync_to_async
    def get_user_from_token(self, token):
        """Extract user from JWT token"""
        jwt_auth = JWTAuthentication()
        validated = jwt_auth.get_validated_token(token)
        return jwt_auth.get_user(validated)

    @database_sync_to_async
    def verify_participant(self):
        """Verify user is participant in conversation"""
        try:
            conversation = Conversation.objects.get(id=self.conversation_id)
            return self.user in [conversation.buyer, conversation.seller]
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, content):
        """Save message to database"""
        conversation = Conversation.objects.get(id=self.conversation_id)
        message = Message.objects.create(
            conversation=conversation,
            sender=self.user,
            content=content
        )
        return MessageSerializer(message).data

    @database_sync_to_async
    def update_user_status(self, is_online):
        """Update user online status"""
        from users.models import User
        User.objects.filter(id=self.user.id).update(
            is_online=is_online,
            last_seen=timezone.now() if not is_online else None
        )
