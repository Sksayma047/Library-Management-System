import { Component, OnInit, ViewChild } from '@angular/core';
import { Book } from '../../models/book.model';
import { BookService } from '../../services/book.service';
import { MatDialog } from '@angular/material/dialog';
import { BookDialogComponent } from './book-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { BorrowService } from '../../services/borrow.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-books',
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.css']
})
export class BooksComponent implements OnInit {
  books: Book[] = [];
  displayedColumns: string[] = ['isbn', 'title', 'author', 'copies', 'status', 'actions'];
  totalBooks = 0;
  pageSize = 10;
  currentPage = 1;
  searchQuery = '';
  sortQuery = '';
  loading = true;
  borrowingId: number | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private bookService: BookService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public authService: AuthService,
    private borrowService: BorrowService
  ) { }

  ngOnInit(): void {
    this.displayedColumns = ['isbn', 'title', 'author', 'copies', 'status', 'actions'];
    this.loadBooks();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  borrowBook(book: Book): void {
    if (book.id === undefined) {
      this.snackBar.open('Cannot borrow book: ID is missing.', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    this.borrowingId = book.id;
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 14); // 2 weeks default duration

    const borrowData = {
      member: 0, // Frontend dummy, backend will resolve this to request.user.email member
      book: book.id,
      borrow_date: today.toISOString().substring(0, 10),
      due_date: dueDate.toISOString().substring(0, 10)
    };

    this.borrowService.borrowBook(borrowData).subscribe({
      next: () => {
        this.borrowingId = null;
        this.snackBar.open(`"${book.title}" borrowed successfully!`, 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.loadBooks();
      },
      error: (err) => {
        this.borrowingId = null;
        this.snackBar.open(err.error?.detail || err.message || 'Failed to borrow book.', 'Close', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }


  loadBooks(): void {
    this.loading = true;
    this.bookService.getBooks(this.currentPage, this.searchQuery, this.sortQuery).subscribe({
      next: (response) => {
        this.books = response.results;
        this.totalBooks = response.count;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open('Failed to load books: ' + error.message, 'Close', {
          duration: 4000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.loadBooks();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadBooks();
  }

  onSortChange(sort: Sort): void {
    if (!sort.active || sort.direction === '') {
      this.sortQuery = '';
    } else {
      this.sortQuery = (sort.direction === 'desc' ? '-' : '') + sort.active;
    }
    this.currentPage = 1;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.loadBooks();
  }

  openAddBookDialog(): void {
    const dialogRef = this.dialog.open(BookDialogComponent, {
      width: '450px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadBooks();
      }
    });
  }

  openEditBookDialog(book: Book): void {
    const dialogRef = this.dialog.open(BookDialogComponent, {
      width: '450px',
      data: { book }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadBooks();
      }
    });
  }

  deleteBook(book: Book): void {
    if (confirm(`Are you sure you want to delete "${book.title}"?`)) {
      this.loading = true;
      this.bookService.deleteBook(book.id!).subscribe({
        next: () => {
          this.snackBar.open('Book deleted successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.loadBooks();
        },
        error: (err) => {
          this.loading = false;
          this.snackBar.open(err.message || 'Failed to delete book', 'Close', {
            duration: 4000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }
}
