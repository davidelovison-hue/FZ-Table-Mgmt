import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { GuestlistWorkspaceService } from './guestlist-workspace.service';

@Component({
  selector: 'app-guestlist-limits',
  standalone: true,
  templateUrl: './guestlist-limits.component.html',
  styleUrls: ['./guestlist-limits.component.css', '../guestlist-config/guestlist-config.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestlistLimitsComponent {
  readonly w = inject(GuestlistWorkspaceService);
}
