import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  ViewEncapsulation,
  computed,
  inject,
  signal,
} from '@angular/core';
import type { OpsTab, Reservation, ReservationLifecycleStatus, ZoneKey } from './table.models';
import { RESERVATION_STATUS_OPTIONS } from './table.models';
import { FloorViewComponent } from './floor-view.component';
import { TableSidePanelComponent } from './table-side-panel.component';
import { TableWorkspaceService } from './table-workspace.service';

@Component({
  selector: 'app-table-mgmt-page',
  standalone: true,
  imports: [CommonModule, FloorViewComponent, TableSidePanelComponent],
  templateUrl: './table-mgmt-page.component.html',
  styleUrl: './table-mgmt-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class TableMgmtPageComponent {
  readonly tm = inject(TableWorkspaceService);

  readonly statusOptions = RESERVATION_STATUS_OPTIONS;

  readonly isCreateReservationModalOpen = signal(false);
  readonly createReservationError = signal('');
  readonly createReservationDraft = signal(this.newCreateReservationDraft());
  readonly selectedProfileReservationId = signal<string | null>(null);
  readonly selectedPosReservationId = signal<string | null>(null);
  /** Floor toolbar: lifecycle multi-select dropdown open state */
  readonly floorLifecycleMsOpen = signal(false);
  /** Reservations tab: which row’s “More” menu is open */
  readonly bookingsActionsMenuId = signal<string | null>(null);

  /** Guest profile / POS drawers reserve the same horizontal space as reservation details */
  readonly hasAuxReservationDrawer = computed(
    () => this.selectedProfileReservationId() !== null || this.selectedPosReservationId() !== null,
  );

  setOpsTab(tab: OpsTab): void {
    if (tab !== 'floor') {
      this.floorLifecycleMsOpen.set(false);
    }
    this.bookingsActionsMenuId.set(null);
    this.tm.setOpsTab(tab);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {
    const t = ev.target as HTMLElement;
    if (!t.closest('.tm-floor-lifecycle-ms')) {
      this.floorLifecycleMsOpen.set(false);
    }
    if (!t.closest('.tm-bookings-row-menu')) {
      this.bookingsActionsMenuId.set(null);
    }
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(ev: KeyboardEvent): void {
    if (ev.key === 'Escape') {
      if (this.selectedPosReservationId()) {
        this.closePosConsumption();
        return;
      }
      if (this.selectedProfileReservationId()) {
        this.closeGuestProfile();
        return;
      }
      this.floorLifecycleMsOpen.set(false);
      this.bookingsActionsMenuId.set(null);
    }
  }

  toggleBookingsActionsMenu(reservationId: string, ev: Event): void {
    ev.stopPropagation();
    this.bookingsActionsMenuId.update((id) => (id === reservationId ? null : reservationId));
  }

  closeBookingsActionsMenu(): void {
    this.bookingsActionsMenuId.set(null);
  }

  openGuestProfileAndCloseBookingsMenu(reservationId: string, ev: Event): void {
    ev.stopPropagation();
    this.closeBookingsActionsMenu();
    this.openGuestProfile(reservationId);
  }

  openPosAndCloseBookingsMenu(reservationId: string, ev: Event): void {
    ev.stopPropagation();
    this.closeBookingsActionsMenu();
    this.openPosConsumption(reservationId);
  }

  toggleFloorLifecycleMs(ev: Event): void {
    ev.stopPropagation();
    this.floorLifecycleMsOpen.update((o) => !o);
  }

  floorLifecycleMsSummary(): string {
    const f = this.tm.floorLifecycleSlotFilters();
    const selected = RESERVATION_STATUS_OPTIONS.filter((st) => f[st]);
    if (selected.length === RESERVATION_STATUS_OPTIONS.length) {
      return 'All lifecycles';
    }
    if (selected.length === 0) {
      return 'None selected';
    }
    const labels = selected.map((st) => this.tm.lifecycleLabel(st));
    if (labels.length <= 2) {
      return labels.join(', ');
    }
    return `${selected.length} selected`;
  }

  openCreateReservationModal(): void {
    this.createReservationDraft.set(this.newCreateReservationDraft());
    this.createReservationError.set('');
    this.isCreateReservationModalOpen.set(true);
  }

  closeCreateReservationModal(): void {
    this.isCreateReservationModalOpen.set(false);
    this.createReservationError.set('');
  }

  openGuestProfile(reservationId: string): void {
    this.selectedPosReservationId.set(null);
    this.selectedProfileReservationId.set(reservationId);
  }

  closeGuestProfile(): void {
    this.selectedProfileReservationId.set(null);
  }

  openPosConsumption(reservationId: string): void {
    this.selectedProfileReservationId.set(null);
    this.selectedPosReservationId.set(reservationId);
  }

  closePosConsumption(): void {
    this.selectedPosReservationId.set(null);
  }

  selectedPosReservation(): Reservation | null {
    const id = this.selectedPosReservationId();
    if (!id) {
      return null;
    }
    return this.tm.reservations().find((row) => row.id === id) ?? null;
  }

  selectedGuestProfile(): Reservation | null {
    const id = this.selectedProfileReservationId();
    if (!id) {
      return null;
    }
    return this.tm.reservations().find((row) => row.id === id) ?? null;
  }

  guestProfileHistory(): Reservation[] {
    const profile = this.selectedGuestProfile();
    if (!profile) {
      return [];
    }
    return this.tm
      .reservations()
      .filter((row) => this.sameGuest(profile, row))
      .sort((a, b) => this.reservationSortMs(b) - this.reservationSortMs(a));
  }

  guestProfilePurchases(): Array<{
    id: string;
    label: string;
    context: string;
    total: number;
    paid: number;
    pos: number;
    isMock: boolean;
  }> {
    const profile = this.selectedGuestProfile();
    if (!profile) {
      return [];
    }
    const real = this.guestProfileHistory().map((row) => ({
      id: row.id,
      label: this.profileSessionLabel(row),
      context: `${row.groupSize} pax · ${this.tm.assignmentLine(row)} · ${this.tm.lifecycleLabel(row.lifecycleStatus)}`,
      total: row.totalPrice,
      paid: this.tm.sumPayments(row),
      pos: row.pos?.total ?? 0,
      isMock: false,
    }));

    const mock = [
      {
        id: `mock-${profile.id}-1`,
        label: 'Fri · 12 Jul',
        context: '4 pax · VIP sofa · Charged',
        total: 1180,
        paid: 1180,
        pos: 340,
        isMock: true,
      },
      {
        id: `mock-${profile.id}-2`,
        label: 'Sat · 08 Jun',
        context: '6 pax · Main Room table · Released',
        total: 1560,
        paid: 1560,
        pos: 420,
        isMock: true,
      },
    ];
    return [...real, ...mock];
  }

  guestProfileTotals(): { totalBooked: number; totalPaid: number; totalPos: number; outstanding: number } {
    const purchases = this.guestProfilePurchases();
    const totalBooked = purchases.reduce((sum, p) => sum + p.total, 0);
    const totalPaid = purchases.reduce((sum, p) => sum + p.paid, 0);
    const totalPos = purchases.reduce((sum, p) => sum + p.pos, 0);
    const outstanding = Math.max(0, totalBooked - totalPaid);
    return { totalBooked, totalPaid, totalPos, outstanding };
  }

  profileSessionLabel(reservation: Reservation): string {
    const event = this.tm.events.find((ev) => ev.id === reservation.eventId);
    const session = event?.sessions.find((s) => s.id === reservation.sessionId);
    return session ? `${session.label} · ${session.dateLabel}` : reservation.sessionId;
  }

  setCreateReservationField(
    key:
      | 'guestName'
      | 'phone'
      | 'email'
      | 'bookingFrom'
      | 'attribution'
      | 'internalNotes'
      | 'customerNotes'
      | 'timeRangeLabel'
      | 'sessionId'
      | 'tableId',
    value: string,
  ): void {
    this.createReservationDraft.update((draft) => ({ ...draft, [key]: value }));
  }

  setCreateReservationZone(value: ZoneKey): void {
    this.createReservationDraft.update((draft) => {
      const selectedTable = draft.tableId ? this.tm.tables().find((row) => row.id === draft.tableId) : null;
      const keepTable = !!selectedTable && selectedTable.zone === value;
      return { ...draft, zonePreference: value, tableId: keepTable ? draft.tableId : '' };
    });
  }

  setCreateReservationLifecycle(value: ReservationLifecycleStatus): void {
    this.createReservationDraft.update((draft) => ({ ...draft, lifecycleStatus: value }));
  }

  setCreateReservationGroupSize(value: string): void {
    const parsed = Math.round(Number(value));
    if (!Number.isFinite(parsed)) {
      return;
    }
    const tableId = this.createReservationDraft().tableId;
    const min = tableId ? this.tm.partySizeMinForTable(tableId) : 1;
    const max = tableId ? this.tm.partySizeMaxForTable(tableId) : 20;
    this.createReservationDraft.update((draft) => ({ ...draft, groupSize: Math.max(min, Math.min(max, parsed)) }));
  }

  setCreateReservationAmount(key: 'totalPrice' | 'depositTarget', value: string): void {
    const parsed = Math.round(Number(value));
    if (!Number.isFinite(parsed)) {
      return;
    }
    this.createReservationDraft.update((draft) => ({ ...draft, [key]: Math.max(0, parsed) }));
  }

  onCreateReservationTableChange(tableId: string): void {
    const table = tableId ? this.tm.tables().find((row) => row.id === tableId) : null;
    this.createReservationDraft.update((draft) => {
      const min = table ? this.tm.partySizeMinForTable(table.id) : 1;
      const max = table ? this.tm.partySizeMaxForTable(table.id) : 20;
      const groupSize = Math.max(min, Math.min(max, draft.groupSize));
      const totalPrice = table ? table.basePrice : draft.totalPrice;
      return {
        ...draft,
        tableId,
        zonePreference: table?.zone ?? draft.zonePreference,
        groupSize,
        totalPrice,
        depositTarget: Math.min(draft.depositTarget, totalPrice),
      };
    });
  }

  tablesForCreateZone() {
    const zone = this.createReservationDraft().zonePreference;
    return this.tm.tables().filter((table) => table.zone === zone);
  }

  submitCreateReservation(): void {
    const draft = this.createReservationDraft();
    const createdId = this.tm.createReservationFromBookings({
      sessionId: draft.sessionId,
      tableId: draft.tableId || null,
      zonePreference: draft.zonePreference,
      guestName: draft.guestName,
      groupSize: draft.groupSize,
      phone: draft.phone,
      email: draft.email,
      lifecycleStatus: draft.lifecycleStatus,
      totalPrice: draft.totalPrice,
      depositTarget: draft.depositTarget,
      attribution: draft.attribution,
      bookingFrom: draft.bookingFrom,
      internalNotes: draft.internalNotes,
      customerNotes: draft.customerNotes,
      timeRangeLabel: draft.timeRangeLabel,
    });
    if (!createdId) {
      this.createReservationError.set('Please check required fields and table availability.');
      return;
    }
    this.closeCreateReservationModal();
  }

  private sameGuest(base: Reservation, candidate: Reservation): boolean {
    if (base.id === candidate.id) {
      return true;
    }
    const baseEmail = base.email.trim().toLowerCase();
    const candidateEmail = candidate.email.trim().toLowerCase();
    if (baseEmail && candidateEmail) {
      return baseEmail === candidateEmail;
    }
    const basePhone = base.phone.replace(/\s/g, '');
    const candidatePhone = candidate.phone.replace(/\s/g, '');
    if (basePhone && candidatePhone) {
      return basePhone === candidatePhone;
    }
    return base.guestName.trim().toLowerCase() === candidate.guestName.trim().toLowerCase();
  }

  private reservationSortMs(reservation: Reservation): number {
    const event = this.tm.events.find((ev) => ev.id === reservation.eventId);
    const session = event?.sessions.find((s) => s.id === reservation.sessionId);
    if (!session) {
      return 0;
    }
    const ms = Date.parse(session.datetimeIso);
    return Number.isFinite(ms) ? ms : 0;
  }

  private newCreateReservationDraft(): {
    sessionId: string;
    tableId: string;
    zonePreference: ZoneKey;
    guestName: string;
    groupSize: number;
    phone: string;
    email: string;
    lifecycleStatus: ReservationLifecycleStatus;
    totalPrice: number;
    depositTarget: number;
    attribution: string;
    bookingFrom: string;
    internalNotes: string;
    customerNotes: string;
    timeRangeLabel: string;
  } {
    const event = this.tm.activeEvent();
    const sessionId = this.tm.visibleSessions()[0]?.id ?? event?.sessions[0]?.id ?? '';
    const totalPrice = 1300;
    return {
      sessionId,
      tableId: '',
      zonePreference: 'vip',
      guestName: '',
      groupSize: 6,
      phone: '',
      email: '',
      lifecycleStatus: 'pending',
      totalPrice,
      depositTarget: Math.round(totalPrice * 0.5),
      attribution: 'Concierge',
      bookingFrom: 'Backoffice',
      internalNotes: '',
      customerNotes: '',
      timeRangeLabel: '10:00 AM - 8:00 PM (10h)',
    };
  }
}
