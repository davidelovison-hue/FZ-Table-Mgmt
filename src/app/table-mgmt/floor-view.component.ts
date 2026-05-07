import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import type { ZoneKey } from './table.models';
import { SlotCellComponent } from './slot-cell.component';
import { TableWorkspaceService } from './table-workspace.service';

@Component({
  selector: 'app-floor-view',
  standalone: true,
  imports: [CommonModule, SlotCellComponent],
  templateUrl: './floor-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class FloorViewComponent {
  readonly tm = inject(TableWorkspaceService);
  readonly selectedMapZone = signal<ZoneKey | null>(null);

  readonly selectedZoneMap = computed(() => {
    const zones = this.tm.floorZones();
    if (!zones.length) {
      return null;
    }
    const key = this.selectedMapZone();
    return zones.find((zone) => zone.key === key) ?? zones[0];
  });

  setMapZone(zone: ZoneKey): void {
    this.selectedMapZone.set(zone);
  }
}
