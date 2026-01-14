from rest_framework import serializers
from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for Category model.
    Includes listing count for each category.
    """
    listing_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'icon', 'listing_count', 'created_at']
        read_only_fields = ['id', 'slug', 'created_at']
    
    def get_listing_count(self, obj):
        """Return count of active (non-sold) listings in this category"""
        return obj.listings.filter(is_sold=False).count()
