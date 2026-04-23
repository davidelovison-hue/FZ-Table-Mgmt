import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LayoutComponent } from './layout/layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<app-layout />',
})
export class AppComponent {}
