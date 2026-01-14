from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Q
from .models import Listing, ListingReport
from .admin_serializers import ListingReportSerializer, ListingReportDetailSerializer, AdminActionSerializer
from .admin_permissions import IsAdminUser
from listings.serializers import ListingSerializer
from users.models import User, AdminAction
from users.serializers import UserSerializer


class AdminListingViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for managing all listings.
    Includes soft delete (deactivate) and hard delete.
    """
    permission_classes = [IsAdminUser]
    serializer_class = ListingSerializer
    
    def get_queryset(self):
        """Return all listings including inactive ones"""
        return Listing.objects.all().select_related('user', 'category').prefetch_related('images')
    
    @action(detail=True, methods=['patch'])
    def deactivate(self, request, pk=None):
        """Soft delete a listing"""
        listing = self.get_object()
        reason = request.data.get('reason', '')
        
        listing.is_active = False
        listing.deactivated_at = timezone.now()
        listing.deactivation_reason = reason
        listing.save()
        
        # Log admin action
        AdminAction.objects.create(
            admin=request.user,
            action='deactivate_listing',
            target_listing=listing,
            notes=reason
        )
        
        return Response({'status': 'listing deactivated'})
    
    @action(detail=True, methods=['patch'])
    def activate(self, request, pk=None):
        """Reactivate a listing"""
        listing = self.get_object()
        
        listing.is_active = True
        listing.deactivated_at = None
        listing.deactivation_reason = ''
        listing.save()
        
        # Log admin action
        AdminAction.objects.create(
            admin=request.user,
            action='activate_listing',
            target_listing=listing
        )
        
        return Response({'status': 'listing activated'})
    
    def destroy(self, request, *args, **kwargs):
        """Hard delete a listing"""
        listing = self.get_object()
        
        # Log admin action before deletion
        AdminAction.objects.create(
            admin=request.user,
            action='delete_listing',
            notes=f"Deleted listing: {listing.title}"
        )
        
        return super().destroy(request, *args, **kwargs)


class AdminUserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin viewset for managing users.
    Read-only with custom actions for suspend/activate.
    """
    permission_classes = [IsAdminUser]
    serializer_class = UserSerializer
    
    def get_queryset(self):
        """Return all users with listing counts"""
        return User.objects.annotate(
            listings_count=Count('listings'),
            reports_made_count=Count('reports_made')
        )
    
    @action(detail=True, methods=['patch'])
    def suspend(self, request, pk=None):
        """Suspend a user"""
        user = self.get_object()
        reason = request.data.get('reason', '')
        
        user.is_suspended = True
        user.suspended_at = timezone.now()
        user.suspension_reason = reason
        user.save()
        
        # Log admin action
        AdminAction.objects.create(
            admin=request.user,
            action='suspend_user',
            target_user=user,
            notes=reason
        )
        
        return Response({'status': 'user suspended'})
    
    @action(detail=True, methods=['patch'])
    def activate(self, request, pk=None):
        """Activate a suspended user"""
        user = self.get_object()
        
        user.is_suspended = False
        user.suspended_at = None
        user.suspension_reason = ''
        user.save()
        
        # Log admin action
        AdminAction.objects.create(
            admin=request.user,
            action='activate_user',
            target_user=user
        )
        
        return Response({'status': 'user activated'})


class AdminReportViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for managing listing reports.
    """
    permission_classes = [IsAdminUser]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ListingReportDetailSerializer
        return ListingReportSerializer
    
    def get_queryset(self):
        """Return all reports with related data"""
        return ListingReport.objects.select_related(
            'listing', 'reported_by', 'reviewed_by'
        )
    
    def update(self, request, *args, **kwargs):
        """Update report status and log admin action"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Set reviewed_by and reviewed_at if status is changing
        if 'status' in request.data and instance.status != request.data['status']:
            request.data['reviewed_by'] = request.user.id
            instance.reviewed_by = request.user
            instance.reviewed_at = timezone.now()
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Log admin action
        action_type = 'resolve_report' if request.data.get('status') == 'resolved' else 'dismiss_report'
        AdminAction.objects.create(
            admin=request.user,
            action=action_type,
            target_report=instance,
            notes=request.data.get('admin_notes', '')
        )
        
        return Response(serializer.data)


class AdminStatsViewSet(viewsets.ViewSet):
    """
    Admin viewset for dashboard statistics.
    """
    permission_classes = [IsAdminUser]
    
    def list(self, request):
        """Get dashboard statistics"""
        today = timezone.now().date()
        
        stats = {
            'total_users': User.objects.count(),
            'active_users': User.objects.filter(is_active=True, is_suspended=False).count(),
            'suspended_users': User.objects.filter(is_suspended=True).count(),
            'total_listings': Listing.objects.count(),
            'active_listings': Listing.objects.filter(is_active=True, is_sold=False).count(),
            'inactive_listings': Listing.objects.filter(is_active=False).count(),
            'sold_listings': Listing.objects.filter(is_sold=True).count(),
            'pending_reports': ListingReport.objects.filter(status='pending').count(),
            'resolved_reports': ListingReport.objects.filter(status='resolved').count(),
            'new_users_today': User.objects.filter(created_at__date=today).count(),
            'new_listings_today': Listing.objects.filter(created_at__date=today).count(),
        }
        
        return Response(stats)


class AdminActionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin viewset for viewing audit log.
    Read-only to preserve audit trail integrity.
    """
    permission_classes = [IsAdminUser]
    serializer_class = AdminActionSerializer
    queryset = AdminAction.objects.select_related('admin', 'target_user', 'target_listing')
