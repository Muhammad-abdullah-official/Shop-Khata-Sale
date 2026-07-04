import { Injectable, computed, signal } from '@angular/core';
import { IconName } from '../../shared/ui/icon/icon';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  icon: IconName;
  link?: string;
  at: string;
  read: boolean;
}

/**
 * In-app notifications (owner/staff). Phase 1: added locally when events
 * happen. Phase 2: a Supabase Realtime subscription calls `push()` on new
 * rows — the bell UI stays identical.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _items = signal<AppNotification[]>([]);
  readonly items = this._items.asReadonly();
  readonly unread = computed(() => this._items().filter((n) => !n.read).length);

  push(data: { title: string; message: string; icon: IconName; link?: string }): void {
    this._items.update((list) => [
      {
        id: crypto.randomUUID(),
        title: data.title,
        message: data.message,
        icon: data.icon,
        link: data.link,
        at: new Date().toLocaleString('en-GB', {
          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
        }),
        read: false,
      },
      ...list,
    ]);
  }

  markAllRead(): void {
    this._items.update((list) => list.map((n) => ({ ...n, read: true })));
  }

  clear(): void {
    this._items.set([]);
  }
}
