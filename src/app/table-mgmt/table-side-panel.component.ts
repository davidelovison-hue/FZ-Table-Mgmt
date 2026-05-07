import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';
import type { Reservation, ZoneKey } from './table.models';
import { RESERVATION_STATUS_OPTIONS } from './table.models';
import { TableWorkspaceService } from './table-workspace.service';

@Component({
  selector: 'app-table-side-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table-side-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class TableSidePanelComponent {
  readonly tm = inject(TableWorkspaceService);
  readonly statusOptions = RESERVATION_STATUS_OPTIONS;
  readonly reservationZoneSelections = signal<Record<string, ZoneKey>>({});
  /** Zone shown in Modify reservation; keyed per reservation so switching bookings never shows the wrong list. */
  readonly modificationZoneSelections = signal<Record<string, ZoneKey>>({});

  selectedZoneForReservation(r: Reservation): ZoneKey {
    const selected = this.reservationZoneSelections()[r.id];
    if (selected) {
      return selected;
    }
    const assignedZone = r.tableId ? this.tm.tables().find((t) => t.id === r.tableId)?.zone : undefined;
    return assignedZone ?? r.zonePreference ?? 'vip';
  }

  setZoneForReservation(reservationId: string, zone: ZoneKey): void {
    this.reservationZoneSelections.update((state) => ({ ...state, [reservationId]: zone }));
    const reservation = this.tm.reservations().find((row) => row.id === reservationId);
    if (!reservation?.tableId) {
      return;
    }
    const assigned = this.tm.tables().find((t) => t.id === reservation.tableId);
    if (assigned && assigned.zone !== zone) {
      this.tm.assignReservationToTable(reservationId, null);
    }
  }

  tablesForZone(zone: ZoneKey) {
    return this.tm.tables().filter((table) => table.zone === zone);
  }

  onReservationTableChange(reservationId: string, tableId: string): void {
    const normalized = tableId === '' ? null : tableId;
    this.tm.assignReservationToTable(reservationId, normalized);
    if (!normalized) {
      return;
    }
    const table = this.tm.tables().find((row) => row.id === normalized);
    if (table) {
      this.reservationZoneSelections.update((state) => ({ ...state, [reservationId]: table.zone }));
    }
  }

  modificationZoneForReservation(r: Reservation): ZoneKey {
    const stored = this.modificationZoneSelections()[r.id];
    if (stored !== undefined) {
      return stored;
    }
    const draftTableId = this.tm.modificationDraft().tableId;
    const draftZone = draftTableId ? this.tm.tables().find((t) => t.id === draftTableId)?.zone : undefined;
    const assigned = r.tableId ? this.tm.tables().find((t) => t.id === r.tableId)?.zone : undefined;
    return draftZone ?? assigned ?? r.zonePreference ?? 'vip';
  }

  setModificationZone(reservationId: string, zoneRaw: string): void {
    const zone = zoneRaw as ZoneKey;
    this.modificationZoneSelections.update((state) => ({ ...state, [reservationId]: zone }));
    const currentTableId = this.tm.modificationDraft().tableId;
    if (!currentTableId) {
      return;
    }
    const currentTable = this.tm.tables().find((t) => t.id === currentTableId);
    if (currentTable && currentTable.zone !== zone) {
      this.tm.setModificationTable('');
    }
  }

  syncModificationZoneWithDraft(r: Reservation): void {
    const draftTableId = this.tm.modificationDraft().tableId;
    const draftZone = draftTableId ? this.tm.tables().find((t) => t.id === draftTableId)?.zone : undefined;
    const reservationZone = r.tableId ? this.tm.tables().find((t) => t.id === r.tableId)?.zone : undefined;
    const zone = draftZone ?? reservationZone ?? r.zonePreference ?? 'vip';
    this.modificationZoneSelections.update((state) => ({ ...state, [r.id]: zone }));
  }

  modificationTablesForZone(zone: ZoneKey, r: Reservation) {
    const event = this.tm.activeEvent();
    if (!event) {
      return [];
    }
    return this.tm.tables().filter((table) => {
      if (table.zone !== zone || table.locked) {
        return false;
      }
      if (table.hidden && table.id !== r.tableId) {
        return false;
      }
      if (table.id === r.tableId) {
        return true;
      }
      return this.tm.resolveCellStatus(event.id, r.sessionId, table.id) === 'available';
    });
  }
}
