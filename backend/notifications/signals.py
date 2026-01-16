from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from chat.models import Message
from listings.models import Listing
from .models import Notification, NotificationPreference
from .serializers import NotificationSerializer
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def create_notification_preferences(sender, instance, created, **kwargs):
    """Create default notification preferences for new users"""
    if created:
        NotificationPreference.objects.create(user=instance)


@receiver(post_save, sender=Notification)
def broadcast_notification_via_channels(sender, instance, created, **kwargs):
    """
    Broadcast notification via Django Channels WebSocket.
    Sends to user-specific notification channel.
    """
    if created:
        channel_layer = get_channel_layer()
        
        # Serialize notification
        notification_data = NotificationSerializer(instance).data
        
        # Broadcast to user's notification group
        async_to_sync(channel_layer.group_send)(
            f"notifications_{instance.recipient.id}",
            {
                "type": "notification_created",
                "notification": notification_data
            }
        )
        
        # Also send unread count update
        unread_count = Notification.objects.filter(
            recipient=instance.recipient,
            is_read=False
        ).count()
        
        async_to_sync(channel_layer.group_send)(
            f"notifications_{instance.recipient.id}",
            {
                "type": "unread_count_updated",
                "count": unread_count
            }
        )
        
        logger.info(f"[Channels] Notification {instance.id} broadcast to user {instance.recipient.id}")


@receiver(post_save, sender=Message)
def notify_on_new_message(sender, instance, created, **kwargs):
    """
    Create notification when new message is created.
    Does NOT broadcast message (WebSocket consumer handles that).
    """
    if created:
        try:
            conversation = instance.conversation
            recipient = conversation.seller if instance.sender == conversation.buyer else conversation.buyer
            
            # Create notification (this will trigger notification broadcast via its own signal)
            Notification.objects.create(
                recipient=recipient,
                notification_type='message',
                title='New Message',
                message=f'{instance.sender.username} sent you a message about {conversation.listing.title}',
                link_url=f'/chat/{conversation.id}'
            )
            logger.info(f"[Signal] Created notification for message {instance.id}")
        except Exception as e:
            logger.error(f"[Signal] Failed to create notification: {e}")


@receiver(post_save, sender=Listing)
def notify_on_listing_sold(sender, instance, created, **kwargs):
    """Send notification when listing is marked as sold"""
    if not created and instance.is_sold:
        try:
            old_instance = Listing.objects.get(pk=instance.pk)
            if not old_instance.is_sold and instance.is_sold:
                # Notify interested users (optional - implement if needed)
                pass
        except Listing.DoesNotExist:
            pass
        except Exception as e:
            logger.error(f"[Signal] Failed to create notification: {e}")
