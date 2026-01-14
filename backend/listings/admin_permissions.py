from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Permission for admin-only endpoints.
    Only staff users (is_staff=True) can access.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_staff


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Admin can do anything, others can only read.
    Useful for endpoints that should be publicly viewable but only admin-modifiable.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and request.user.is_staff
