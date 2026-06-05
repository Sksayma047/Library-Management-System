import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Member } from '../../models/member.model';
import { MemberService } from '../../services/member.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-member-dialog',
  templateUrl: './member-dialog.component.html',
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
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 24px;
    }
  `]
})
export class MemberDialogComponent implements OnInit {
  memberForm!: FormGroup;
  isEditMode = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private memberService: MemberService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<MemberDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { member: Member }
  ) { }

  ngOnInit(): void {
    this.isEditMode = !!this.data && !!this.data.member;

    this.memberForm = this.fb.group({
      member_id: [this.data?.member?.member_id || '', [Validators.required, Validators.maxLength(20)]],
      name: [this.data?.member?.name || '', [Validators.required, Validators.maxLength(255)]],
      email: [this.data?.member?.email || '', [Validators.required, Validators.email]],
      phone: [this.data?.member?.phone || '', [Validators.maxLength(20)]]
    });
  }

  onSubmit(): void {
    if (this.memberForm.invalid) {
      return;
    }

    this.loading = true;
    const formValue = this.memberForm.value;

    if (this.isEditMode) {
      this.memberService.updateMember(this.data.member.id!, formValue).subscribe({
        next: (updatedMember) => {
          this.loading = false;
          this.snackBar.open('Member updated successfully!', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
          this.dialogRef.close(updatedMember);
        },
        error: (err) => {
          this.loading = false;
          this.snackBar.open(err.message || 'Failed to update member', 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
        }
      });
    } else {
      this.memberService.createMember(formValue).subscribe({
        next: (newMember) => {
          this.loading = false;
          this.snackBar.open('Member registered successfully!', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
          this.dialogRef.close(newMember);
        },
        error: (err) => {
          this.loading = false;
          this.snackBar.open(err.message || 'Failed to register member', 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
