import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { BorrowService } from '../../services/borrow.service';
import { DashboardStats } from '../../models/stats.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats = {
    total_books: 0,
    total_members: 0,
    active_borrows: 0,
    overdue_borrows: 0,
    available_books: 0
  };
  loading = true;
  markingOverdue = false;

  constructor(
    private dashboardService: DashboardService,
    private borrowService: BorrowService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open('Failed to load dashboard stats: ' + error.message, 'Close', {
          duration: 4000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  runOverdueCron(): void {
    this.markingOverdue = true;
    this.borrowService.markOverdue().subscribe({
      next: (res) => {
        this.markingOverdue = false;
        this.snackBar.open(res.message || 'Overdue check completed successfully!', 'Close', {
          duration: 4000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.loadStats();
      },
      error: (error) => {
        this.markingOverdue = false;
        this.snackBar.open('Overdue check failed: ' + error.message, 'Close', {
          duration: 4000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
