from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import SavedListing
from .serializers import SavedListingSerializer


class SavedListingViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing saved listings (wishlist).
    
    Allowed methods:
    - GET /api/listings/saved/ - List user's saved listings
    - POST /api/listings/saved/ - Save a listing (requires listing_id in body)
    - DELETE /api/listings/saved/{id}/ - Remove saved listing
    """
    serializer_class = SavedListingSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']  # Explicitly allow only these methods
    
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
    
    def create(self, request, *args, **kwargs):
        """Create a saved listing"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    def destroy(self, request, *args, **kwargs):
        """Delete saved listing"""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {'message': 'Listing removed from saved items'},
            status=status.HTTP_204_NO_CONTENT
        )
