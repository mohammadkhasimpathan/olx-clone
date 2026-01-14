from django.contrib import admin
from .models import Listing, ListingImage


class ListingImageInline(admin.TabularInline):
    """Inline admin for listing images"""
    model = ListingImage
    extra = 1
    max_num = 5


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    """Admin configuration for Listing model"""
    list_display = ['title', 'user', 'category', 'price', 'location', 'is_sold', 'created_at']
    list_filter = ['is_sold', 'category', 'created_at']
    search_fields = ['title', 'description', 'location', 'user__username']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [ListingImageInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'category', 'title', 'description')
        }),
        ('Pricing & Location', {
            'fields': ('price', 'location')
        }),
        ('Status', {
            'fields': ('is_sold',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ListingImage)
class ListingImageAdmin(admin.ModelAdmin):
    """Admin configuration for ListingImage model"""
    list_display = ['listing', 'uploaded_at']
    list_filter = ['uploaded_at']
    search_fields = ['listing__title']
    readonly_fields = ['uploaded_at']
