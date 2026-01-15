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
            )
    except UserTrustScore.DoesNotExist:
        pass
