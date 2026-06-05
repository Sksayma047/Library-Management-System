from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class Book(models.Model):
    isbn = models.CharField(max_length=13, unique=True, db_index=True)
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    available_copies = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    total_copies = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'books'
        ordering = ['title']
        indexes = [
            models.Index(fields=['title']),
            models.Index(fields=['author']),
        ]

    def __str__(self):
        return f"{self.title} by {self.author} (ISBN: {self.isbn})"

    @property
    def is_available(self):
        return self.available_copies > 0


class Member(models.Model):
    member_id = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'members'
        ordering = ['name']
        indexes = [models.Index(fields=['email'])]

    def __str__(self):
        return f"{self.name} ({self.member_id})"


class BorrowHistory(models.Model):
    class Status(models.TextChoices):
        BORROWED = 'BORROWED', 'Borrowed'
        RETURNED = 'RETURNED', 'Returned'
        OVERDUE = 'OVERDUE', 'Overdue'

    member = models.ForeignKey(Member, on_delete=models.PROTECT, related_name='borrow_histories')
    book = models.ForeignKey(Book, on_delete=models.PROTECT, related_name='borrow_histories')
    borrow_date = models.DateField()
    due_date = models.DateField()
    return_date = models.DateField(blank=True, null=True)
    late_fee = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'),
                                   validators=[MinValueValidator(Decimal('0.00'))])
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.BORROWED, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'borrow_histories'
        ordering = ['-borrow_date']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['due_date']),
        ]

    def __str__(self):
        return f"{self.member.name} borrowed '{self.book.title}' on {self.borrow_date}"