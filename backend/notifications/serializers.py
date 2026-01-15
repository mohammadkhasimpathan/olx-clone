from rest_framework import serializers
from .models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications"""
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message',
            'link_url', 'is_read', 'created_at', 'time_ago'
        ]
        read_only_fields = fields
    
    def get_time_ago(self, obj):
        """Get human-readable time ago"""
        from django.utils import timezone
        diff = timezone.now() - obj.created_at
        
        seconds = diff.total_seconds()
        if seconds < 60:
            return 'Just now'
        elif seconds < 3600:
            minutes = int(seconds / 60)
            return f'{minutes}m ago'
        elif seconds < 86400:
            hours = int(seconds / 3600)
            return f'{hours}h ago'
        elif seconds < 604800:
            days = int(seconds / 86400)
            return f'{days}d ago'
        else:
            return obj.created_at.strftime('%b %d')


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for notification preferences"""
    class Meta:
        model = NotificationPreference
        fields = [
            'enable_in_app', 'enable_email',
            'email_new_message', 'email_listing_sold',
            'email_price_drop', 'email_saved_search',
            'email_digest', 'digest_frequency'
        ]
