import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Book } from '../models/book.model';
import { PaginatedResponse } from '../models/paginated-response.model';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private apiUrl = 'http://localhost:8000/api/books/';

  constructor(private http: HttpClient) { }

  getBooks(
    page: number = 1,
    search: string = '',
    ordering: string = '',
    availableOnly: boolean = false
  ): Observable<PaginatedResponse<Book>> {
    let params = new HttpParams().set('page', page.toString());
    if (search) {
      params = params.set('search', search);
    }
    if (ordering) {
      params = params.set('ordering', ordering);
    }
    if (availableOnly) {
      params = params.set('available_only', 'true');
    }
    return this.http.get<PaginatedResponse<Book>>(this.apiUrl, { params });
  }

  getBookById(id: number): Observable<Book> {
    return this.http.get<Book>(`${this.apiUrl}${id}/`);
  }

  createBook(book: Book): Observable<Book> {
    return this.http.post<Book>(this.apiUrl, book);
  }

  updateBook(id: number, book: Book): Observable<Book> {
    return this.http.patch<Book>(`${this.apiUrl}${id}/`, book);
  }

  deleteBook(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}${id}/`);
  }
}
