from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ListingViewSet
from .saved_views import SavedListingListView, SavedListingDetailView
from .my_listings_view import MyListingsView

app_name = 'listings'

router = DefaultRouter()
router.register(r'', ListingViewSet, basename='listing')

urlpatterns = [
    # Explicit my-listings endpoint (must be before router)
    path('my-listings/', MyListingsView.as_view(), name='my-listings'),
    
    # Explicit wishlist endpoints (must be before router)
    path('saved/', SavedListingListView.as_view(), name='saved-list'),
    path('saved/<int:pk>/', SavedListingDetailView.as_view(), name='saved-detail'),
    
    # Router URLs (catch-all for listings CRUD)
    path('', include(router.urls)),
]
