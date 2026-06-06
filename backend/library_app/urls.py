# pyrefly: ignore [missing-import]
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

from .views import (
    BookViewSet,
    MemberViewSet,
    BorrowHistoryViewSet,
    DashboardViewSet,
    CustomTokenObtainPairView,
    RegisterView
)

router = DefaultRouter()

router.register('books', BookViewSet, basename='book')
router.register('members', MemberViewSet, basename='member')
router.register('borrow-history', BorrowHistoryViewSet, basename='borrow-history')
router.register('dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('', include(router.urls)),
]