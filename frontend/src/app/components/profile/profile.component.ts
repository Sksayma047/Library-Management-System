import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styles: [`
    .profile-container {
      max-width: 600px;
      margin: 32px auto;
      padding: 16px;
    }
    .profile-card {
      border-radius: 12px;
      padding: 24px;
    }
    .profile-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 24px;
    }
    .avatar-icon {
      font-size: 72px;
      height: 72px;
      width: 72px;
      color: #3f51b5;
      margin-bottom: 12px;
    }
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    .submit-btn {
      height: 44px;
      font-weight: 600;
    }
  `]
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  loading = false;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      username: [{ value: '', disabled: true }],
      name: ['', [Validators.required, Validators.maxLength(255)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.maxLength(20)]],
      password: ['', [Validators.minLength(6)]]
    });

    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.authService.getProfile().subscribe({
      next: (data) => {
        this.loading = false;
        this.profileForm.patchValue({
          username: data.member_id,
          name: data.name,
          email: data.email,
          phone: data.phone
        });
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open('Failed to load profile details: ' + (err.message || err), 'Close', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.submitting = true;
    const formValue = { ...this.profileForm.getRawValue() };
    
    if (!formValue.password) {
      delete formValue.password;
    }

    this.authService.updateProfile(formValue).subscribe({
      next: () => {
        this.submitting = false;
        this.snackBar.open('Profile updated successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.profileForm.get('password')?.reset();
      },
      error: (err) => {
        this.submitting = false;
        this.snackBar.open(err.message || 'Failed to update profile.', 'Close', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
