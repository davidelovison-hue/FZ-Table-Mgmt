import { Routes } from '@angular/router';
import { ContentPageComponent } from './content-page/content-page.component';
import { GuestlistConfigComponent } from './guestlist-config/guestlist-config.component';
import { GuestlistGuestsComponent } from './guestlist/guestlist-guests.component';
import { GuestlistLimitsComponent } from './guestlist/guestlist-limits.component';
import { GuestlistShellComponent } from './guestlist/guestlist-shell.component';
import { StructuredPlanConfigComponent } from './structured-plan-config/structured-plan-config.component';

export const routes: Routes = [
  { path: '', redirectTo: 'assets/hubs/table-management', pathMatch: 'full' },
  { path: 'assets/hubs/table-management', component: ContentPageComponent },
  { path: 'assets/hubs/calendar', redirectTo: 'assets/hubs/table-management', pathMatch: 'full' },
  {
    path: 'assets/hubs/guestlist',
    component: GuestlistShellComponent,
    children: [
      { path: '', redirectTo: 'configuration', pathMatch: 'full' },
      { path: 'configuration', component: GuestlistConfigComponent },
      { path: 'limits', component: GuestlistLimitsComponent },
      { path: 'guests', component: GuestlistGuestsComponent },
    ],
  },
  { path: 'structured-plan', component: StructuredPlanConfigComponent },
  { path: '**', redirectTo: '' },
];
