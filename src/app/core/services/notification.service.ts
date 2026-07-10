import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { IconName } from '../../shared/ui/icon/icon';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  icon: IconName;
  link?: string;
  at: string;
  read: boolean;
}

const TABLE = 'notifications';

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

/**
 * In-app notifications for owner/staff. A Supabase Realtime channel pushes
 * new rows instantly — no polling, no refresh. (Free tier: 200 connections,
 * 2M messages/month.)
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);

  private readonly _items = signal<AppNotification[]>([]);
  readonly items = this._items.asReadonly();
  readonly unread = computed(() => this._items().filter((n) => !n.read).length);

  private channel: RealtimeChannel | null = null;

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      void this.load();
      if (user && this.auth.isStaffOrOwner()) this.subscribe();
      else this.unsubscribe();
    });
  }

  private subscribe(): void {
    if (this.channel) return;
    this.channel = this.supabase.client
      .channel('notifications-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: TABLE },
        () => void this.load(),
      )
      .subscribe();
  }

  private unsubscribe(): void {
    if (!this.channel) return;
    void this.supabase.client.removeChannel(this.channel);
    this.channel = null;
  }

  async load(): Promise<void> {
    if (!this.auth.isStaffOrOwner()) {
      this._items.set([]);
      return;
    }
    const { data, error } = await this.supabase.client
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error || !data) return;
    this._items.set(
      data.map((r) => ({
        id: r['id'],
        title: r['title'],
        message: r['message'],
        icon: r['icon'] as IconName,
        link: r['link'] ?? undefined,
        at: fmt(r['created_at']),
        read: r['read'],
      })),
    );
  }

  async push(data: { title: string; message: string; icon: IconName; link?: string }): Promise<void> {
    await this.supabase.client.from(TABLE).insert({
      title: data.title,
      message: data.message,
      icon: data.icon,
      link: data.link ?? null,
    });
  }

  async markAllRead(): Promise<void> {
    const unread = this._items().filter((n) => !n.read).map((n) => n.id);
    if (!unread.length) return;
    await this.supabase.client.from(TABLE).update({ read: true }).in('id', unread);
    await this.load();
  }

  async clear(): Promise<void> {
    const ids = this._items().map((n) => n.id);
    if (!ids.length) return;
    await this.supabase.client.from(TABLE).delete().in('id', ids);
    await this.load();
  }
}
