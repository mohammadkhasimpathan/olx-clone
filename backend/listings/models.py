from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from categories.models import Category
import os


def validate_image_size(image):
    """Validate that uploaded image is not larger than 5MB"""
    file_size = image.size
    limit_mb = 5
    if file_size > limit_mb * 1024 * 1024:
        raise ValidationError(f"Max file size is {limit_mb}MB")


def listing_image_path(instance, filename):
    """Generate upload path for listing images"""
    # Get file extension
    ext = filename.split('.')[-1]
    # Create path: listings/<listing_id>/<filename>
    return f'listings/{instance.listing.id}/{filename}'


class Listing(models.Model):
    """
    Main Listing model for classified ads.
    Contains all information about a single ad listing.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='listings'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='listings'
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    location = models.CharField(max_length=100)
    is_sold = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Soft delete fields for admin moderation
    is_active = models.BooleanField(default=True)
    deactivated_at = models.DateTimeField(null=True, blank=True)
    deactivation_reason = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['category']),
            models.Index(fields=['is_sold']),
        ]
    
    def __str__(self):
        return self.title
    
    def clean(self):
        """Validate listing data"""
        if self.price < 0:
            raise ValidationError({'price': 'Price cannot be negative'})


class ListingImage(models.Model):
    """
    Model for storing multiple images per listing.
    Includes validation for file size and type.
    """
    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(
        upload_to=listing_image_path,
        validators=[validate_image_size]
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['uploaded_at']
    
    def __str__(self):
        return f"Image for {self.listing.title}"
    
    def clean(self):
        """Validate image count per listing"""
        if self.listing.images.count() >= 5 and not self.pk:
            raise ValidationError('Maximum 5 images allowed per listing')


class SavedListing(models.Model):
    """
    Model for users to save/bookmark listings (wishlist functionality).
    Users can save listings to view later.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='saved_listings'
    )
    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name='saved_by_users'
    )
    saved_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'listing')
        ordering = ['-saved_at']
        indexes = [
            models.Index(fields=['user', '-saved_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} saved {self.listing.title}"


class ListingReport(models.Model):
    """
    Model for users to report inappropriate listings.
    Enables content moderation and community safety.
    """
    REASON_CHOICES = [
        ('spam', 'Spam'),
        ('inappropriate', 'Inappropriate Content'),
        ('fraud', 'Fraudulent Listing'),
        ('duplicate', 'Duplicate Listing'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('reviewed', 'Under Review'),
        ('resolved', 'Resolved - Action Taken'),
        ('dismissed', 'Dismissed - No Action'),
    ]
    
    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name='reports'
    )
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reports_made'
    )
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    description = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reports_reviewed'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['listing', '-created_at']),
        ]
    
    def __str__(self):
        return f"Report for {self.listing.title} by {self.reported_by.username}"


class AdminAction(models.Model):
    """
    Audit log for admin actions.
    Tracks all moderation activities for accountability and transparency.
    """
    ACTION_CHOICES = [
        ('delete_listing', 'Deleted Listing'),
        ('deactivate_listing', 'Deactivated Listing'),
        ('activate_listing', 'Activated Listing'),
        ('suspend_user', 'Suspended User'),
        ('activate_user', 'Activated User'),
        ('resolve_report', 'Resolved Report'),
        ('dismiss_report', 'Dismissed Report'),
    ]
    
    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='admin_actions'
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='actions_received'
    )
    target_listing = models.ForeignKey(
        Listing,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    target_report = models.ForeignKey(
        ListingReport,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['admin', '-created_at']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.admin.username} - {self.get_action_display()}"

