import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PageTitleComponent } from '@shared';
import { GuestlistWorkspaceService } from './guestlist-workspace.service';

@Component({
  selector: 'app-guestlist-shell',
  standalone: true,
  imports: [RouterOutlet, PageTitleComponent],
  templateUrl: './guestlist-shell.component.html',
  styleUrl: './guestlist-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestlistShellComponent {
  /** Initialise workspace (and sync summaries → Guests tab) for any guestlist child route. */
  private readonly _guestlistWorkspace = inject(GuestlistWorkspaceService);
}
