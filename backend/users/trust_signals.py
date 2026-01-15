from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User
from .trust_models import UserTrustScore, TrustScoreHistory


@receiver(post_save, sender=User)
def create_trust_score(sender, instance, created, **kwargs):
    """Create trust score when user is created"""
    if created:
        UserTrustScore.objects.create(user=instance)


@receiver(post_save, sender=User)
def update_trust_score_verification(sender, instance, **kwargs):
    """Update trust score when user verification changes"""
    try:
        trust_score = instance.trust_score
        old_score = trust_score.score
        
        # Update verification flags
        trust_score.email_verified = instance.is_verified
        trust_score.phone_verified = bool(instance.phone_number)
        
        # Recalculate score
        trust_score.calculate_score()
        
        # Log if score changed significantly
        if abs(trust_score.score - old_score) >= 5:
            TrustScoreHistory.objects.create(
                user=instance,
                score=trust_score.score,
                trust_level=trust_score.trust_level,
                reason='Verification status updated'
            )
    except UserTrustScore.DoesNotExist:
        pass
