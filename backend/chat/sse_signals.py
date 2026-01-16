"""
Signal handlers for chat app to broadcast via Django Channels
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Message
from .serializers import MessageSerializer
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Message)
def broadcast_message_via_channels(sender, instance, created, **kwargs):
    """
    Broadcast new message via Django Channels WebSocket.
    Sends to conversation-specific channel group.
    """
    if created:
        channel_layer = get_channel_layer()
        conversation_id = instance.conversation.id
        
        # Serialize message
        message_data = MessageSerializer(instance).data
        
        # Broadcast to conversation group
        async_to_sync(channel_layer.group_send)(
            f"chat_{conversation_id}",
            {
                "type": "chat_message",
                "message": message_data
            }
        )
        
        logger.info(f"Broadcasted message {instance.id} to conversation {conversation_id}")
