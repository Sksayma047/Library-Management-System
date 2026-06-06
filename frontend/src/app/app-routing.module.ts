import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { BooksComponent } from './components/books/books.component';
import { MembersComponent } from './components/members/members.component';
import { BorrowHistoryComponent } from './components/borrow-history/borrow-history.component';
import { AccessDeniedComponent } from './components/access-denied/access-denied.component';
import { RegisterComponent } from './components/register/register.component';
import { MyBorrowsComponent } from './components/my-borrows/my-borrows.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'access-denied', component: AccessDeniedComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Admin'] }
  },
  { 
    path: 'books', 
    component: BooksComponent, 
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Admin', 'Member'] }
  },
  { 
    path: 'members', 
    component: MembersComponent, 
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Admin'] }
  },
  { 
    path: 'borrow-history', 
    component: BorrowHistoryComponent, 
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Admin'] }
  },
  {
    path: 'my-borrows',
    component: MyBorrowsComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Member'] }
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Admin', 'Member'] }
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
