"""
URL configuration for olx_backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from realtime.views import sse_endpoint

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/users/', include('users.urls')),
    path('api/categories/', include('categories.urls')),
    path('api/listings/', include('listings.urls')),
    path('api/chat/', include('chat.urls')),  # Chat & messaging
    path('api/notifications/', include('notifications.urls')),  # Notifications
    path('api/events/stream/', sse_endpoint, name='sse_stream'),  # SSE endpoint
    
    # Admin API endpoints
    path('api/admin/', include('listings.admin_urls')),
    
    # Health Check
    path('api/health/', lambda request: HttpResponse("OK", status=200)),
]

# Media files served by Cloudinary (not local filesystem)
# No need for static() media serving in production
