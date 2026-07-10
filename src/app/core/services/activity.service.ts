import { Injectable, effect, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { Role } from '../models';
import { IconName } from '../../shared/ui/icon/icon';

export interface Activity {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: string;
  detail: string;
  icon: IconName;
  at: string;
}

const TABLE = 'activity';

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Audit trail — records WHO did WHAT. Writes live in the service layer so
 * every code path is covered. The actor is always the signed-in user.
 */
@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);

  private readonly _log = signal<Activity[]>([]);
  readonly all = this._log.asReadonly();

  constructor() {
    effect(() => {
      this.auth.currentUser();
      void this.load();
    });
  }

  forActor(actorId: string): Activity[] {
    return this._log().filter((a) => a.actorId === actorId);
  }

  async load(): Promise<void> {
    if (!this.auth.isStaffOrOwner()) {
      this._log.set([]);
      return;
    }
    const { data, error } = await this.supabase.client
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error || !data) return;
    this._log.set(
      data.map((r) => ({
        id: r['id'],
        actorId: r['actor_id'],
        actorName: r['actor_name'],
        actorRole: r['actor_role'] as Role,
        action: r['action'],
        detail: r['detail'],
        icon: r['icon'] as IconName,
        at: fmt(r['created_at']),
      })),
    );
  }

  async log(action: string, detail: string, icon: IconName): Promise<void> {
    const u = this.auth.currentUser();
    if (!u) return;
    await this.supabase.client.from(TABLE).insert({
      actor_id: u.id,
      actor_name: u.name,
      actor_role: u.role,
      action,
      detail,
      icon,
    });
    await this.load();
  }
}
