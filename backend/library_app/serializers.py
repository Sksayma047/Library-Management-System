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


from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['username'] = user.username
        if user.is_superuser or user.is_staff:
            token['role'] = 'Admin'
        else:
            token['role'] = 'Member'
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Add custom fields to JSON response body
        if self.user.is_superuser or self.user.is_staff:
            data['role'] = 'Admin'
        else:
            data['role'] = 'Member'
        data['username'] = self.user.username
        return data


from django.contrib.auth.models import User

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=6, style={'input_type': 'password'})
    email = serializers.EmailField()
    name = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate(self, data):
        username = data.get('username')
        email = data.get('email')

        # If a member with this ID exists, check if email matches
        member_by_id = Member.objects.filter(member_id__iexact=username).first()
        if member_by_id and member_by_id.email.lower() != email.lower():
            raise serializers.ValidationError({
                "username": "This Username/Member ID is already assigned to another member's email."
            })

        # If a member with this email exists, check if we can link it
        member_by_email = Member.objects.filter(email__iexact=email).first()
        # If both exist, they should be the same member
        if member_by_id and member_by_email and member_by_id != member_by_email:
            raise serializers.ValidationError({
                "email": "Email conflicts with another member ID."
            })

        return data

    def create(self, validated_data):
        username = validated_data['username']
        password = validated_data['password']
        email = validated_data['email']
        name = validated_data['name']
        phone = validated_data.get('phone', '')

        # Create Django User
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        # Check if Member already exists by email or member_id
        member = (Member.objects.filter(email__iexact=email).first() or 
                  Member.objects.filter(member_id__iexact=username).first())
        
        if member:
            # Update the existing Member record's member_id/username for portal consistency
            member.member_id = username
            if name:
                member.name = name
            if phone:
                member.phone = phone
            member.save()
        else:
            # Create a brand new Member record
            Member.objects.create(
                member_id=username,
                name=name,
                email=email,
                phone=phone
            )

        return user
