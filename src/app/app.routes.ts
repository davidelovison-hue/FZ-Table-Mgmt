import { Routes } from '@angular/router';
import { ContentPageComponent } from './content-page/content-page.component';
import { StructuredPlanConfigComponent } from './structured-plan-config/structured-plan-config.component';

export const routes: Routes = [
  { path: '', redirectTo: 'assets/hubs/calendar', pathMatch: 'full' },
  { path: 'assets/hubs/calendar', component: ContentPageComponent },
  { path: 'structured-plan', component: StructuredPlanConfigComponent },
  { path: '**', redirectTo: '' },
];
