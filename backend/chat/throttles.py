from rest_framework.throttling import UserRateThrottle


class ChatMessageThrottle(UserRateThrottle):
    """
    Throttle for chat message sending.
    Limit: 60 messages per minute (1 per second average)
    """
    scope = 'chat_messages'


class ChatCreateThrottle(UserRateThrottle):
    """
    Throttle for creating new conversations.
    Limit: 10 new conversations per minute
    """
    scope = 'chat_create'


class BurstThrottle(UserRateThrottle):
    """
    Burst throttle for sensitive operations.
    Limit: 20 requests per minute
    """
    scope = 'burst'
