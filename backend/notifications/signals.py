from django.db.models.signals import post_save
from django.dispatch import receiver
from chat.models import Message
from listings.models import Listing
from .services import NotificationService
from .models import NotificationPreference
from users.models import User


@receiver(post_save, sender=User)
def create_notification_preferences(sender, instance, created, **kwargs):
    """Create notification preferences when user is created"""
    if created:
        NotificationPreference.objects.create(user=instance)


@receiver(post_save, sender=Message)
def notify_on_new_message(sender, instance, created, **kwargs):
    """Send notification when new message is created"""
    if created:
        try:
            NotificationService.notify_new_message(instance.conversation, instance)
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
