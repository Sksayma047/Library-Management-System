export interface Book {
  id?: number;
  isbn: string;
  title: string;
  author: string;
  available_copies: number;
  total_copies: number;
  is_available?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BookSummary {
  id: number;
  isbn: string;
  title: string;
  author: string;
  available_copies: number;
}
