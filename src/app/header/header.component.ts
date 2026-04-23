import { Component, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { ShiftWidgetComponent } from './shift-widget.component';
import { UserMenuComponent } from './user-menu.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ShiftWidgetComponent, UserMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();
}
