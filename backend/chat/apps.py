from django.apps import AppConfig


class ChatConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chat'
    
    def ready(self):
        # Import signal handlers
        import chat.sse_signals  # noqa
    verbose_name = 'Chat & Messaging'
