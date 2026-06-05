import { BookSummary } from './book.model';
import { MemberSummary } from './member.model';

export enum BorrowStatus {
  BORROWED = 'BORROWED',
  RETURNED = 'RETURNED',
  OVERDUE = 'OVERDUE'
}

export interface BorrowHistory {
  id?: number;
  member: number; // member ID (PK) for write
  member_detail?: MemberSummary;
  book: number; // book ID (PK) for write
  book_detail?: BookSummary;
  borrow_date: string;
  due_date: string;
  return_date?: string | null;
  late_fee?: number;
  status?: BorrowStatus;
  created_at?: string;
  updated_at?: string;
}
