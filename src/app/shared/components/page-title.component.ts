import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
  selector: 'app-page-title',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './page-title.component.html',
  styleUrl: './page-title.component.css',
})
export class PageTitleComponent {
  @Input() title = '';
}
