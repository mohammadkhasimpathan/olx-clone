from django.db import models
from django.conf import settings
from django.utils import timezone


class Notification(models.Model):
    """
    In-app notifications for users
    """
    NOTIFICATION_TYPES = (
        ('message', 'New Message'),
        ('listing_sold', 'Listing Sold'),
        ('listing_expired', 'Listing Expired'),
        ('price_drop', 'Price Drop Alert'),
        ('saved_search', 'Saved Search Match'),
        ('system', 'System Notification'),
    )
    
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Optional link to related object
    link_url = models.CharField(max_length=500, blank=True)
    
    # Metadata (JSON for flexibility)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['recipient', 'is_read']),
        ]
    
    def __str__(self):
        return f"{self.recipient.username} - {self.title}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])


class NotificationPreference(models.Model):
    """
    User preferences for notifications
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notification_preferences'
    )
    
    # In-app notifications
    enable_in_app = models.BooleanField(default=True)
    
    # Email notifications
    enable_email = models.BooleanField(default=True)
    email_new_message = models.BooleanField(default=True)
    email_listing_sold = models.BooleanField(default=True)
    email_price_drop = models.BooleanField(default=False)
    email_saved_search = models.BooleanField(default=False)
    
    # Frequency
    email_digest = models.BooleanField(default=False)
    digest_frequency = models.CharField(
        max_length=10,
        choices=(('daily', 'Daily'), ('weekly', 'Weekly')),
        default='daily'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - Notification Preferences"
