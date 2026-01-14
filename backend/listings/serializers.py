from rest_framework import serializers
from .models import Listing, ListingImage, SavedListing, ListingReport
from categories.serializers import CategorySerializer
from users.serializers import UserSerializer
from django.core.exceptions import ValidationError as DjangoValidationError
from PIL import Image


class ListingImageSerializer(serializers.ModelSerializer):
    """
    Serializer for listing images with validation.
    Validates file type and size.
    """

    class Meta:
        model = ListingImage
        fields = ['id', 'image', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']

    def validate_image(self, value):
        """
        Validate image file type and size.
        Only allow common image formats and max 5MB.
        """

        # Validate file size (5MB max)
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError(
                "Image file size cannot exceed 5MB"
            )

        # Validate image integrity & format using Pillow
        try:
            img = Image.open(value)
            img.verify()  # verifies image without loading it fully
            format = img.format.lower()
        except Exception:
            raise serializers.ValidationError("Invalid or corrupted image file")

        valid_formats = ['jpeg', 'jpg', 'png', 'gif', 'webp']
        if format not in valid_formats:
            raise serializers.ValidationError(
                f"Invalid image format. Allowed formats: {', '.join(valid_formats)}"
            )

        return value



class ListingSerializer(serializers.ModelSerializer):
    """
    Main serializer for Listing model.
    Includes nested user and category info, and images.
    """
    user = UserSerializer(read_only=True)
    category_detail = CategorySerializer(source='category', read_only=True)
    images = ListingImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False,
        max_length=5,
        help_text="Upload up to 5 images"
    )
    
    class Meta:
        model = Listing
        fields = [
            'id', 'user', 'category', 'category_detail', 'title', 
            'description', 'price', 'location', 'is_sold', 
            'images', 'uploaded_images', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def validate_price(self, value):
        """Validate that price is positive"""
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative")
        if value > 99999999.99:
            raise serializers.ValidationError("Price is too high")
        return value
    
    def validate_title(self, value):
        """Validate title length and content"""
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Title must be at least 5 characters long")
        return value.strip()
    
    def validate_description(self, value):
        """Validate description length"""
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Description must be at least 10 characters long")
        return value.strip()
    
    def validate_uploaded_images(self, value):
        """Validate number of uploaded images"""
        if len(value) > 5:
            raise serializers.ValidationError("Maximum 5 images allowed per listing")
        return value
    
    def create(self, validated_data):
        """Create listing with images"""
        uploaded_images = validated_data.pop('uploaded_images', [])
        listing = Listing.objects.create(**validated_data)
        
        # Create image objects
        for image in uploaded_images:
            ListingImage.objects.create(listing=listing, image=image)
        
        return listing
    
    def update(self, instance, validated_data):
        """Update listing and optionally add new images"""
        uploaded_images = validated_data.pop('uploaded_images', [])
        
        # Update listing fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Add new images (up to the 5 image limit)
        current_image_count = instance.images.count()
        remaining_slots = 5 - current_image_count
        
        for image in uploaded_images[:remaining_slots]:
            ListingImage.objects.create(listing=instance, image=image)
        
        return instance


class ListingListSerializer(serializers.ModelSerializer):
    """
    Optimized serializer for listing list view.
    Includes only essential fields and first image.
    """
    user = UserSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    first_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Listing
        fields = [
            'id', 'user', 'category_name', 'title', 'price', 
            'location', 'is_sold', 'first_image', 'created_at'
        ]
    
    def get_first_image(self, obj):
        """Return URL of first image if exists"""
        first_image = obj.images.first()
        if first_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(first_image.image.url)
            return first_image.image.url
        return None


class SavedListingSerializer(serializers.ModelSerializer):
    """
    Serializer for saved listings (wishlist).
    Includes full listing details when retrieving saved listings.
    """
    listing = ListingListSerializer(read_only=True)
    listing_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = SavedListing
        fields = ['id', 'listing', 'listing_id', 'saved_at']
        read_only_fields = ['id', 'saved_at']
    
    def validate_listing_id(self, value):
        """Validate that listing exists"""
        try:
            Listing.objects.get(id=value)
        except Listing.DoesNotExist:
            raise serializers.ValidationError("Listing does not exist")
        return value
    
    def create(self, validated_data):
        """Create saved listing, preventing duplicates"""
        user = self.context['request'].user
        listing_id = validated_data['listing_id']
        
        # Check if already saved
        if SavedListing.objects.filter(user=user, listing_id=listing_id).exists():
            raise serializers.ValidationError("Listing already saved")
        
        return SavedListing.objects.create(
            user=user,
            listing_id=listing_id
        )
