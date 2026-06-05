import { Component, OnInit, ViewChild } from '@angular/core';
import { Member } from '../../models/member.model';
import { MemberService } from '../../services/member.service';
import { MatDialog } from '@angular/material/dialog';
import { MemberDialogComponent } from './member-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';

@Component({
  selector: 'app-members',
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.css']
})
export class MembersComponent implements OnInit {
  members: Member[] = [];
  displayedColumns: string[] = ['member_id', 'name', 'email', 'phone', 'borrows', 'actions'];
  totalMembers = 0;
  pageSize = 10;
  currentPage = 1;
  searchQuery = '';
  sortQuery = '';
  loading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private memberService: MemberService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadMembers();
  }

  loadMembers(): void {
    this.loading = true;
    this.memberService.getMembers(this.currentPage, this.searchQuery, this.sortQuery).subscribe({
      next: (response) => {
        this.members = response.results;
        this.totalMembers = response.count;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open('Failed to load members: ' + error.message, 'Close', {
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
    this.loadMembers();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadMembers();
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
    this.loadMembers();
  }

  openAddMemberDialog(): void {
    const dialogRef = this.dialog.open(MemberDialogComponent, {
      width: '450px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadMembers();
      }
    });
  }

  openEditMemberDialog(member: Member): void {
    const dialogRef = this.dialog.open(MemberDialogComponent, {
      width: '450px',
      data: { member }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadMembers();
      }
    });
  }

  deleteMember(member: Member): void {
    if (confirm(`Are you sure you want to delete member "${member.name}"?`)) {
      this.loading = true;
      this.memberService.deleteMember(member.id!).subscribe({
        next: () => {
          this.snackBar.open('Member deleted successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.loadMembers();
        },
        error: (err) => {
          this.loading = false;
          this.snackBar.open(err.message || 'Failed to delete member', 'Close', {
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
