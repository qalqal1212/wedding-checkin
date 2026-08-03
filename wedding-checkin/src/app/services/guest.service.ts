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

  async searchGuestsByName(name: string): Promise<Guest[]> {
    this.ensureConfigured();

    const query = name.trim();
    if (!query) {
      return [];
    }

    const { data, error } = await this.getClient()
      .from(this.tableName)
      .select('id, full_name, table_name, seat_label, party_size, checked_in, checked_in_at')
      .ilike('full_name', `%${query}%`)
      .order('full_name', { ascending: true })
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
      .select('id, full_name, table_name, seat_label, party_size, checked_in, checked_in_at')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as Guest | null) ?? null;
  }

  async checkInGuest(id: string): Promise<Guest> {
    this.ensureConfigured();

    const { data, error } = await this.getClient()
      .from(this.tableName)
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, full_name, table_name, seat_label, party_size, checked_in, checked_in_at')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Guest;
  }

  async getGuestsForAdmin(name: string): Promise<Guest[]> {
    this.ensureConfigured();

    let query = this.getClient()
      .from(this.tableName)
      .select('id, full_name, table_name, seat_label, party_size, checked_in, checked_in_at')
      .order('checked_in', { ascending: true })
      .order('full_name', { ascending: true })
      .limit(200);

    const term = name.trim();
    if (term) {
      query = query.ilike('full_name', `%${term}%`);
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
