from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import SavedListing
from .serializers import SavedListingSerializer


class SavedListingViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing saved listings (wishlist).
    - List: Get user's saved listings
    - Create: Save a listing
    - Delete: Remove saved listing
    """
    serializer_class = SavedListingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return only the current user's saved listings"""
        return SavedListing.objects.filter(user=self.request.user).select_related(
            'listing',
            'listing__user',
            'listing__category'
        ).prefetch_related('listing__images')
    
    def perform_create(self, serializer):
        """Save listing for current user"""
        serializer.save(user=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """Delete saved listing"""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {'message': 'Listing removed from saved items'},
            status=status.HTTP_204_NO_CONTENT
        )
