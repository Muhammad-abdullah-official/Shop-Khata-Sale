import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Role, User } from '../models';

/**
 * Supabase Auth. `currentUser` mirrors the `profiles` row of the signed-in
 * user. Session restore is async, so guards must await `whenReady()`.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService);

  private readonly _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();

  readonly isLoggedIn = computed(() => this._currentUser() !== null);
  readonly isOwner = computed(() => this._currentUser()?.role === 'owner');
  readonly isStaff = computed(() => this._currentUser()?.role === 'staff');
  readonly isCustomer = computed(() => this._currentUser()?.role === 'customer');
  readonly isStaffOrOwner = computed(() => this.isOwner() || this.isStaff());

  /** Resolves once the initial session check has finished. */
  private readonly ready: Promise<void>;

  constructor() {
    this.ready = this.supabase.client.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) await this.loadProfile(data.session.user.id);
    });

    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) void this.loadProfile(session.user.id);
      else this._currentUser.set(null);
    });
  }

  whenReady(): Promise<void> {
    return this.ready;
  }

  private async loadProfile(userId: string): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('id, name, email, phone, address, role')
      .eq('id', userId)
      .single();

    if (error || !data) {
      this._currentUser.set(null);
      return;
    }
    this._currentUser.set({
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      role: data.role as Role,
    });
  }

  /** Returns null on success, or an error message. */
  async login(email: string, password: string): Promise<string | null> {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return error.message;
    if (data.user) await this.loadProfile(data.user.id);
    return null;
  }

  /** Registers a customer (profile + customers row are created by a DB trigger). */
  async register(data: {
    name: string;
    email: string;
    phone: string;
    address: string;
    password: string;
  }): Promise<string | null> {
    const { data: res, error } = await this.supabase.client.auth.signUp({
      email: data.email.trim(),
      password: data.password,
      options: {
        data: {
          name: data.name,
          phone: data.phone,
          address: data.address,
          role: 'customer',
        },
      },
    });
    if (error) return error.message;
    if (!res.session) return 'Account ban gaya — email confirm karke login karein.';
    if (res.user) await this.loadProfile(res.user.id);
    return null;
  }

  /**
   * Owner creates a staff login. Uses a session-less client so the owner
   * stays signed in. Returns the new user id, or an error message.
   */
  async addStaff(data: {
    name: string;
    email: string;
    password: string;
    phone: string;
  }): Promise<{ id?: string; error?: string }> {
    const { data: res, error } = await this.supabase.signupClient.auth.signUp({
      email: data.email.trim(),
      password: data.password,
      options: { data: { name: data.name, phone: data.phone, role: 'staff' } },
    });
    if (error) return { error: error.message };
    if (!res.user) return { error: 'Staff account nahi bana.' };
    return { id: res.user.id };
  }

  async logout(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this._currentUser.set(null);
  }
}
