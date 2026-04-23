import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { MenuItemComponent } from './menu-item.component';
import { MENU_DATA, MenuItem } from './menu.data';
import { trackBy } from '@shared';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, MenuItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  @Input() isOpen = true;

  menuItems = MENU_DATA;
  protected trackByLabel = trackBy<MenuItem>('label');

  toggleSection(item: MenuItem): void {
    item.isOpen = !item.isOpen;
  }
}
