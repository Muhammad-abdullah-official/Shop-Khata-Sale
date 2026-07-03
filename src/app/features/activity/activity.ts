import { Component, computed, inject } from '@angular/core';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { Icon } from '../../shared/ui/icon/icon';
import { ActivityService } from '../../core/services/activity.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-activity-log',
  imports: [PageHeader, Icon],
  templateUrl: './activity.html',
})
export class ActivityLog {
  private readonly activitySvc = inject(ActivityService);
  readonly auth = inject(AuthService);

  readonly isOwner = this.auth.isOwner;

  /** Owner sees everyone's actions; staff sees only their own. */
  readonly items = computed(() =>
    this.isOwner()
      ? this.activitySvc.all()
      : this.activitySvc.forActor(this.auth.currentUser()?.id ?? ''),
  );
}
