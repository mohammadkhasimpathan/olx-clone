from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import timedelta


class UserTrustScore(models.Model):
    """
    Trust and reputation score for users.
    Composite score based on multiple signals.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='trust_score'
    )
    
    # Overall trust score (0-100)
    score = models.IntegerField(
        default=50,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Overall trust score (0-100)"
    )
    
    # Component scores
    account_age_score = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(20)])
    verification_score = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(20)])
    listing_quality_score = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(20)])
    transaction_score = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(20)])
    behavior_score = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(20)])
    
    # Trust level (derived from score)
    TRUST_LEVELS = (
        ('new', 'New User'),
        ('basic', 'Basic'),
        ('trusted', 'Trusted'),
        ('verified', 'Verified'),
        ('elite', 'Elite'),
    )
    trust_level = models.CharField(max_length=10, choices=TRUST_LEVELS, default='new')
    
    # Verification flags
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)
    
    # Activity metrics
    total_listings = models.IntegerField(default=0)
    active_listings = models.IntegerField(default=0)
    sold_listings = models.IntegerField(default=0)
    total_messages_sent = models.IntegerField(default=0)
    total_conversations = models.IntegerField(default=0)
    
    # Negative signals
    reports_received = models.IntegerField(default=0)
    spam_violations = models.IntegerField(default=0)
    
    # Timestamps
    last_calculated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-score']
        indexes = [
            models.Index(fields=['-score']),
            models.Index(fields=['trust_level']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - Score: {self.score} ({self.trust_level})"
    
    def calculate_score(self):
        """Calculate overall trust score from components"""
        # Account age score (0-20)
        account_age = timezone.now() - self.user.date_joined
        if account_age.days >= 365:
            self.account_age_score = 20
        elif account_age.days >= 180:
            self.account_age_score = 15
        elif account_age.days >= 90:
            self.account_age_score = 10
        elif account_age.days >= 30:
            self.account_age_score = 5
        else:
            self.account_age_score = 0
        
        # Verification score (0-20)
        self.verification_score = 0
        if self.email_verified:
            self.verification_score += 10
        if self.phone_verified:
            self.verification_score += 10
        
        # Listing quality score (0-20)
        if self.total_listings > 0:
            completion_rate = self.sold_listings / self.total_listings
            self.listing_quality_score = min(20, int(completion_rate * 20) + min(10, self.total_listings))
        else:
            self.listing_quality_score = 0
        
        # Transaction score (0-20)
        if self.sold_listings >= 50:
            self.transaction_score = 20
        elif self.sold_listings >= 20:
            self.transaction_score = 15
        elif self.sold_listings >= 10:
            self.transaction_score = 10
        elif self.sold_listings >= 5:
            self.transaction_score = 5
        else:
            self.transaction_score = 0
        
        # Behavior score (0-20)
        self.behavior_score = 20
        # Deduct for negative signals
        self.behavior_score -= min(10, self.reports_received * 2)
        self.behavior_score -= min(10, self.spam_violations * 5)
        self.behavior_score = max(0, self.behavior_score)
        
        # Calculate total score
        self.score = (
            self.account_age_score +
            self.verification_score +
            self.listing_quality_score +
            self.transaction_score +
            self.behavior_score
        )
        
        # Determine trust level
        if self.score >= 80:
            self.trust_level = 'elite'
        elif self.score >= 60:
            self.trust_level = 'verified'
        elif self.score >= 40:
            self.trust_level = 'trusted'
        elif self.score >= 20:
            self.trust_level = 'basic'
        else:
            self.trust_level = 'new'
        
        self.save()
        return self.score
    
    def update_metrics(self):
        """Update activity metrics from related models"""
        from listings.models import Listing
        from chat.models import Message, Conversation
        
        # Update listing metrics
        user_listings = Listing.objects.filter(user=self.user)
        self.total_listings = user_listings.count()
        self.active_listings = user_listings.filter(is_sold=False).count()
        self.sold_listings = user_listings.filter(is_sold=True).count()
        
        # Update messaging metrics
        self.total_messages_sent = Message.objects.filter(sender=self.user).count()
        self.total_conversations = Conversation.objects.filter(
            models.Q(buyer=self.user) | models.Q(seller=self.user)
        ).count()
        
        # Update verification flags
        self.email_verified = self.user.is_verified
        self.phone_verified = bool(self.user.phone_number)
        
        self.save()


class TrustScoreHistory(models.Model):
    """Track trust score changes over time"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='trust_history'
    )
    score = models.IntegerField()
    trust_level = models.CharField(max_length=10)
    reason = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.score} at {self.created_at}"
