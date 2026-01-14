from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ListingViewSet
from .saved_views import SavedListingViewSet

app_name = 'listings'

router = DefaultRouter()
router.register(r'', ListingViewSet, basename='listing')
router.register(r'saved', SavedListingViewSet, basename='saved-listing')

urlpatterns = [
    path('', include(router.urls)),
]
