import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, input } from '@angular/core';
import type { EventSession, TableAsset } from './table.models';
import { TableWorkspaceService } from './table-workspace.service';

@Component({
  selector: 'td[appSlotCell]',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slot-cell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SlotCellComponent {
  readonly tm = inject(TableWorkspaceService);
  readonly session = input.required<EventSession>();
  readonly table = input.required<TableAsset>();
}
