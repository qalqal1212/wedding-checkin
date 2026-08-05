import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  private client: SupabaseClient | null = null;

  async login(email: string, password: string): Promise<void> {
    if (!this.isBrowser()) {
      throw new Error('Admin login is only available in browser sessions.');
    }

    const { error } = await this.getClient().auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async isLoggedIn(): Promise<boolean> {
    if (!this.isBrowser()) {
      return false;
    }

    const { data, error } = await this.getClient().auth.getSession();
    if (error) {
      return false;
    }

    return !!data.session;
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.isBrowser()) {
      return null;
    }

    const { data, error } = await this.getClient().auth.getUser();
    if (error) {
      return null;
    }

    return data.user;
  }

  async logout(): Promise<void> {
    if (!this.isBrowser()) {
      return;
    }

    const { error } = await this.getClient().auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  private getClient(): SupabaseClient {
    if (!this.client) {
      this.client = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
    }

    return this.client;
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }
}
