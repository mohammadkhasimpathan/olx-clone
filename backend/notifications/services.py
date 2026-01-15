from .models import Notification, NotificationPreference


class NotificationService:
    """
    Service for creating and managing notifications
    """
    
    @staticmethod
    def create_notification(recipient, notification_type, title, message, link_url='', metadata=None):
        """
        Create a new notification
        
        Args:
            recipient: User object
            notification_type: Type of notification
            title: Notification title
            message: Notification message
            link_url: Optional URL to link to
            metadata: Optional metadata dict
        
        Returns:
            Notification object
        """
        notification = Notification.objects.create(
            recipient=recipient,
            notification_type=notification_type,
            title=title,
            message=message,
            link_url=link_url,
            metadata=metadata or {}
        )
        return notification
    
    @staticmethod
    def notify_new_message(conversation, message):
        """
        Notify user about new message
        """
        # Determine recipient (the other user in conversation)
        recipient = conversation.seller if message.sender == conversation.buyer else conversation.buyer
        
        # Check if user wants this notification
        try:
            prefs = recipient.notification_preferences
            if not prefs.enable_in_app:
                return None
        except NotificationPreference.DoesNotExist:
            pass  # Use defaults
        
        return NotificationService.create_notification(
            recipient=recipient,
            notification_type='message',
            title=f'New message from {message.sender.username}',
            message=f'{message.content[:100]}...' if len(message.content) > 100 else message.content,
            link_url=f'/chat/{conversation.id}',
            metadata={
                'conversation_id': conversation.id,
                'message_id': message.id,
                'sender_id': message.sender.id
            }
        )
    
    @staticmethod
    def notify_listing_sold(listing):
        """
        Notify seller when listing is marked as sold
        """
        return NotificationService.create_notification(
            recipient=listing.user,
            notification_type='listing_sold',
            title='Listing marked as sold',
            message=f'Your listing "{listing.title}" has been marked as sold!',
            link_url=f'/listings/{listing.id}',
            metadata={'listing_id': listing.id}
        )
    
    @staticmethod
    def get_unread_count(user):
        """Get count of unread notifications for user"""
        return Notification.objects.filter(
            recipient=user,
            is_read=False
        ).count()
    
    @staticmethod
    def mark_all_read(user):
        """Mark all notifications as read for user"""
        return Notification.objects.filter(
            recipient=user,
            is_read=False
        ).update(is_read=True, read_at=timezone.now())
    
    @staticmethod
    def delete_old_notifications(days=30):
        """Delete read notifications older than specified days"""
        from django.utils import timezone
        from datetime import timedelta
        
        cutoff_date = timezone.now() - timedelta(days=days)
        return Notification.objects.filter(
            is_read=True,
            created_at__lt=cutoff_date
        ).delete()
