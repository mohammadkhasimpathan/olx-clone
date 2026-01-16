from rest_framework import serializers
from .models import Conversation, Message
from users.serializers import UserSerializer
from listings.serializers import ListingListSerializer


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Message model"""
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    
    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender', 'sender_username',
            'content', 'message_type', 'offer_amount',
            'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'conversation', 'sender', 'created_at', 'is_read']
    
    def validate_content(self, value):
        """Validate message content with enhanced spam detection"""
        if not value or not value.strip():
            raise serializers.ValidationError("Message content cannot be empty")
        
        if len(value) > 2000:
            raise serializers.ValidationError("Message too long (max 2000 characters)")
        
        # Enhanced spam detection
        spam_keywords = [
            'http://', 'https://', 'www.', '.com', '.net', '.org',
            'whatsapp', 'telegram', 'instagram', 'facebook',
            'call me', 'text me', 'dm me', 'email me'
        ]
        
        content_lower = value.lower()
        
        # Check for spam keywords
        for keyword in spam_keywords:
            if keyword in content_lower:
                raise serializers.ValidationError(
                    "Messages cannot contain URLs or external contact information. "
                    "Please use the platform's messaging system."
                )
        
        # Check for phone number patterns
        import re
        phone_patterns = [
            r'\d{10}',  # 10 digits
            r'\d{3}[-.\s]?\d{3}[-.\s]?\d{4}',  # Phone formats
            r'\+\d{1,3}[-.\s]?\d{10}',  # International
        ]
        
        for pattern in phone_patterns:
            if re.search(pattern, value):
                raise serializers.ValidationError(
                    "Messages cannot contain phone numbers. "
                    "Use the 'Get Contact Number' feature instead."
                )
        
        # Check for excessive repetition (spam)
        words = value.split()
        if len(words) > 5:
            unique_words = set(words)
            if len(unique_words) / len(words) < 0.3:  # Less than 30% unique
                raise serializers.ValidationError(
                    "Message appears to be spam (too repetitive)"
                )
        
        return value.strip()
    
    def validate(self, data):
        """Validate offer messages"""
        if data.get('message_type') == 'offer':
            if not data.get('offer_amount'):
                raise serializers.ValidationError({
                    'offer_amount': 'Offer amount is required for offer messages'
                })
            if data['offer_amount'] <= 0:
                raise serializers.ValidationError({
                    'offer_amount': 'Offer amount must be positive'
                })
        return data


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer for Conversation model"""
    listing = ListingListSerializer(read_only=True)
    buyer = UserSerializer(read_only=True)
    seller = UserSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    other_user = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'listing', 'buyer', 'seller', 'other_user',
            'last_message', 'unread_count', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'buyer', 'seller', 'created_at', 'updated_at']
    
    def get_last_message(self, obj):
        """Get the most recent message"""
        last_msg = obj.messages.last()
        if last_msg:
            return {
                'content': last_msg.content,
                'sender_id': last_msg.sender.id,
                'created_at': last_msg.created_at,
                'is_read': last_msg.is_read
            }
        return None
    
    def get_unread_count(self, obj):
        """Get unread message count for current user"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        
        # Count messages sent by the other user that are unread
        return obj.messages.filter(
            is_read=False
        ).exclude(
            sender=request.user
        ).count()
    
    def get_other_user(self, obj):
        """Get the other participant's info"""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        
        other_user = obj.get_other_user(request.user)
        return UserSerializer(other_user).data


class ConversationCreateSerializer(serializers.Serializer):
    """Serializer for creating a conversation"""
    listing_id = serializers.IntegerField()
    
    def validate_listing_id(self, value):
        """Validate that listing exists"""
        from listings.models import Listing
        try:
            listing = Listing.objects.get(id=value)
        except Listing.DoesNotExist:
            raise serializers.ValidationError("Listing does not exist")
        
        # Prevent seller from chatting with themselves
        request = self.context.get('request')
        if listing.user == request.user:
            raise serializers.ValidationError(
                "You cannot start a conversation with yourself"
            )
        
        return value
