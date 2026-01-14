from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import (
    AdminListingViewSet,
    AdminUserViewSet,
    AdminReportViewSet,
    AdminStatsViewSet,
    AdminActionViewSet
)

router = DefaultRouter()
router.register(r'listings', AdminListingViewSet, basename='admin-listing')
router.register(r'users', AdminUserViewSet, basename='admin-user')
router.register(r'reports', AdminReportViewSet, basename='admin-report')
router.register(r'stats', AdminStatsViewSet, basename='admin-stats')
router.register(r'audit-log', AdminActionViewSet, basename='admin-audit')

urlpatterns = [
    path('', include(router.urls)),
]
