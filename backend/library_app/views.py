from rest_framework import viewsets, status, filters, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Book, Member, BorrowHistory
from .serializers import (
    BookSerializer, MemberSerializer, BorrowHistorySerializer,
    ReturnBookSerializer, DashboardStatsSerializer, CustomTokenObtainPairSerializer,
    RegisterSerializer
)
from .services import BorrowService, DashboardService
from .permissions import IsLibrarianOrReadOnly, IsAdminRole
from rest_framework_simplejwt.views import TokenObtainPairView

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer










from rest_framework.permissions import AllowAny




class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticated, IsLibrarianOrReadOnly]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['author']
    search_fields = ['title', 'author', 'isbn']
    ordering_fields = ['title', 'author', 'created_at', 'available_copies']
    ordering = ['title']

    def get_queryset(self):
        qs = super().get_queryset()
        available_only = self.request.query_params.get('available_only')
        if available_only and available_only.lower() == 'true':
            qs = qs.filter(available_copies__gt=0)
        return qs


# class BookViewSet(viewsets.ModelViewSet):
#     queryset = Book.objects.all()
#     serializer_class = BookSerializer
#     permission_classes = [AllowAny]










class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.all()
    serializer_class = MemberSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend,
                       filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email', 'member_id']
    ordering_fields = ['name', 'email', 'created_at']
    ordering = ['name']

    def get_permissions(self):
        if self.action == 'me':
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminRole()]

    @action(detail=False, methods=['get', 'put', 'patch'], url_path='me')
    def me(self, request):
        member = Member.objects.filter(email__iexact=request.user.email).first()
        if not member:
            return Response({"detail": "Member profile not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.method == 'GET':
            serializer = self.get_serializer(member)
            return Response(serializer.data)

        # PUT/PATCH: update member details
        serializer = self.get_serializer(member, data=request.data, partial=(request.method == 'PATCH'))
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Update Django User name / email / password if provided in request
        user = request.user
        updated = False
        
        name = request.data.get('name')
        if name:
            names = name.split(' ', 1)
            user.first_name = names[0]
            if len(names) > 1:
                user.last_name = names[1]
            else:
                user.last_name = ''
            updated = True

        email = request.data.get('email')
        if email:
            user.email = email
            updated = True

        password = request.data.get('password')
        if password:
            user.set_password(password)
            updated = True

        if updated:
            user.save()

        return Response(serializer.data)



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

    def get_queryset(self):
        qs = super().get_queryset()
        if not (self.request.user.is_staff or self.request.user.is_superuser):
            # Member can only view their own borrow records
            qs = qs.filter(member__email__iexact=self.request.user.email)
        return qs

    def get_permissions(self):
        if self.action in ['destroy', 'update', 'partial_update', 'mark_overdue']:
            return [IsAuthenticated(), IsAdminRole()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        # Inject member ID into request data if non-admin user is borrowing
        data = request.data.copy()
        if not (request.user.is_staff or request.user.is_superuser):
            member = Member.objects.filter(email__iexact=request.user.email).first()
            if not member:
                return Response(
                    {"detail": "Member profile not found. Please contact the administrator."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            data['member'] = member.id
            
        serializer = self.get_serializer(data=data)
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
    permission_classes = [IsAuthenticated, IsAdminRole]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        data = DashboardService.get_stats()
        serializer = DashboardStatsSerializer(data)
        return Response(serializer.data)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {"detail": "User registered successfully."},
            status=status.HTTP_201_CREATED
        )


