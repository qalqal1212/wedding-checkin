import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Guest } from '../models/guest.model';

export interface AdminGuestPage {
  guests: Guest[];
  total: number;
  checkedInCount: number;
  pendingCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class GuestService {
  private readonly tableName = 'guests';
  private client: SupabaseClient | null = null;
  private readonly selectColumns =
    'id, guest_name, table_code, seat_code, seat_number, original_text, table_name, checked_in, checked_in_at';
  private readonly legacySelectColumns = 'id, full_name, table_name, seat_label, party_size, checked_in, checked_in_at';

  async createGuest(input: {
    guest_name: string;
    table_name: string | null;
    table_code: string | null;
    seat_code: string | null;
    seat_number: string | null;
    original_text: string | null;
  }): Promise<Guest> {
    this.ensureConfigured();

    const { data, error } = await this.getClient()
      .from(this.tableName)
      .insert({
        guest_name: input.guest_name,
        table_name: input.table_name,
        table_code: input.table_code,
        seat_code: input.seat_code,
        seat_number: input.seat_number,
        original_text: input.original_text,
        checked_in: false,
        checked_in_at: null
      })
      .select(this.selectColumns)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Guest;
  }

  async updateGuest(
    id: string,
    input: {
      guest_name: string;
      table_name: string | null;
      table_code: string | null;
      seat_code: string | null;
      seat_number: string | null;
      original_text: string | null;
    }
  ): Promise<Guest> {
    this.ensureConfigured();

    const { data, error } = await this.getClient()
      .from(this.tableName)
      .update({
        guest_name: input.guest_name,
        table_name: input.table_name,
        table_code: input.table_code,
        seat_code: input.seat_code,
        seat_number: input.seat_number,
        original_text: input.original_text
      })
      .eq('id', id)
      .select(this.selectColumns)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Guest;
  }

  async deleteGuest(id: string): Promise<void> {
    this.ensureConfigured();

    const { error } = await this.getClient()
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async searchGuestsByName(name: string): Promise<Guest[]> {
    this.ensureConfigured();

    const term = name.trim();
    if (!term) {
      return [];
    }

    const dataset = await this.fetchSearchDataset();
    const guests = this.normalizeGuests(dataset);

    return this.filterGuests(guests, term).slice(0, 30);
  }

  async getGuestById(id: string): Promise<Guest | null> {
    this.ensureConfigured();

    const { data, error } = await this.getClient()
      .from(this.tableName)
      .select(this.selectColumns)
      .eq('id', id)
      .maybeSingle();

    if (!error) {
      return (data as Guest | null) ?? null;
    }

    console.error('[GuestService] getGuestById modern failed:', error.message);

    const legacy = await this.getClient()
      .from(this.tableName)
      .select(this.legacySelectColumns)
      .eq('id', id)
      .maybeSingle();

    if (!legacy.error) {
      if (!legacy.data) {
        return null;
      }

      return this.normalizeGuests([legacy.data])[0] ?? null;
    }

    const wide = await this.getClient()
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (wide.error) {
      throw new Error(error.message);
    }

    if (!wide.data) {
      return null;
    }

    return this.normalizeGuests([wide.data])[0] ?? null;
  }

  async setGuestCheckInStatus(id: string, checkedIn: boolean): Promise<Guest> {
    this.ensureConfigured();

    const update = {
      checked_in: checkedIn,
      checked_in_at: checkedIn ? new Date().toISOString() : null
    };

    const { data, error } = await this.getClient()
      .from(this.tableName)
      .update(update)
      .eq('id', id)
      .select(this.selectColumns)
      .single();

    if (!error) {
      return data as Guest;
    }

    console.error('[GuestService] check-in update modern failed:', error.message);

    const legacy = await this.getClient()
      .from(this.tableName)
      .update(update)
      .eq('id', id)
      .select('id, full_name, table_name, seat_label, party_size, checked_in, checked_in_at')
      .single();

    if (legacy.error) {
      throw new Error(error.message);
    }

    return this.normalizeGuests([legacy.data as Record<string, unknown>])[0] as Guest;
  }

  async getGuestsForAdmin(name: string, page: number, pageSize: number): Promise<AdminGuestPage> {
    this.ensureConfigured();

    const term = name.trim();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const dataset = await this.fetchSearchDataset();
    const guests = this.normalizeGuests(dataset);
    const filteredGuests = term ? this.filterGuests(guests, term) : guests;

    const pageGuests = filteredGuests.slice(from, to + 1);
    const checkedInCount = filteredGuests.filter((guest) => guest.checked_in).length;
    const pendingCount = filteredGuests.length - checkedInCount;

    return {
      guests: pageGuests,
      total: filteredGuests.length,
      checkedInCount,
      pendingCount
    };
  }

  private async fetchSearchDataset(): Promise<Record<string, unknown>[]> {
    const modern = await this.getClient()
      .from(this.tableName)
      .select(this.selectColumns)
      .order('guest_name', { ascending: true })
      .limit(5000);

    if (!modern.error) {
      return (modern.data as Record<string, unknown>[] | null) ?? [];
    }

    const legacy = await this.getClient()
      .from(this.tableName)
      .select(this.legacySelectColumns)
      .order('full_name', { ascending: true })
      .limit(5000);

    if (!legacy.error) {
      return (legacy.data as Record<string, unknown>[] | null) ?? [];
    }

    const wide = await this.getClient()
      .from(this.tableName)
      .select('*')
      .limit(5000);

    if (wide.error) {
      throw new Error(modern.error.message);
    }

    return (wide.data as Record<string, unknown>[] | null) ?? [];
  }

  private normalizeGuests(rows: Record<string, unknown>[]): Guest[] {
    return rows
      .map((row) => ({
        id: String(row['id'] ?? ''),
        guest_name: String(row['guest_name'] ?? row['full_name'] ?? ''),
        table_name: this.toNullableString(row['table_name']),
        table_code: this.toNullableString(row['table_code']),
        seat_code: this.toNullableString(row['seat_code'] ?? row['seat_label']),
        seat_number: this.toNullableString(row['seat_number'] ?? row['party_size']),
        original_text: this.toNullableString(row['original_text']),
        checked_in: Boolean(row['checked_in']),
        checked_in_at: this.toNullableString(row['checked_in_at'])
      }))
      .filter((guest) => guest.id.length > 0 && guest.guest_name.length > 0)
      .sort((a, b) => a.guest_name.localeCompare(b.guest_name));
  }

  private filterGuests(guests: Guest[], rawTerm: string): Guest[] {
    const term = rawTerm.trim().toLowerCase();
    if (!term) {
      return guests;
    }

    return guests.filter((guest) => {
      const fields = [guest.guest_name, guest.table_name, guest.table_code, guest.seat_code, guest.seat_number, guest.original_text];
      return fields.some((field) => (field ?? '').toLowerCase().includes(term));
    });
  }

  private toNullableString(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const text = String(value).trim();
    return text.length > 0 ? text : null;
  }

  private ensureConfigured(): void {
    if (
      !environment.supabaseUrl ||
      !environment.supabaseAnonKey ||
      environment.supabaseUrl.includes('YOUR_SUPABASE_URL') ||
      environment.supabaseAnonKey.includes('YOUR_SUPABASE_ANON_KEY')
    ) {
      throw new Error('Supabase is not configured. Update src/environments/environment.ts');
    }
  }

  private getClient(): SupabaseClient {
    this.ensureConfigured();

    if (!this.client) {
      const browser = this.isBrowser();
      this.client = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
        auth: {
          persistSession: browser,
          autoRefreshToken: browser
        }
      });
    }

    return this.client;
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }
}
