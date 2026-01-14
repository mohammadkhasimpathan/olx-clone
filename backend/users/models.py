from django.contrib.auth.models import AbstractUser
from django.db import models


class PendingRegistration(models.Model):
    """
    Temporary storage for registration data before OTP verification.
    User account is NOT created until OTP is successfully verified.
    """
    email = models.EmailField(unique=True, db_index=True)
    username = models.CharField(max_length=150)
    password_hash = models.CharField(max_length=128)  # Pre-hashed password
    phone_number = models.CharField(max_length=15, blank=True)
    location = models.CharField(max_length=100, blank=True)
    
    # OTP fields (security features)
    otp_hash = models.CharField(max_length=128)  # Hashed OTP for security
    otp_created_at = models.DateTimeField(auto_now_add=True)
    otp_attempts = models.IntegerField(default=0)  # Track failed attempts
    last_resend_at = models.DateTimeField(null=True, blank=True)  # For cooldown
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['otp_created_at']),
        ]
        verbose_name = 'Pending Registration'
        verbose_name_plural = 'Pending Registrations'
    
    def __str__(self):
        return f"{self.email} - Pending"


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    Adds phone number, location, email verification, and password reset functionality.
    """
    # Profile fields
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    
    # Email verification fields
    email_verified = models.BooleanField(default=False)
    email_otp = models.CharField(max_length=6, blank=True, null=True)
    email_otp_created_at = models.DateTimeField(blank=True, null=True)
    
    # Password reset fields
    reset_otp = models.CharField(max_length=6, blank=True, null=True)
    reset_otp_created_at = models.DateTimeField(blank=True, null=True)
    
    # User suspension fields for admin moderation
    is_suspended = models.BooleanField(default=False)
    suspended_at = models.DateTimeField(null=True, blank=True)
    suspension_reason = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.username


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
        User,
        on_delete=models.CASCADE,
        related_name='admin_actions'
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    target_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='actions_received'
    )
    target_listing = models.ForeignKey(
        'listings.Listing',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    target_report = models.ForeignKey(
        'listings.ListingReport',
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
