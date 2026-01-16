from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Max, Count
from django.utils import timezone
from datetime import timedelta
from .models import Conversation, Message
from .serializers import (
    ConversationSerializer,
    ConversationCreateSerializer,
    MessageSerializer
)
from .throttles import ChatMessageThrottle, ChatCreateThrottle, BurstThrottle
from listings.models import Listing


class ConversationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing conversations.
    
    list: Get all conversations for the current user
    retrieve: Get a specific conversation
    create: Start a new conversation
    """
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [BurstThrottle]  # Apply burst throttle to all actions
    
    def get_queryset(self):
        """Get conversations where user is buyer OR seller"""
        user = self.request.user
        return Conversation.objects.filter(
            Q(buyer=user) | Q(seller=user)
        ).select_related(
            'buyer',
            'seller',
            'listing',
            'listing__user',
            'listing__category'
        ).prefetch_related(
            'messages'
        ).annotate(
            last_message_time=Max('messages__created_at')
        ).order_by('-last_message_time', '-updated_at')
    
    def create(self, request, *args, **kwargs):
        """Create or get existing conversation with rate limiting"""
        # Apply stricter throttle for conversation creation
        self.throttle_classes = [ChatCreateThrottle]
        self.check_throttles(request)
        
        serializer = ConversationCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        listing_id = serializer.validated_data['listing_id']
        listing = Listing.objects.get(id=listing_id)
        
        # Prevent spam: Check if user created too many conversations recently
        recent_convos = Conversation.objects.filter(
            buyer=request.user,
            created_at__gte=timezone.now() - timedelta(minutes=5)
        ).count()
        
        if recent_convos >= 5:
            return Response(
                {'error': 'Too many conversations created recently. Please wait.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        # Get or create conversation
        conversation, created = Conversation.objects.get_or_create(
            listing=listing,
            buyer=request.user,
            defaults={'seller': listing.user}
        )
        
        # Return conversation
        response_serializer = ConversationSerializer(
            conversation,
            context={'request': request}
        )
        
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark all messages in conversation as read"""
        conversation = self.get_object()
        
        # Mark messages from other user as read
        conversation.messages.filter(
            is_read=False
        ).exclude(
            sender=request.user
        ).update(is_read=True)
        
        return Response({'status': 'messages marked as read'})
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get all messages in a conversation"""
        conversation = self.get_object()
        messages = conversation.messages.select_related('sender').order_by('created_at')
        
        
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], throttle_classes=[ChatMessageThrottle])
    def send_message(self, request, pk=None):
        """Send a message in a conversation (HTTP fallback) with rate limiting"""
        conversation = self.get_object()
        
        # Validate user is part of conversation
        if request.user not in [conversation.buyer, conversation.seller]:
            return Response(
                {'error': 'You are not part of this conversation'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Prevent spam: Check if user sent too many messages recently
        recent_messages = Message.objects.filter(
            conversation=conversation,
            sender=request.user,
            created_at__gte=timezone.now() - timedelta(seconds=10)
        ).count()
        
        if recent_messages >= 5:
            return Response(
                {'error': 'Sending messages too quickly. Please slow down.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        # Check for duplicate messages (same content within 5 seconds)
        duplicate = Message.objects.filter(
            conversation=conversation,
            sender=request.user,
            content=request.data.get('content', ''),
            created_at__gte=timezone.now() - timedelta(seconds=5)
        ).exists()
        
        if duplicate:
            return Response(
                {'error': 'Duplicate message detected. Please wait before sending the same message again.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create message
        serializer = MessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        message = serializer.save(
            conversation=conversation,
            sender=request.user
        )
        
        return Response(
            MessageSerializer(message).data,
            status=status.HTTP_201_CREATED
        )


class MessageViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing messages.
    Messages are created through ConversationViewSet or WebSocket.
    """
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return messages from user's conversations"""
        user = self.request.user
        return Message.objects.filter(
            Q(conversation__buyer=user) | Q(conversation__seller=user)
        ).select_related(
            'conversation',
            'sender'
        ).order_by('-created_at')
