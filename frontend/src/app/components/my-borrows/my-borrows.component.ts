import { Component, OnInit } from '@angular/core';
import { BorrowService } from '../../services/borrow.service';
import { BorrowHistory } from '../../models/borrow.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-my-borrows',
  templateUrl: './my-borrows.component.html',
  styleUrls: ['./my-borrows.component.css']
})
export class MyBorrowsComponent implements OnInit {
  borrows: BorrowHistory[] = [];
  loading = true;
  returningId: number | null = null;

  displayedColumns: string[] = ['title', 'author', 'borrow_date', 'due_date', 'return_date', 'late_fee', 'status', 'actions'];

  constructor(
    private borrowService: BorrowService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadMyBorrows();
  }

  loadMyBorrows(): void {
    this.loading = true;
    // We get the first page of history. For members, getBorrowHistory returns only their own.
    this.borrowService.getBorrowHistory(1).subscribe({
      next: (response) => {
        this.borrows = response.results;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open('Failed to load your borrow history: ' + error.message, 'Close', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  returnBook(borrow: BorrowHistory): void {
    if (borrow.id === undefined) {
      this.snackBar.open('Cannot return book: borrow ID is missing.', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    this.returningId = borrow.id;
    const todayStr = new Date().toISOString().substring(0, 10);

    this.borrowService.returnBook(borrow.id, todayStr).subscribe({
      next: () => {
        this.returningId = null;
        const bookTitle = borrow.book_detail?.title || 'Book';
        this.snackBar.open(`"${bookTitle}" returned successfully!`, 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.loadMyBorrows();
      },
      error: (error) => {
        this.returningId = null;
        this.snackBar.open(error.message || 'Failed to return book.', 'Close', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
