from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, 'profile') and request.user.profile.role == 'admin'


class IsAdminOrCashier(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, 'profile') and request.user.profile.role in ('admin', 'cashier')
