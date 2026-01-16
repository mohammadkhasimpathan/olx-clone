from django.apps import AppConfig


class ChatConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chat'
    
    def ready(self):
        # Import signal handlers (Channels-based, not SSE)
        pass  # Signals are now handled via Channels consumers
