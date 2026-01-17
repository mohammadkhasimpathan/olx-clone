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
            (Q(buyer=user) | Q(seller=user)) & Q(is_active=True)
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
        
        # Get or create conversation - reactivate if deleted
        try:
            conversation = Conversation.objects.get(
                listing=listing,
                buyer=request.user
            )
            # Reactivate if deleted
            if not conversation.is_active:
                conversation.is_active = True
                conversation.save()
            created = False
        except Conversation.DoesNotExist:
            conversation = Conversation.objects.create(
                listing=listing,
                buyer=request.user,
                seller=listing.user
            )
            created = True
        
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
        from django.utils import timezone
        
        conversation = self.get_object()
        
        # Get unread messages from other user
        
        # Filter messages based on user's cleared timestamp (WhatsApp-style)
        if request.user == conversation.buyer and conversation.buyer_cleared_at:
            messages = messages.filter(created_at__gt=conversation.buyer_cleared_at)
        elif request.user == conversation.seller and conversation.seller_cleared_at:
            messages = messages.filter(created_at__gt=conversation.seller_cleared_at)
        unread_messages = conversation.messages.filter(
            is_read=False
        ).exclude(sender=request.user)
        
        # Mark as read
        now = timezone.now()
        message_ids = list(unread_messages.values_list('id', flat=True))
        unread_messages.update(is_read=True, read_at=now)
        
        return Response({'status': 'read', 'count': len(message_ids)}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def hide(self, request, pk=None):
        """Hide conversation for current user (soft delete)"""
        conversation = self.get_object()
        conversation.is_active = False
        conversation.save()
        return Response({'status': 'hidden'}, status=status.HTTP_200_OK)

    
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


class MessageViewSet(viewsets.ModelViewSet):
    """ViewSet for Message model"""
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ChatMessageThrottle]
    
    def get_queryset(self):
        """Filter messages to only those in conversations the user is part of"""
        user_conversations = Conversation.objects.filter(
            Q(buyer=self.request.user) | Q(seller=self.request.user)
        )
        return Message.objects.filter(
            conversation__in=user_conversations
        ).select_related('sender', 'conversation').order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def mark_delivered(self, request, pk=None):
        """Mark message as delivered"""
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        from django.utils import timezone
        
        message = self.get_object()
        
        if not message.is_delivered:
            message.is_delivered = True
            message.delivered_at = timezone.now()
            message.save()
            
            # Broadcast status update to conversation
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'chat_{message.conversation_id}',
                {
                    'type': 'message_status_update',
                    'message_id': message.id,
                    'is_delivered': True,
                    'delivered_at': message.delivered_at.isoformat()
                }
            )
        
        return Response({'status': 'delivered'}, status=status.HTTP_200_OK)


    @action(detail=True, methods=['post'])
    def hide(self, request, pk=None):
        """Clear chat history for current user (WhatsApp-style Delete for Me)"""
        from django.utils import timezone
        import logging
        logger = logging.getLogger(__name__)
        
        conversation = self.get_object()
        
        # Set cleared timestamp based on user role
        if request.user == conversation.buyer:
            conversation.buyer_cleared_at = timezone.now()
            logger.info(f"Buyer cleared conversation {pk}")
        else:
            conversation.seller_cleared_at = timezone.now()
            logger.info(f"Seller cleared conversation {pk}")
        
        conversation.save()
        return Response({'status': 'cleared'}, status=status.HTTP_200_OK)
