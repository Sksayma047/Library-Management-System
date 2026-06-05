from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BookViewSet,
    MemberViewSet,
    BorrowHistoryViewSet,
    DashboardViewSet
)

router = DefaultRouter()
router.register('books', BookViewSet, basename='book')
router.register('members', MemberViewSet, basename='55')
router.register('borrow-history', BorrowHistoryViewSet, basename='borrow-history')
router.register('dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
]