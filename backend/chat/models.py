from django.db import models
from django.conf import settings
from listings.models import Listing


class Conversation(models.Model):
    """
    Represents a chat conversation between a buyer and seller about a specific listing.
    One conversation per buyer-listing pair.
    """
    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name='conversations'
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='buyer_conversations'
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='seller_conversations'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('listing', 'buyer')
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['buyer', '-updated_at']),
            models.Index(fields=['seller', '-updated_at']),
            models.Index(fields=['listing']),
        ]
    
    def __str__(self):
        return f"Conversation: {self.buyer.username} - {self.listing.title[:30]}"
    
    def get_other_user(self, current_user):
        """Get the other participant in the conversation"""
        return self.seller if current_user == self.buyer else self.buyer
    
    def mark_as_read(self, user):
        """Mark all messages as read for a specific user"""
        self.messages.filter(sender__ne=user, is_read=False).update(is_read=True)


class Message(models.Model):
    """
    Represents a single message in a conversation.
    """
    MESSAGE_TYPES = (
        ('text', 'Text Message'),
        ('offer', 'Price Offer'),
        ('system', 'System Message'),
    )
    
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    content = models.TextField(max_length=2000)
    message_type = models.CharField(
        max_length=10,
        choices=MESSAGE_TYPES,
        default='text'
    )
    offer_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Price offered (for offer messages)"
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
            models.Index(fields=['sender', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"
    
    def save(self, *args, **kwargs):
        """Update conversation's updated_at on new message"""
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            self.conversation.save()  # Triggers updated_at update
