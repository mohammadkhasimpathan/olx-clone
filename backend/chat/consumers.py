"""
WebSocket consumer for real-time chat messaging
"""
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model
from .models import Conversation, Message
from .serializers import MessageSerializer

User = get_user_model()
logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Handle WebSocket connection"""
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'
        
        # Authenticate user via JWT token
        token = self.scope['query_string'].decode().split('token=')[-1]
        
        try:
            # Validate JWT token
            UntypedToken(token)
            self.user = await self.get_user_from_token(token)
            
            if not self.user:
                logger.warning(f"[WebSocket] Invalid user for conversation {self.conversation_id}")
                await self.close()
                return
            
            # Verify user is participant in conversation
            is_participant = await self.verify_participant()
            if not is_participant:
                logger.warning(f"[WebSocket] User {self.user.id} not participant in conversation {self.conversation_id}")
                await self.close()
                return
            
            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            
            await self.accept()
        
            logger.info(f"[WebSocket] User {self.user.id} connected to chat {self.conversation_id}")
            
        except (InvalidToken, TokenError) as e:
            logger.error(f"[WebSocket] Auth failed: {e}")
            await self.close()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        logger.info(f"[WebSocket] User {self.user.id} disconnected from chat_{self.conversation_id}")
        
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        
        # Mark user as offline
        from users.models import User
        await database_sync_to_async(User.objects.filter(id=self.user.id).update)(is_online=False, last_seen=timezone.now())
    
    async def receive(self, text_data):
        """Receive message from WebSocket"""
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'chat_message':
            content = data.get('content')
            
            # Save message to database
            message = await self.save_message(content)
            
            # Broadcast message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message
                }
            )
            logger.info(f"[WebSocket] Message broadcast to chat_{self.conversation_id}")
        
        # Handle typing indicator
        elif message_type == 'typing':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_typing',
                    'user_id': self.user.id,
                    'username': self.user.username,
                    'is_typing': data.get('is_typing', False)
                }
            )
            return
        
        elif message_type == 'mark_read':
            # Mark messages as read
            await self.mark_messages_read()
            
            # Notify other participant
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'messages_read',
                    'user_id': self.user.id
                }
            )
    
    async def chat_message(self, event):
        """Send message to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message']
        }))
    
    async def user_typing(self, event):
        """Send typing indicator to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user_id': event['user_id'],
            'username': event['username'],
            'is_typing': event['is_typing']
        }))
    
    
    async def messages_read(self, event):
        """Send read receipt to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'messages_read',
            'user_id': event['user_id']
        }))
    
    @database_sync_to_async
    def get_user_from_token(self, token):
        """Get user from JWT token"""
        try:
            from rest_framework_simplejwt.authentication import JWTAuthentication
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token)
            return jwt_auth.get_user(validated_token)
        except:
            return None
    
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
    def mark_messages_read(self):
        """Mark all messages in conversation as read"""
        conversation = Conversation.objects.get(id=self.conversation_id)
        Message.objects.filter(
            conversation=conversation,
            is_read=False
        ).exclude(sender=self.user).update(is_read=True)
