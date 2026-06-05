from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Book, Member, BorrowHistory
from .serializers import (
    BookSerializer, MemberSerializer, BorrowHistorySerializer,
    ReturnBookSerializer, DashboardStatsSerializer
)
from .services import BorrowService, DashboardService
from .permissions import IsLibrarianOrReadOnly









from rest_framework.permissions import AllowAny




# class BookViewSet(viewsets.ModelViewSet):
#     queryset = Book.objects.all()
#     serializer_class = BookSerializer
#     permission_classes = [IsAuthenticated]
#     filter_backends = [DjangoFilterBackend,
#                        filters.SearchFilter, filters.OrderingFilter]
#     filterset_fields = ['author']
#     search_fields = ['title', 'author', 'isbn']
#     ordering_fields = ['title', 'author', 'created_at', 'available_copies']
#     ordering = ['title']

#     def get_queryset(self):
#         qs = super().get_queryset()
#         available_only = self.request.query_params.get('available_only')
#         if available_only and available_only.lower() == 'true':
#             qs = qs.filter(available_copies__gt=0)
#         return qs


class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [AllowAny]










class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.all()
    serializer_class = MemberSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email', 'member_id']
    ordering_fields = ['name', 'email', 'created_at']
    ordering = ['name']


class BorrowHistoryViewSet(viewsets.ModelViewSet):
    queryset = BorrowHistory.objects.select_related('member', 'book').all()
    serializer_class = BorrowHistorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'member', 'book']
    search_fields = ['member__name', 'book__title', 'member__member_id']
    ordering_fields = ['borrow_date', 'due_date', 'return_date']
    ordering = ['-borrow_date']
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vd = serializer.validated_data
        try:
            record = BorrowService.borrow_book(
                member=vd['member'],
                book=vd['book'],
                borrow_date=vd['borrow_date'],
                due_date=vd['due_date'],
            )
            return Response(
                BorrowHistorySerializer(record).data,
                status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='return')
    def return_book(self, request, pk=None):
        record = self.get_object()
        serializer = ReturnBookSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            updated = BorrowService.return_book(
                borrow_record=record,
                return_date=serializer.validated_data['return_date'],
            )
            return Response(BorrowHistorySerializer(updated).data)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='mark-overdue')
    def mark_overdue(self, request):
        count = BorrowService.mark_overdue_records()
        return Response({'updated': count, 'message': f'{count} records marked as overdue.'})


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        data = DashboardService.get_stats()
        serializer = DashboardStatsSerializer(data)
        return Response(serializer.data)
