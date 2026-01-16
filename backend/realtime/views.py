"""
SSE (Server-Sent Events) endpoint with JWT authentication
"""
import json
import time
import queue
import logging
from django.http import StreamingHttpResponse
from django.views.decorators.http import require_http_methods
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
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


@require_http_methods(["GET"])
def sse_endpoint(request):
    """
    SSE endpoint with JWT authentication.
    
    Usage:
        GET /api/events/stream/?token=<jwt_token>
    
    Returns:
        StreamingHttpResponse with text/event-stream content type
    """
    # Manual JWT authentication (since we're not using DRF's APIView)
    token = request.GET.get('token')
    
    if not token:
        return StreamingHttpResponse(
            "error: No authentication token provided\n\n",
            content_type='text/event-stream',
            status=401
        )
    
    try:
        # Authenticate using JWT
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        user = jwt_auth.get_user(validated_token)
        
        if not user or not user.is_authenticated:
            raise AuthenticationFailed('Invalid user')
        
        user_id = user.id
        logger.info(f"SSE connection established for user {user_id}")
        
        response = StreamingHttpResponse(
            sse_stream(user_id),
            content_type='text/event-stream'
        )
        
        # SSE-specific headers
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'  # Disable nginx buffering
        
        return response
        
    except (AuthenticationFailed, Exception) as e:
        logger.error(f"SSE authentication failed: {e}")
        return StreamingHttpResponse(
            f"error: Authentication failed\n\n",
            content_type='text/event-stream',
            status=401
        )
