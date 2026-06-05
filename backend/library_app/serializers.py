from rest_framework import serializers
from django.utils import timezone
from datetime import date, timedelta
from .models import Book, Member, BorrowHistory


class BookSerializer(serializers.ModelSerializer):
    is_available = serializers.ReadOnlyField()

    class Meta:
        model = Book
        fields = ['id', 'isbn', 'title', 'author', 'available_copies',
                  'total_copies', 'is_available', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        available = data.get('available_copies', 0)
        total = data.get('total_copies', 1)
        if available > total:
            raise serializers.ValidationError(
                "available_copies cannot exceed total_copies."
            )
        return data


class BookSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ['id', 'isbn', 'title', 'author', 'available_copies']


class MemberSerializer(serializers.ModelSerializer):
    active_borrows_count = serializers.SerializerMethodField()

    class Meta:
        model = Member
        fields = ['id', 'member_id', 'name', 'email', 'phone',
                  'active_borrows_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_active_borrows_count(self, obj):
        return obj.borrow_histories.filter(status__in=['BORROWED', 'OVERDUE']).count()


class MemberSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = ['id', 'member_id', 'name', 'email']


class BorrowHistorySerializer(serializers.ModelSerializer):
    member_detail = MemberSummarySerializer(source='member', read_only=True)
    book_detail = BookSummarySerializer(source='book', read_only=True)
    member = serializers.PrimaryKeyRelatedField(queryset=Member.objects.all())
    book = serializers.PrimaryKeyRelatedField(queryset=Book.objects.all())

    class Meta:
        model = BorrowHistory
        fields = ['id', 'member', 'member_detail', 'book', 'book_detail',
                  'borrow_date', 'due_date', 'return_date', 'late_fee', 'status',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'late_fee', 'status', 'created_at', 'updated_at']

    def validate(self, data):
        book = data.get('book')
        if self.instance is None and book and book.available_copies <= 0:
            raise serializers.ValidationError(
                f"Book '{book.title}' has no available copies."
            )
        borrow_date = data.get('borrow_date', date.today())
        due_date = data.get('due_date')
        if due_date and due_date <= borrow_date:
            raise serializers.ValidationError("due_date must be after borrow_date.")
        return data


class ReturnBookSerializer(serializers.Serializer):
    return_date = serializers.DateField(default=date.today)

    def validate_return_date(self, value):
        if value > date.today():
            raise serializers.ValidationError("Return date cannot be in the future.")
        return value


class DashboardStatsSerializer(serializers.Serializer):
    total_books = serializers.IntegerField()
    total_members = serializers.IntegerField()
    active_borrows = serializers.IntegerField()
    overdue_borrows = serializers.IntegerField()
    available_books = serializers.IntegerField()