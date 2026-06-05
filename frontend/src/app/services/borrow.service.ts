import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BorrowHistory } from '../models/borrow.model';
import { PaginatedResponse } from '../models/paginated-response.model';

@Injectable({
  providedIn: 'root'
})
export class BorrowService {
  private apiUrl = 'http://localhost:8000/api/borrow-history/';

  constructor(private http: HttpClient) { }

  getBorrowHistory(
    page: number = 1,
    search: string = '',
    status: string = '',
    memberId: string = '',
    bookId: string = ''
  ): Observable<PaginatedResponse<BorrowHistory>> {
    let params = new HttpParams().set('page', page.toString());
    if (search) {
      params = params.set('search', search);
    }
    if (status) {
      params = params.set('status', status);
    }
    if (memberId) {
      params = params.set('member', memberId);
    }
    if (bookId) {
      params = params.set('book', bookId);
    }
    return this.http.get<PaginatedResponse<BorrowHistory>>(this.apiUrl, { params });
  }

  borrowBook(borrowData: {
    member: number;
    book: number;
    borrow_date: string;
    due_date: string;
  }): Observable<BorrowHistory> {
    return this.http.post<BorrowHistory>(this.apiUrl, borrowData);
  }

  returnBook(id: number, returnDate: string): Observable<BorrowHistory> {
    return this.http.post<BorrowHistory>(`${this.apiUrl}${id}/return/`, {
      return_date: returnDate,
    });
  }

  markOverdue(): Observable<{ updated: number; message: string }> {
    return this.http.post<{ updated: number; message: string }>(
      `${this.apiUrl}mark-overdue/`,
      {}
    );
  }
}
