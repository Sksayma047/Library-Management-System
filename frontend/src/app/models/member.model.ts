export interface Member {
  id?: number;
  member_id: string;
  name: string;
  email: string;
  phone?: string;
  active_borrows_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface MemberSummary {
  id: number;
  member_id: string;
  name: string;
  email: string;
}
