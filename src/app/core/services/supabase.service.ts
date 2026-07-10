import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * Single Supabase client for the whole app.
 * Every other service talks to the database through `supabase.client`.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
  );

  /**
   * Session-less client used only to sign a NEW user up (e.g. the owner
   * creating a staff login). Because it never persists a session, the
   * owner stays logged in on the main client.
   */
  readonly signupClient: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );

  /** Public URL for a file in a public bucket (e.g. product images). */
  publicUrl(bucket: string, path: string): string {
    return this.client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  /** Upload a data-URL / File and return the stored path. */
  async upload(bucket: string, file: File, prefix = ''): Promise<string | null> {
    const ext = file.name.split('.').pop() ?? 'png';
    const path = `${prefix}${crypto.randomUUID()}.${ext}`;
    const { error } = await this.client.storage.from(bucket).upload(path, file);
    return error ? null : path;
  }
}
