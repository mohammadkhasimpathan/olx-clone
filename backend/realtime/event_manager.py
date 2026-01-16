"""
Real-time event management for SSE (Server-Sent Events)
Thread-safe in-memory event dispatcher
"""
import threading
import queue
import time
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


class EventManager:
    """
    Thread-safe in-memory event manager for SSE.
    Manages per-user event queues and event publishing.
    """
    
    def __init__(self):
        self._subscribers: Dict[int, queue.Queue] = {}
        self._lock = threading.Lock()
    
    def subscribe(self, user_id: int) -> queue.Queue:
        """
        Subscribe a user to receive events.
        Returns a queue that will receive events for this user.
        """
        with self._lock:
            if user_id not in self._subscribers:
                # Create queue with max size to prevent memory issues
                self._subscribers[user_id] = queue.Queue(maxsize=100)
                logger.info(f"User {user_id} subscribed to SSE")
            return self._subscribers[user_id]
    
    def unsubscribe(self, user_id: int):
        """Unsubscribe a user from events"""
        with self._lock:
            if user_id in self._subscribers:
                self._subscribers.pop(user_id)
                logger.info(f"User {user_id} unsubscribed from SSE")
    
    def publish(self, user_id: int, event_type: str, data: dict):
        """
        Publish an event to a specific user.
        If user is not subscribed, event is dropped.
        If queue is full, oldest event is dropped.
        """
        with self._lock:
            if user_id in self._subscribers:
                event = {
                    'event': event_type,
                    'data': data,
                    'timestamp': time.time()
                }
                
                try:
                    # Try to add event to queue
                    self._subscribers[user_id].put_nowait(event)
                    logger.debug(f"Published {event_type} to user {user_id}")
                except queue.Full:
                    # Queue full - drop oldest event and add new one
                    try:
                        self._subscribers[user_id].get_nowait()
                        self._subscribers[user_id].put_nowait(event)
                        logger.warning(f"Queue full for user {user_id}, dropped oldest event")
                    except:
                        logger.error(f"Failed to publish event to user {user_id}")
    
    def get_subscriber_count(self) -> int:
        """Get number of active subscribers (for monitoring)"""
        with self._lock:
            return len(self._subscribers)


# Global singleton instance
event_manager = EventManager()
