from django.contrib import admin
from .models import Notification, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'recipient', 'notification_type', 'title', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['recipient__username', 'title', 'message']
    readonly_fields = ['created_at', 'read_at']
    date_hierarchy = 'created_at'


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'enable_in_app', 'enable_email', 'email_digest']
    list_filter = ['enable_in_app', 'enable_email', 'email_digest']
    search_fields = ['user__username']
