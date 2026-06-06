import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-access-denied',
  templateUrl: './access-denied.component.html',
  styles: [`
    .denied-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 120px);
      padding: 24px;
      text-align: center;
    }
    .denied-card {
      max-width: 480px;
      width: 100%;
      padding: 32px;
      border-radius: 12px;
    }
    .denied-icon {
      font-size: 80px;
      height: 80px;
      width: 80px;
      color: #f44336;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 28px;
      font-weight: 700;
      color: #333;
      margin-bottom: 12px;
    }
    p {
      color: #666;
      margin-bottom: 32px;
      line-height: 1.6;
    }
    .actions-btn {
      width: 100%;
    }
  `]
})
export class AccessDeniedComponent implements OnInit {
  constructor(private authService: AuthService) { }

  ngOnInit(): void { }

  getRedirectUrl(): string {
    return this.authService.isAdmin() ? '/dashboard' : '/books';
  }
}
