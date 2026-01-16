"""
SSE (Server-Sent Events) endpoint with JWT authentication
"""
import json
import time
import queue
import logging
from django.http import StreamingHttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .event_manager import event_manager

logger = logging.getLogger(__name__)


def sse_stream(user_id: int):
    """
    Generator function that yields SSE-formatted events.
    Keeps connection open and sends events as they arrive.
    """
    event_queue = event_manager.subscribe(user_id)
    
    try:
        # Send initial connection confirmation
        yield f"event: connected\ndata: {json.dumps({'user_id': user_id, 'timestamp': time.time()})}\n\n"
        
        while True:
            try:
                # Wait for event with timeout (15 seconds)
                # Timeout allows us to send heartbeats
                event = event_queue.get(timeout=15)
                
                # Format as SSE event
                event_type = event['event']
                event_data = json.dumps(event['data'])
                
                yield f"event: {event_type}\ndata: {event_data}\n\n"
                
            except queue.Empty:
                # No event received - send heartbeat to keep connection alive
                yield f"event: heartbeat\ndata: {json.dumps({'timestamp': time.time()})}\n\n"
                
    except GeneratorExit:
        # Client disconnected
        logger.info(f"SSE client disconnected: user {user_id}")
    finally:
        # Always unsubscribe when connection closes
        event_manager.unsubscribe(user_id)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sse_endpoint(request):
    """
    SSE endpoint with JWT authentication.
    
    Usage:
        GET /api/events/stream/
        Authorization: Bearer <jwt_token>
    
    Returns:
        StreamingHttpResponse with text/event-stream content type
    """
    user_id = request.user.id
    logger.info(f"SSE connection established for user {user_id}")
    
    response = StreamingHttpResponse(
        sse_stream(user_id),
        content_type='text/event-stream'
    )
    
    # SSE-specific headers
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'  # Disable nginx buffering
    
    return response
