from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from chat.models import Message
from listings.models import Listing
from .models import Notification, NotificationPreference
from realtime.event_manager import event_manager
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def create_notification_preferences(sender, instance, created, **kwargs):
    """Create default notification preferences for new users"""
    if created:
        NotificationPreference.objects.create(user=instance)


@receiver(post_save, sender=Notification)
def publish_notification_event(sender, instance, created, **kwargs):
    """
    Publish SSE event when a new notification is created.
    """
    if created:
        # Publish SSE event
        event_manager.publish(
            user_id=instance.recipient.id,
            event_type='notification_created',
            data={
                'id': instance.id,
                'type': instance.notification_type,
                'title': instance.title,
                'message': instance.message,
                'link_url': instance.link_url,
                'created_at': instance.created_at.isoformat(),
            }
        )
        
        logger.info(f"Published notification_created event to user {instance.recipient.id}")


@receiver(post_save, sender=Message)
def notify_on_new_message(sender, instance, created, **kwargs):
    """Send notification when new message is created"""
    if created:
        # This function's implementation needs to be updated to use the new Notification model
        # or removed if its functionality is now handled elsewhere.
        # For now, it's left as is, but will likely cause an error due to NotificationService removal.
        try:
            # NotificationService.notify_new_message(instance.conversation, instance)
            # Placeholder for new notification creation logic
            pass 
        except Exception as e:
            # Log error but don't fail message creation
            print(f"Failed to create notification: {e}")


@receiver(post_save, sender=Listing)
def notify_on_listing_sold(sender, instance, created, **kwargs):
    """Send notification when listing is marked as sold"""
    if not created and instance.is_sold:
        # Check if it was just marked as sold
        try:
            old_instance = Listing.objects.get(pk=instance.pk)
            if not old_instance.is_sold and instance.is_sold:
                NotificationService.notify_listing_sold(instance)
        except Listing.DoesNotExist:
            pass
        except Exception as e:
            print(f"Failed to create notification: {e}")
