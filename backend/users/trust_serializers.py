from rest_framework import serializers
from .trust_models import UserTrustScore, TrustScoreHistory


class TrustScoreSerializer(serializers.ModelSerializer):
    """Serializer for user trust score"""
    username = serializers.CharField(source='user.username', read_only=True)
    badge_color = serializers.SerializerMethodField()
    badge_icon = serializers.SerializerMethodField()
    
    class Meta:
        model = UserTrustScore
        fields = [
            'score', 'trust_level', 'username',
            'account_age_score', 'verification_score',
            'listing_quality_score', 'transaction_score', 'behavior_score',
            'email_verified', 'phone_verified',
            'total_listings', 'sold_listings',
            'badge_color', 'badge_icon',
            'last_calculated'
        ]
        read_only_fields = fields
    
    def get_badge_color(self, obj):
        """Get badge color based on trust level"""
        colors = {
            'new': 'gray',
            'basic': 'blue',
            'trusted': 'green',
            'verified': 'purple',
            'elite': 'gold',
        }
        return colors.get(obj.trust_level, 'gray')
    
    def get_badge_icon(self, obj):
        """Get badge icon based on trust level"""
        icons = {
            'new': '🆕',
            'basic': '✓',
            'trusted': '✓✓',
            'verified': '✓✓✓',
            'elite': '⭐',
        }
        return icons.get(obj.trust_level, '')


class TrustScoreHistorySerializer(serializers.ModelSerializer):
    """Serializer for trust score history"""
    class Meta:
        model = TrustScoreHistory
        fields = ['score', 'trust_level', 'reason', 'created_at']
        read_only_fields = fields
