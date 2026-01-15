from rest_framework import generics, permissions
from rest_framework.response import Response
from .models import Listing
from .serializers import ListingListSerializer


class MyListingsView(generics.ListAPIView):
    """
    Get current user's listings.
    Secure endpoint requiring JWT authentication.
    
    GET /api/listings/my-listings/
    """
    serializer_class = ListingListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter listings to only show current user's listings"""
        return Listing.objects.filter(
            user=self.request.user
        ).select_related('user', 'category').prefetch_related('images').order_by('-created_at')
