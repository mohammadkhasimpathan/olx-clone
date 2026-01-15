from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import SavedListing, Listing
from .serializers import SavedListingSerializer


class SavedListingListView(APIView):
    """
    GET /api/listings/saved/
    - List all saved listings for the authenticated user
    
    POST /api/listings/saved/
    - Add a listing to wishlist
    - Body: {"listing_id": <id>}
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get user's saved listings"""
        saved_listings = SavedListing.objects.filter(
            user=request.user
        ).select_related(
            'listing',
            'listing__user',
            'listing__category'
        ).prefetch_related('listing__images')
        
        serializer = SavedListingSerializer(saved_listings, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request):
        """Add listing to wishlist"""
        serializer = SavedListingSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SavedListingDetailView(APIView):
    """
    DELETE /api/listings/saved/<id>/
    - Remove a saved listing from wishlist
    """
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, pk):
        """Remove listing from wishlist"""
        try:
            saved_listing = SavedListing.objects.get(
                id=pk,
                user=request.user
            )
            saved_listing.delete()
            return Response(
                {'message': 'Listing removed from wishlist'},
                status=status.HTTP_204_NO_CONTENT
            )
        except SavedListing.DoesNotExist:
            return Response(
                {'error': 'Saved listing not found'},
                status=status.HTTP_404_NOT_FOUND
            )
