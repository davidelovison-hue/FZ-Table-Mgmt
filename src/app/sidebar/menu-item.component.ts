import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { NgIf, NgClass, NgComponentOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from './menu.data';

@Component({
  selector: 'app-menu-item',
  standalone: true,
  imports: [NgIf, NgClass, NgComponentOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './menu-item.component.html',
  styleUrl: './menu-item.component.css',
})
export class MenuItemComponent {
  @Input() item!: MenuItem;
  @Output() toggled = new EventEmitter<void>();
}
