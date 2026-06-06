from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsLibrarianOrReadOnly(BasePermission):
    """Allow full access to staff/admin; read-only to others."""
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_staff


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_superuser


class IsAdminRole(BasePermission):
    """Allow access only to authenticated staff or admin (Admin role) users."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser)