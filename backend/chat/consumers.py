"""
WebSocket consumer for real-time chat messaging
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model
from .models import Conversation, Message
from .serializers import MessageSerializer

User = get_user_model()


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
                await self.close()
                return
            
            # Verify user is participant in conversation
            is_participant = await self.verify_participant()
            if not is_participant:
                await self.close()
                return
            
            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            
            await self.accept()
            
        except (InvalidToken, TokenError):
            await self.close()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
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
