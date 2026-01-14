from rest_framework import serializers
from .models import ListingReport
from users.models import AdminAction
from listings.serializers import ListingListSerializer
from users.serializers import UserSerializer


class ListingReportSerializer(serializers.ModelSerializer):
    """
    Serializer for listing reports.
    Includes related data for admin review.
    """
    reported_by_username = serializers.CharField(source='reported_by.username', read_only=True)
    reviewed_by_username = serializers.CharField(source='reviewed_by.username', read_only=True, allow_null=True)
    listing_title = serializers.CharField(source='listing.title', read_only=True)
    listing_id = serializers.IntegerField(source='listing.id', read_only=True)
    
    class Meta:
        model = ListingReport
        fields = [
            'id', 'listing', 'listing_id', 'listing_title',
            'reported_by', 'reported_by_username',
            'reason', 'description', 'status',
            'reviewed_by', 'reviewed_by_username',
            'reviewed_at', 'admin_notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['reported_by', 'reviewed_by', 'reviewed_at', 'created_at', 'updated_at']


class ListingReportDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for listing reports with full listing and user data.
    """
    reported_by = UserSerializer(read_only=True)
    reviewed_by = UserSerializer(read_only=True, allow_null=True)
    listing = ListingListSerializer(read_only=True)
    
    class Meta:
        model = ListingReport
        fields = '__all__'


class AdminActionSerializer(serializers.ModelSerializer):
    """
    Serializer for admin action audit log.
    """
    admin_username = serializers.CharField(source='admin.username', read_only=True)
    target_user_username = serializers.CharField(source='target_user.username', read_only=True, allow_null=True)
    target_listing_title = serializers.CharField(source='target_listing.title', read_only=True, allow_null=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = AdminAction
        fields = [
            'id', 'admin', 'admin_username',
            'action', 'action_display',
            'target_user', 'target_user_username',
            'target_listing', 'target_listing_title',
            'target_report', 'notes', 'created_at'
        ]
        read_only_fields = ['admin', 'created_at']
