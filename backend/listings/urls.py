from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ListingViewSet
from .saved_views import SavedListingViewSet
from .my_listings_view import MyListingsView

app_name = 'listings'

router = DefaultRouter()
router.register(r'', ListingViewSet, basename='listing')
router.register(r'saved', SavedListingViewSet, basename='saved-listing')

urlpatterns = [
    # Explicit my-listings endpoint (must be before router)
    path('my-listings/', MyListingsView.as_view(), name='my-listings'),
    
    # Router URLs
    path('', include(router.urls)),
]
