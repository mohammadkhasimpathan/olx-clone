from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification, NotificationPreference
from .serializers import NotificationSerializer, NotificationPreferenceSerializer
from .services import NotificationService


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing notifications.
    Users can only see their own notifications.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return notifications for current user"""
        return Notification.objects.filter(recipient=self.request.user)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = NotificationService.get_unread_count(request.user)
        return Response({'count': count})
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a notification as read"""
        notification = self.get_object()
        notification.mark_as_read()
        return Response({'status': 'marked as read'})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        count = NotificationService.mark_all_read(request.user)
        return Response({'status': f'{count} notifications marked as read'})
    
    @action(detail=False, methods=['delete'])
    def clear_read(self, request):
        """Delete all read notifications"""
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=True
        ).delete()[0]
        return Response({'status': f'{count} notifications deleted'})


class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing notification preferences.
    """
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return preferences for current user"""
        return NotificationPreference.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        """Get or update current user's preferences"""
        try:
            preferences = request.user.notification_preferences
        except NotificationPreference.DoesNotExist:
            preferences = NotificationPreference.objects.create(user=request.user)
        
        if request.method == 'GET':
            serializer = self.get_serializer(preferences)
            return Response(serializer.data)
        else:
            serializer = self.get_serializer(preferences, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
