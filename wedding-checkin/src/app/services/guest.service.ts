import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Guest } from '../models/guest.model';

@Injectable({
  providedIn: 'root'
})
export class GuestService {
  private readonly tableName = 'guests';
  private client: SupabaseClient | null = null;

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
        original_text: input.original_text
      })
      .select('id, guest_name, table_code, seat_code, seat_number, original_text, table_name')
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
      .select('id, guest_name, table_code, seat_code, seat_number, original_text, table_name')
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

    const query = name.trim();
    if (!query) {
      return [];
    }

    const { data, error } = await this.getClient()
      .from(this.tableName)
      .select('id, guest_name, table_code, seat_code, seat_number, original_text, table_name')
      .ilike('guest_name', `%${query}%`)
      .order('guest_name', { ascending: true })
      .limit(30);

    if (error) {
      throw new Error(error.message);
    }

    return (data as Guest[]) ?? [];
  }

  async getGuestById(id: string): Promise<Guest | null> {
    this.ensureConfigured();

    const { data, error } = await this.getClient()
      .from(this.tableName)
      .select('id, guest_name, table_code, seat_code, seat_number, original_text, table_name')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as Guest | null) ?? null;
  }

  async getGuestsForAdmin(name: string): Promise<Guest[]> {
    this.ensureConfigured();

    let query = this.getClient()
      .from(this.tableName)
      .select('id, guest_name, table_code, seat_code, seat_number, original_text, table_name')
      .order('guest_name', { ascending: true })
      .limit(200);

    const term = name.trim();
    if (term) {
      query = query.ilike('guest_name', `%${term}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data as Guest[]) ?? [];
  }

  private ensureConfigured(): void {
    if (
      !environment.supabaseUrl ||
      !environment.supabaseAnonKey ||
      environment.supabaseUrl.includes('YOUR_SUPABASE_URL') ||
      environment.supabaseAnonKey.includes('YOUR_SUPABASE_ANON_KEY')
    ) {
      throw new Error('Supabase environment is not configured. Update src/environments/environment.ts');
    }
  }

  private getClient(): SupabaseClient {
    this.ensureConfigured();

    if (!this.client) {
      this.client = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
    }

    return this.client;
  }
}
