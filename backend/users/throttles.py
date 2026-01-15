from rest_framework.throttling import AnonRateThrottle


class LoginThrottle(AnonRateThrottle):
    """
    Throttle for login attempts.
    Limit: 5 login attempts per 15 minutes per IP
    """
    scope = 'login'
    
    def get_cache_key(self, request, view):
        """
        Use IP address for throttling to prevent brute force attacks
        """
        if request.user.is_authenticated:
            return None  # Don't throttle authenticated users
        
        # Get client IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        return f'throttle_login_{ip}'
