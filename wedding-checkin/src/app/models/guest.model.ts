export interface Guest {
  id: string;
  full_name: string;
  table_name: string | null;
  seat_label: string | null;
  party_size: number | null;
  checked_in: boolean;
  checked_in_at: string | null;
}
