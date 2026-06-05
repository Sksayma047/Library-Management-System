import { Component, OnInit, ViewChild } from '@angular/core';
import { BorrowHistory, BorrowStatus } from '../../models/borrow.model';
import { BorrowService } from '../../services/borrow.service';
import { MatDialog } from '@angular/material/dialog';
import { BorrowDialogComponent } from './borrow-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-borrow-history',
  templateUrl: './borrow-history.component.html',
  styleUrls: ['./borrow-history.component.css']
})
export class BorrowHistoryComponent implements OnInit {
  records: BorrowHistory[] = [];
  displayedColumns: string[] = ['member', 'book', 'borrow_date', 'due_date', 'return_date', 'late_fee', 'status', 'actions'];
  totalRecords = 0;
  pageSize = 10;
  currentPage = 1;
  searchQuery = '';
  statusFilter = '';
  loading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private borrowService: BorrowService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadRecords();
  }

  loadRecords(): void {
    this.loading = true;
    this.borrowService.getBorrowHistory(this.currentPage, this.searchQuery, this.statusFilter).subscribe({
      next: (response) => {
        this.records = response.results;
        this.totalRecords = response.count;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open('Failed to load borrow logs: ' + error.message, 'Close', {
          duration: 4000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onSearchOrFilter(): void {
    this.currentPage = 1;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.loadRecords();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadRecords();
  }

  openIssueBookDialog(): void {
    const dialogRef = this.dialog.open(BorrowDialogComponent, {
      width: '450px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadRecords();
      }
    });
  }

  returnBook(record: BorrowHistory): void {
    const today = new Date().toISOString().substring(0, 10);
    if (confirm(`Confirm return of "${record.book_detail?.title}" by "${record.member_detail?.name}" today (${today})?`)) {
      this.loading = true;
      this.borrowService.returnBook(record.id!, today).subscribe({
        next: (updatedRecord) => {
          this.snackBar.open(
            `Book returned successfully! Late fee: $${updatedRecord.late_fee}`, 
            'Close', 
            { duration: 5000, panelClass: ['success-snackbar'] }
          );
          this.loadRecords();
        },
        error: (err) => {
          this.loading = false;
          this.snackBar.open(err.message || 'Failed to process return', 'Close', {
            duration: 4000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  canReturn(record: BorrowHistory): boolean {
    return record.status === BorrowStatus.BORROWED || record.status === BorrowStatus.OVERDUE;
  }
}
