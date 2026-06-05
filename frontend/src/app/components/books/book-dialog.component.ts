import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Book } from '../../models/book.model';
import { BookService } from '../../services/book.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-book-dialog',
  templateUrl: './book-dialog.component.html',
  styles: [`
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 320px;
      margin-top: 16px;
    }
    .full-width {
      width: 100%;
    }
    .row {
      display: flex;
      gap: 16px;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 24px;
    }
  `]
})
export class BookDialogComponent implements OnInit {
  bookForm!: FormGroup;
  isEditMode = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private bookService: BookService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<BookDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { book: Book }
  ) { }

  ngOnInit(): void {
    this.isEditMode = !!this.data && !!this.data.book;
    
    this.bookForm = this.fb.group({
      title: [this.data?.book?.title || '', [Validators.required, Validators.maxLength(255)]],
      author: [this.data?.book?.author || '', [Validators.required, Validators.maxLength(255)]],
      isbn: [this.data?.book?.isbn || '', [Validators.required, Validators.maxLength(13)]],
      total_copies: [this.data?.book?.total_copies || 1, [Validators.required, Validators.min(1)]],
      available_copies: [this.data?.book?.available_copies || 0, [Validators.required, Validators.min(0)]]
    }, { validators: this.copiesValidator });
  }

  copiesValidator(group: FormGroup) {
    const total = group.get('total_copies')?.value;
    const available = group.get('available_copies')?.value;
    return available <= total ? null : { availableExceedsTotal: true };
  }

  onSubmit(): void {
    if (this.bookForm.invalid) {
      return;
    }

    this.loading = true;
    const formValue = this.bookForm.value;

    if (this.isEditMode) {
      this.bookService.updateBook(this.data.book.id!, formValue).subscribe({
        next: (updatedBook) => {
          this.loading = false;
          this.snackBar.open('Book updated successfully!', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
          this.dialogRef.close(updatedBook);
        },
        error: (err) => {
          this.loading = false;
          this.snackBar.open(err.message || 'Failed to update book', 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
        }
      });
    } else {
      this.bookService.createBook(formValue).subscribe({
        next: (newBook) => {
          this.loading = false;
          this.snackBar.open('Book created successfully!', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
          this.dialogRef.close(newBook);
        },
        error: (err) => {
          this.loading = false;
          this.snackBar.open(err.message || 'Failed to create book', 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
