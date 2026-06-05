from datetime import date
from decimal import Decimal
from django.db import transaction
from .models import Book, Member, BorrowHistory

LATE_FEE_PER_DAY = Decimal('1.00')


class BookService:
    @staticmethod
    def get_available_books():
        return Book.objects.filter(available_copies__gt=0)

    @staticmethod
    @transaction.atomic
    def decrement_copy(book: Book):
        Book.objects.filter(pk=book.pk, available_copies__gt=0).select_for_update()
        book.refresh_from_db()
        if book.available_copies <= 0:
            raise ValueError(f"No available copies for '{book.title}'.")
        book.available_copies -= 1
        book.save(update_fields=['available_copies'])

    @staticmethod
    @transaction.atomic
    def increment_copy(book: Book):
        book.refresh_from_db()
        if book.available_copies >= book.total_copies:
            raise ValueError("Available copies already at maximum.")
        book.available_copies += 1
        book.save(update_fields=['available_copies'])


class BorrowService:
    @staticmethod
    @transaction.atomic
    def borrow_book(member: Member, book: Book, borrow_date: date, due_date: date) -> BorrowHistory:
        BookService.decrement_copy(book)
        record = BorrowHistory.objects.create(
            member=member,
            book=book,
            borrow_date=borrow_date,
            due_date=due_date,
            status=BorrowHistory.Status.BORROWED,
        )
        return record

    @staticmethod
    @transaction.atomic
    def return_book(borrow_record: BorrowHistory, return_date: date) -> BorrowHistory:
        if borrow_record.status == BorrowHistory.Status.RETURNED:
            raise ValueError("This book has already been returned.")
        late_fee = Decimal('0.00')
        if return_date > borrow_record.due_date:
            days_late = (return_date - borrow_record.due_date).days
            late_fee = days_late * LATE_FEE_PER_DAY
        borrow_record.return_date = return_date
        borrow_record.late_fee = late_fee
        borrow_record.status = BorrowHistory.Status.RETURNED
        borrow_record.save(update_fields=['return_date', 'late_fee', 'status'])
        BookService.increment_copy(borrow_record.book)
        return borrow_record

    @staticmethod
    def mark_overdue_records():
        today = date.today()
        updated = BorrowHistory.objects.filter(
            status=BorrowHistory.Status.BORROWED,
            due_date__lt=today
        ).update(status=BorrowHistory.Status.OVERDUE)
        return updated


class DashboardService:
    @staticmethod
    def get_stats():
        return {
            'total_books': Book.objects.count(),
            'total_members': Member.objects.count(),
            'active_borrows': BorrowHistory.objects.filter(
                status__in=[BorrowHistory.Status.BORROWED, BorrowHistory.Status.OVERDUE]
            ).count(),
            'overdue_borrows': BorrowHistory.objects.filter(
                status=BorrowHistory.Status.OVERDUE
            ).count(),
            'available_books': Book.objects.filter(available_copies__gt=0).count(),
        }