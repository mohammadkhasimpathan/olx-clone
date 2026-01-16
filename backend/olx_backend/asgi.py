"""
ASGI config for olx_backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import OriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'olx_backend.settings')

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

# Import routing after Django setup
from chat.routing import websocket_urlpatterns as chat_patterns
from notifications.routing import websocket_urlpatterns as notification_patterns

# Allowed origins for WebSocket connections
ALLOWED_ORIGINS = [
    "https://olx-clone-frontend-vgcs.onrender.com",
    "http://localhost:5173",
    "http://localhost:3000",
]

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": OriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                chat_patterns + notification_patterns
            )
        ),
        ALLOWED_ORIGINS
    ),
})
