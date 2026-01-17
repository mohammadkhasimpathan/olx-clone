"""
WebSocket consumer for real-time notifications
"""
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model

User = get_user_model()
logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Handle WebSocket connection"""
        # Authenticate user via JWT token
        token = self.scope['query_string'].decode().split('token=')[-1]
        
        try:
            # Validate JWT token
            UntypedToken(token)
            self.user = await self.get_user_from_token(token)
            
            if not self.user:
                logger.warning("[WebSocket] Invalid user for notifications")
                await self.close()
                return
            
            # Create user-specific notification channel
            self.room_group_name = f'notifications_{self.user.id}'
            
            # Join notification group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            
            await self.accept()
            
            # Broadcast online status to all users
            await self.channel_layer.group_send(
                "global_users",
                {
                    "type": "user_status",
                    "user_id": self.user.id,
                    "status": "online"
                }
            )
            
            logger.info(f"[WebSocket] User {self.user.id} connected to notifications")
            logger.info(f"[WebSocket] User {self.user.id} connected to notifications")
            
        except (InvalidToken, TokenError) as e:
            logger.error(f"[WebSocket] Auth failed: {e}")
            await self.close()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Only leave group if we successfully joined (auth succeeded)
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
        if hasattr(self, 'user'):
            logger.info(f"[WebSocket] User {self.user.id} disconnected from notifications")
        else:
            logger.info("[WebSocket] Disconnected from notifications")
    
    async def receive(self, text_data):
        """Receive message from WebSocket"""
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'mark_read':
            notification_id = data.get('notification_id')
            await self.mark_notification_read(notification_id)
    
    async def notification_created(self, event):
        """Send notification to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'notification_created',
            'notification': event['notification']
        }))
        logger.info(f"[WebSocket] Notification sent to user")
    
    async def notification_read(self, event):
        """Send read notification update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'notification_read',
            'notification_id': event['notification_id']
        }))
    
    async def unread_count_updated(self, event):
        """Send unread count update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'unread_count_updated',
            'count': event['count']
        }))
        logger.info(f"[WebSocket] Unread count sent: {event['count']}")
    
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
    def mark_notification_read(self, notification_id):
        """Mark notification as read"""
        from .models import Notification
        try:
            notification = Notification.objects.get(id=notification_id, recipient=self.user)
            notification.is_read = True
            notification.save()
        except Notification.DoesNotExist:
            pass
