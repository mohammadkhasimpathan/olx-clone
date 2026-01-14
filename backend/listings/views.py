from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Listing, ListingImage
from .serializers import ListingSerializer, ListingListSerializer
from .permissions import IsOwnerOrReadOnly


class ListingViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing listings.
    - List: Public, with filtering and search
    - Create: Authenticated users only
    - Update/Delete: Owner only
    """
    queryset = Listing.objects.select_related('user', 'category').prefetch_related('images').all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_sold', 'location']
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['created_at', 'price']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Use different serializers for list and detail views"""
        if self.action == 'list':
            return ListingListSerializer
        return ListingSerializer
    
    def perform_create(self, serializer):
        """Set the user to the current authenticated user"""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_listings(self, request):
        """
        Custom endpoint to get current user's listings.
        GET /api/listings/my-listings/
        """
        queryset = self.get_queryset().filter(user=request.user)
        
        # Apply filters and search
        queryset = self.filter_queryset(queryset)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated, IsOwnerOrReadOnly])
    def mark_sold(self, request, pk=None):
        """
        Mark a listing as sold.
        PATCH /api/listings/{id}/mark_sold/
        """
        listing = self.get_object()
        listing.is_sold = True
        listing.save()
        serializer = self.get_serializer(listing)
        return Response(serializer.data)
    
    @action(detail=True, methods=['delete'], permission_classes=[permissions.IsAuthenticated, IsOwnerOrReadOnly])
    def delete_image(self, request, pk=None):
        """
        Delete a specific image from a listing.
        DELETE /api/listings/{id}/delete_image/?image_id=<image_id>
        """
        listing = self.get_object()
        image_id = request.query_params.get('image_id')
        
        if not image_id:
            return Response(
                {'error': 'image_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            image = ListingImage.objects.get(id=image_id, listing=listing)
            image.delete()
            return Response(
                {'message': 'Image deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
        except ListingImage.DoesNotExist:
            return Response(
                {'error': 'Image not found'},
                status=status.HTTP_404_NOT_FOUND
            )
