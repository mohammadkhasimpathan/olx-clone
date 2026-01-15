from django.contrib import admin
from .models import Conversation, Message


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'listing', 'buyer', 'seller', 'is_active', 'created_at', 'updated_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['listing__title', 'buyer__username', 'seller__username']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'conversation', 'sender', 'message_type', 'is_read', 'created_at']
    list_filter = ['message_type', 'is_read', 'created_at']
    search_fields = ['content', 'sender__username']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
