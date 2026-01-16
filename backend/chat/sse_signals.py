"""
Signal handlers for chat app to publish SSE events
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Message
from realtime.event_manager import event_manager
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Message)
def publish_message_event(sender, instance, created, **kwargs):
    """
    Publish SSE event when a new message is created.
    Notifies the recipient (other participant in conversation).
    """
    if created:
        conversation = instance.conversation
        
        # Determine recipient (the other participant)
        recipient = conversation.seller if instance.sender == conversation.buyer else conversation.buyer
        
        # Publish event to recipient
        event_manager.publish(
            user_id=recipient.id,
            event_type='chat_message',
            data={
                'conversation_id': conversation.id,
                'message_id': instance.id,
                'sender_id': instance.sender.id,
                'sender_username': instance.sender.username,
                'content': instance.content,
                'message_type': instance.message_type,
                'created_at': instance.created_at.isoformat(),
                'listing_id': conversation.listing.id,
                'listing_title': conversation.listing.title,
            }
        )
        
        logger.info(f"Published chat_message event to user {recipient.id}")
