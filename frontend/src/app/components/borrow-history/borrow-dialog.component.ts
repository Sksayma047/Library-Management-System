import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Book } from '../../models/book.model';
import { Member } from '../../models/member.model';
import { BookService } from '../../services/book.service';
import { MemberService } from '../../services/member.service';
import { BorrowService } from '../../services/borrow.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-borrow-dialog',
  templateUrl: './borrow-dialog.component.html',
  styles: [`
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 350px;
      margin-top: 16px;
    }
    .full-width {
      width: 100%;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 24px;
    }
  `]
})
export class BorrowDialogComponent implements OnInit {
  borrowForm!: FormGroup;
  books: Book[] = [];
  members: Member[] = [];
  loading = false;
  loadingData = true;

  constructor(
    private fb: FormBuilder,
    private bookService: BookService,
    private memberService: MemberService,
    private borrowService: BorrowService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<BorrowDialogComponent>
  ) { }

  ngOnInit(): void {
    const today = new Date();
    const defaultDueDate = new Date();
    defaultDueDate.setDate(today.getDate() + 14); // 2 weeks default

    this.borrowForm = this.fb.group({
      member: ['', Validators.required],
      book: ['', Validators.required],
      borrow_date: [today.toISOString().substring(0, 10), Validators.required],
      due_date: [defaultDueDate.toISOString().substring(0, 10), Validators.required]
    }, { validators: this.dateValidator });

    this.loadDropdownData();
  }

  dateValidator(group: FormGroup) {
    const borrowDate = group.get('borrow_date')?.value;
    const dueDate = group.get('due_date')?.value;
    if (borrowDate && dueDate) {
      return new Date(dueDate) > new Date(borrowDate) ? null : { dueBeforeBorrow: true };
    }
    return null;
  }

  loadDropdownData(): void {
    this.loadingData = true;
    
    // Fetch members and available books concurrently
    this.memberService.getMembers(1, '', '').subscribe({
      next: (mResponse) => {
        // Load all pages of members by making limit large, or just use first page's results
        // Since we are building standard app, let's load all members and available books
        this.members = mResponse.results;
        
        this.bookService.getBooks(1, '', '', true).subscribe({
          next: (bResponse) => {
            this.books = bResponse.results;
            this.loadingData = false;
          },
          error: (err) => {
            this.loadingData = false;
            this.snackBar.open('Failed to load books: ' + err.message, 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
          }
        });
      },
      error: (err) => {
        this.loadingData = false;
        this.snackBar.open('Failed to load members: ' + err.message, 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
      }
    });
  }

  onSubmit(): void {
    if (this.borrowForm.invalid) {
      return;
    }

    this.loading = true;
    const formValue = this.borrowForm.value;

    this.borrowService.borrowBook(formValue).subscribe({
      next: (newRecord) => {
        this.loading = false;
        this.snackBar.open('Book issued successfully!', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
        this.dialogRef.close(newRecord);
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.message || 'Failed to issue book', 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
