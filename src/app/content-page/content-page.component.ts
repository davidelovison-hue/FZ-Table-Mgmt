import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PageTitleComponent } from '@shared';
import { TableMgmtPageComponent } from '../table-mgmt/table-mgmt-page.component';

@Component({
  selector: 'app-content-page',
  standalone: true,
  imports: [PageTitleComponent, TableMgmtPageComponent],
  templateUrl: './content-page.component.html',
  styleUrl: './content-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentPageComponent {}
