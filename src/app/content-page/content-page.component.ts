import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PageTitleComponent } from '@shared';

type EventMode = 'one-off' | 'recurring';
type CalendarView = 'single-day' | 'multi-day';
type TableStatus = 'available' | 'reserved' | 'booked' | 'blocked';
type BookingStatus = 'pending confirmation' | 'confirmed';
type BookingPaymentStatus = 'paid' | 'not-paid';
type AssignmentStatus = 'pending confirmation' | 'confirmed';
type ZoneKey = 'vip' | 'main-room' | 'terrace';
type ZoneOrder = 'ops-priority' | 'alphabetical' | 'capacity-high';
type SidePanelMode =
  | 'closed'
  | 'available'
  | 'create'
  | 'reserved'
  | 'reserved-move'
  | 'blocked'
  | 'details'
  | 'move'
  | 'modify';

interface EventSession {
  id: string;
  label: string;
  dateLabel: string;
  datetimeIso: string;
}

interface EventConfig {
  id: string;
  name: string;
  mode: EventMode;
  sessions: EventSession[];
}

interface TableAsset {
  id: string;
  name: string;
  zone: ZoneKey;
  zoneLabel: string;
  minPax: number;
  maxPax: number;
  basePrice: number;
}

interface Booking {
  id: string;
  /** Shown as "Order ID - …" in FeverZone drawer */
  orderDisplayId?: string;
  eventId: string;
  sessionId: string;
  tableId: string;
  guestName: string;
  groupSize: number;
  /** Payment concept: booked = paid, reserved = not paid (slot-level). */
  paymentStatus: BookingPaymentStatus;
  status: BookingStatus;
  totalPrice: number;
  email?: string;
  phone?: string;
  /** e.g. "Online" — label in UI is "Booking from" */
  bookingFrom?: string;
  /** e.g. "10:00 AM - 8:00 PM (10h)" */
  timeRangeLabel?: string;
}

interface CellContext {
  session: EventSession;
  table: TableAsset;
}

interface ReservationDraft {
  sessionId: string;
  tableId: string;
  guestName: string;
  groupSize: number;
}

interface ReservedSlotInfo {
  orderRef: string;
  guestName: string;
  email: string;
  groupSize: number;
  assignmentStatus: AssignmentStatus;
}

@Component({
  selector: 'app-content-page',
  standalone: true,
  imports: [PageTitleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './content-page.component.html',
  styleUrl: './content-page.component.css',
})
export class ContentPageComponent {
  readonly events: EventConfig[] = [
    {
      id: 'event-recurring-sky-fridays',
      name: 'Birdie Shack Sky Box - August recurring',
      mode: 'recurring',
      sessions: [
        { id: 's-mon', label: 'Mon', dateLabel: '3 Aug', datetimeIso: '2026-08-03T22:00:00Z' },
        { id: 's-tue', label: 'Tue', dateLabel: '4 Aug', datetimeIso: '2026-08-04T22:00:00Z' },
        { id: 's-wed', label: 'Wed', dateLabel: '5 Aug', datetimeIso: '2026-08-05T22:00:00Z' },
        { id: 's-thu', label: 'Thu', dateLabel: '6 Aug', datetimeIso: '2026-08-06T22:00:00Z' },
        { id: 's-fri', label: 'Fri', dateLabel: '7 Aug', datetimeIso: '2026-08-07T22:00:00Z' },
        { id: 's-sat', label: 'Sat', dateLabel: '8 Aug', datetimeIso: '2026-08-08T22:00:00Z' },
        { id: 's-sun', label: 'Sun', dateLabel: '9 Aug', datetimeIso: '2026-08-09T22:00:00Z' },
      ],
    },
    {
      id: 'event-one-off-launch',
      name: 'Sky Box Season Kickoff (one-off)',
      mode: 'one-off',
      sessions: [{ id: 'oneoff-1', label: 'Fri', dateLabel: '14 Aug', datetimeIso: '2026-08-14T22:00:00Z' }],
    },
  ];

  readonly assets: TableAsset[] = [
    { id: 't-vip-1', name: 'VIP Booth A1', zone: 'vip', zoneLabel: 'VIP', minPax: 8, maxPax: 10, basePrice: 1200 },
    { id: 't-vip-2', name: 'VIP Booth A2', zone: 'vip', zoneLabel: 'VIP', minPax: 10, maxPax: 12, basePrice: 1500 },
    { id: 't-vip-3', name: 'VIP Booth A3', zone: 'vip', zoneLabel: 'VIP', minPax: 12, maxPax: 12, basePrice: 1800 },
    { id: 't-main-1', name: 'Main Floor 1', zone: 'main-room', zoneLabel: 'Main Room', minPax: 4, maxPax: 6, basePrice: 700 },
    { id: 't-main-2', name: 'Main Floor 2', zone: 'main-room', zoneLabel: 'Main Room', minPax: 6, maxPax: 8, basePrice: 900 },
    { id: 't-main-3', name: 'Main Floor 3', zone: 'main-room', zoneLabel: 'Main Room', minPax: 10, maxPax: 10, basePrice: 1050 },
    { id: 't-ter-1', name: 'Terrace 1', zone: 'terrace', zoneLabel: 'Terrace', minPax: 2, maxPax: 4, basePrice: 450 },
    { id: 't-ter-2', name: 'Terrace 2', zone: 'terrace', zoneLabel: 'Terrace', minPax: 6, maxPax: 6, basePrice: 620 },
  ];

  readonly eventId = signal('event-recurring-sky-fridays');
  readonly view = signal<CalendarView>('single-day');
  readonly singleDaySessionIndex = signal(0);
  readonly zoneOrder = signal<ZoneOrder>('ops-priority');
  readonly selectedZones = signal<Record<ZoneKey, boolean>>({
    vip: true,
    'main-room': true,
    terrace: true,
  });
  readonly selectedStatuses = signal<Record<TableStatus, boolean>>({
    available: true,
    reserved: true,
    booked: true,
    blocked: true,
  });
  readonly collapsedZones = signal<Record<ZoneKey, boolean>>({
    vip: false,
    'main-room': false,
    terrace: false,
  });

  readonly sidePanelMode = signal<SidePanelMode>('closed');
  readonly activeCell = signal<CellContext | null>(null);
  readonly activeBookingId = signal<string | null>(null);
  readonly reservedMoveTableId = signal('');
  readonly availableActionMessage = signal<string | null>(null);

  readonly reservationDraft = signal<ReservationDraft>({
    sessionId: '',
    tableId: '',
    guestName: '',
    groupSize: 2,
  });
  readonly modificationDraft = signal<{ tableId: string; groupSize: number }>({
    tableId: '',
    groupSize: 2,
  });

  readonly bookings = signal<Booking[]>([
    {
      id: 'b-400',
      orderDisplayId: '111048900',
      eventId: 'event-recurring-sky-fridays',
      sessionId: 's-mon',
      tableId: 't-main-1',
      guestName: 'Alicia Romero',
      groupSize: 6,
      paymentStatus: 'paid',
      status: 'confirmed',
      totalPrice: 700,
      email: 'alicia@example.com',
      phone: '+34 600 000 000',
      bookingFrom: 'Online',
      timeRangeLabel: '10:00 AM - 8:00 PM (10h)',
    },
    {
      id: 'b-401',
      orderDisplayId: '111048958',
      eventId: 'event-recurring-sky-fridays',
      sessionId: 's-mon',
      tableId: 't-vip-3',
      guestName: 'Davide Lovison',
      groupSize: 12,
      paymentStatus: 'paid',
      status: 'pending confirmation',
      totalPrice: 3800,
      email: 'davide.lovison@feverup.com',
      phone: '+34633146693',
      bookingFrom: 'Online',
      timeRangeLabel: '10:00 AM - 8:00 PM (10h)',
    },
    {
      id: 'b-402',
      orderDisplayId: '111048999',
      eventId: 'event-recurring-sky-fridays',
      sessionId: 's-sat',
      tableId: 't-main-2',
      guestName: 'Marta Fernandez',
      groupSize: 8,
      paymentStatus: 'paid',
      status: 'confirmed',
      totalPrice: 950,
      email: 'marta@example.com',
      phone: '+34 611 222 333',
      bookingFrom: 'Box office',
      timeRangeLabel: '10:00 AM - 8:00 PM (10h)',
    },
  ]);

  readonly reservedSlots = signal<Record<string, ReservedSlotInfo>>({
    'event-recurring-sky-fridays|s-mon|t-vip-2': {
      orderRef: 'ORD-R-110401',
      guestName: 'Nadia Ruiz',
      email: 'nadia.ruiz@example.com',
      groupSize: 10,
      assignmentStatus: 'pending confirmation',
    },
    'event-recurring-sky-fridays|s-thu|t-vip-2': {
      orderRef: 'ORD-R-110412',
      guestName: 'Pablo Estevez',
      email: 'pablo.estevez@example.com',
      groupSize: 8,
      assignmentStatus: 'confirmed',
    },
    'event-recurring-sky-fridays|s-sat|t-ter-1': {
      orderRef: 'ORD-R-110477',
      guestName: 'Lina Costa',
      email: 'lina.costa@example.com',
      groupSize: 4,
      assignmentStatus: 'pending confirmation',
    },
  });

  readonly blocked = signal<Record<string, string>>({
    'event-recurring-sky-fridays|s-mon|t-ter-2': 'Technical issue',
    'event-recurring-sky-fridays|s-sun|t-main-3': 'Maintenance',
    'event-one-off-launch|oneoff-1|t-vip-1': 'VIP sponsor lock',
  });

  readonly activeEvent = computed(() => this.events.find((event) => event.id === this.eventId()) ?? this.events[0]);

  readonly visibleSessions = computed(() => {
    const event = this.activeEvent();
    if (!event) {
      return [];
    }
    if (this.view() === 'single-day') {
      const idx = Math.min(Math.max(0, this.singleDaySessionIndex()), event.sessions.length - 1);
      return event.sessions.slice(idx, idx + 1);
    }
    return event.sessions;
  });

  readonly orderedZones = computed(() => {
    const groups: Record<ZoneKey, TableAsset[]> = {
      vip: [],
      'main-room': [],
      terrace: [],
    };
    for (const table of this.assets) {
      groups[table.zone].push(table);
    }

    const sortMode = this.zoneOrder();
    const orderByMode: ZoneKey[] =
      sortMode === 'alphabetical'
        ? (Object.entries(groups)
            .sort((a, b) => a[1][0].zoneLabel.localeCompare(b[1][0].zoneLabel))
            .map((entry) => entry[0]) as ZoneKey[])
        : sortMode === 'capacity-high'
          ? (Object.entries(groups)
              .sort((a, b) => this.avgCapacity(b[1]) - this.avgCapacity(a[1]))
              .map((entry) => entry[0]) as ZoneKey[])
          : ['vip', 'main-room', 'terrace'];

    return orderByMode.map((zone) => ({
        key: zone,
        label: groups[zone][0]?.zoneLabel ?? zone,
        tables: groups[zone],
      }));
  });

  readonly visibleZones = computed(() =>
    this.orderedZones().filter((zone) => this.selectedZones()[zone.key]),
  );

  readonly activeBooking = computed(() => {
    const bookingId = this.activeBookingId();
    if (!bookingId) {
      return null;
    }
    return this.bookings().find((booking) => booking.id === bookingId) ?? null;
  });

  readonly availableTablesForMove = computed(() => {
    const booking = this.activeBooking();
    const event = this.activeEvent();
    if (!booking || !event) {
      return [];
    }
    return this.orderedZones().map((zone) => ({
      ...zone,
      tables: zone.tables.filter((table) => {
        if (!this.isPartySizeCompatible(table.id, booking.groupSize)) {
          return false;
        }
        if (table.id === booking.tableId) {
          return true;
        }
        return this.resolveCellStatus(event.id, booking.sessionId, table.id) === 'available';
      }),
    }));
  });

  readonly availableTablesForReservedMove = computed(() => {
    const event = this.activeEvent();
    const cell = this.activeCell();
    const reserved = this.reservedSlotForActiveCell();
    if (!event || !cell || !reserved) {
      return [];
    }
    return this.orderedZones().map((zone) => ({
      ...zone,
      tables: zone.tables.filter((table) => {
        if (!this.isPartySizeCompatible(table.id, reserved.groupSize)) {
          return false;
        }
        if (table.id === cell.table.id) {
          return true;
        }
        return this.resolveCellStatus(event.id, cell.session.id, table.id) === 'available';
      }),
    }));
  });

  readonly currentModificationDelta = computed(() => {
    const booking = this.activeBooking();
    if (!booking) {
      return 0;
    }
    const next = this.modificationDraft();
    const nextTable = this.assets.find((asset) => asset.id === next.tableId);
    if (!nextTable) {
      return 0;
    }
    const variablePerGuest = 120;
    const nextPrice = nextTable.basePrice + Math.max(0, next.groupSize - nextTable.maxPax) * variablePerGuest;
    return nextPrice - booking.totalPrice;
  });

  setEvent(eventId: string): void {
    this.eventId.set(eventId);
    this.singleDaySessionIndex.set(0);
    const selectedEvent = this.events.find((event) => event.id === eventId);
    if (selectedEvent?.mode === 'one-off') {
      this.view.set('single-day');
    }
    this.sidePanelMode.set('closed');
    this.activeBookingId.set(null);
  }

  setView(nextView: CalendarView): void {
    const event = this.activeEvent();
    if (event?.mode === 'one-off' && nextView === 'multi-day') {
      this.view.set('single-day');
      return;
    }
    if (nextView === 'single-day') {
      this.singleDaySessionIndex.update((idx) => Math.max(0, idx));
    }
    this.view.set(nextView);
  }

  canGoPrevSingleDay(): boolean {
    return this.singleDaySessionIndex() > 0;
  }

  canGoNextSingleDay(): boolean {
    const sessions = this.activeEvent()?.sessions ?? [];
    return this.singleDaySessionIndex() < sessions.length - 1;
  }

  goPrevSingleDay(): void {
    if (!this.canGoPrevSingleDay()) {
      return;
    }
    this.singleDaySessionIndex.update((idx) => Math.max(0, idx - 1));
  }

  goNextSingleDay(): void {
    const sessions = this.activeEvent()?.sessions ?? [];
    if (sessions.length === 0 || !this.canGoNextSingleDay()) {
      return;
    }
    this.singleDaySessionIndex.update((idx) => Math.min(sessions.length - 1, idx + 1));
  }

  goFirstSingleDay(): void {
    this.singleDaySessionIndex.set(0);
  }

  setZoneOrder(order: ZoneOrder): void {
    this.zoneOrder.set(order);
  }

  toggleZoneFilter(zone: ZoneKey): void {
    this.selectedZones.update((state) => ({ ...state, [zone]: !state[zone] }));
  }

  toggleStatusFilter(status: TableStatus): void {
    this.selectedStatuses.update((state) => ({ ...state, [status]: !state[status] }));
  }

  toggleZoneCollapse(zone: ZoneKey): void {
    this.collapsedZones.update((state) => ({ ...state, [zone]: !state[zone] }));
  }

  isZoneCollapsed(zone: ZoneKey): boolean {
    return this.collapsedZones()[zone];
  }

  statusVisible(status: TableStatus): boolean {
    return this.selectedStatuses()[status];
  }

  resolveCellStatus(eventId: string, sessionId: string, tableId: string): TableStatus {
    const key = this.cellKey(eventId, sessionId, tableId);
    if (this.blocked()[key]) {
      return 'blocked';
    }
    const booked = this.bookings().some(
      (booking) =>
        booking.eventId === eventId &&
        booking.sessionId === sessionId &&
        booking.tableId === tableId,
    );
    if (booked) {
      return 'booked';
    }
    if (this.reservedSlots()[key]) {
      return 'reserved';
    }
    return 'available';
  }

  resolveBooking(eventId: string, sessionId: string, tableId: string): Booking | null {
    return (
      this.bookings().find(
        (booking) =>
          booking.eventId === eventId &&
          booking.sessionId === sessionId &&
          booking.tableId === tableId,
      ) ?? null
    );
  }

  openCell(session: EventSession, table: TableAsset): void {
    const event = this.activeEvent();
    if (!event) {
      return;
    }
    const status = this.resolveCellStatus(event.id, session.id, table.id);
    if (!this.statusVisible(status)) {
      return;
    }
    const booking = this.resolveBooking(event.id, session.id, table.id);
    if (booking) {
      this.openBookingDetails(booking.id);
      return;
    }
    this.activeBookingId.set(null);
    this.activeCell.set({ session, table });
    this.availableActionMessage.set(null);
    if (status === 'available') {
      this.sidePanelMode.set('available');
      return;
    }
    if (status === 'reserved') {
      this.initializeReservationDraft(session, table);
      this.reservedMoveTableId.set(table.id);
      this.sidePanelMode.set('reserved');
      return;
    }
    this.sidePanelMode.set('blocked');
  }

  openCreateBookingExternalFlow(): void {
    this.availableActionMessage.set('This would open the booking flow (out of scope in this prototype).');
  }

  openViewReservationExternalFlow(): void {
    this.availableActionMessage.set('This would open the reservation detail flow (out of scope in this prototype).');
  }

  blockAvailableSlot(): void {
    const event = this.activeEvent();
    const cell = this.activeCell();
    if (!event || !cell) {
      return;
    }
    const key = this.cellKey(event.id, cell.session.id, cell.table.id);
    this.blocked.update((rows) => ({ ...rows, [key]: 'Blocked by operator' }));
    this.closeSidePanel();
  }

  openBookingDetails(bookingId: string): void {
    const booking = this.bookings().find((row) => row.id === bookingId);
    if (!booking) {
      return;
    }
    this.activeBookingId.set(booking.id);
    this.modificationDraft.set({ tableId: booking.tableId, groupSize: booking.groupSize });
    this.sidePanelMode.set('details');
  }

  closeSidePanel(): void {
    this.sidePanelMode.set('closed');
    this.activeCell.set(null);
    this.activeBookingId.set(null);
    this.reservedMoveTableId.set('');
    this.availableActionMessage.set(null);
  }

  setReservationName(value: string): void {
    this.reservationDraft.update((draft) => ({ ...draft, guestName: value }));
  }

  setReservationGroupSize(value: string): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }
    this.reservationDraft.update((draft) => {
      const min = this.partySizeMinForTable(draft.tableId);
      const max = this.partySizeMaxForTable(draft.tableId);
      return { ...draft, groupSize: Math.max(min, Math.min(max, Math.round(parsed))) };
    });
  }

  confirmCreateReservation(): void {
    const event = this.activeEvent();
    const draft = this.reservationDraft();
    if (!event || !draft.tableId || !draft.sessionId || !draft.guestName.trim()) {
      return;
    }
    const table = this.assets.find((asset) => asset.id === draft.tableId);
    if (!table) {
      return;
    }
    const status = this.resolveCellStatus(event.id, draft.sessionId, draft.tableId);
    if (status !== 'available' && status !== 'reserved') {
      return;
    }
    const minPartySize = this.partySizeMinForTable(draft.tableId);
    const maxPartySize = this.partySizeMaxForTable(draft.tableId);
    const groupSize = Math.max(minPartySize, Math.min(maxPartySize, draft.groupSize));
    const oid = String(Math.floor(100000000 + Math.random() * 899999999));
    const newBooking: Booking = {
      id: `b-${Math.floor(Math.random() * 9000) + 1000}`,
      orderDisplayId: oid,
      eventId: event.id,
      sessionId: draft.sessionId,
      tableId: draft.tableId,
      guestName: draft.guestName.trim(),
      groupSize,
      paymentStatus: 'paid',
      status: 'pending confirmation',
      totalPrice: table.basePrice + Math.max(0, groupSize - table.maxPax) * 120,
      email: '',
      phone: '',
      bookingFrom: 'Online',
      timeRangeLabel: '10:00 AM - 8:00 PM (10h)',
    };
    this.bookings.update((rows) => [...rows, newBooking]);
    const key = this.cellKey(event.id, draft.sessionId, draft.tableId);
    this.reservedSlots.update((rows) => {
      if (!rows[key]) {
        return rows;
      }
      const next = { ...rows };
      delete next[key];
      return next;
    });
    this.openBookingDetails(newBooking.id);
  }

  openMoveTable(): void {
    if (!this.activeBooking()) {
      return;
    }
    this.sidePanelMode.set('move');
  }

  openModifyBooking(): void {
    if (!this.activeBooking()) {
      return;
    }
    this.sidePanelMode.set('modify');
  }

  setModificationTable(tableId: string): void {
    const min = this.partySizeMinForTable(tableId);
    const max = this.partySizeMaxForTable(tableId);
    this.modificationDraft.update((draft) => ({
      ...draft,
      tableId,
      groupSize: Math.max(min, Math.min(max, draft.groupSize)),
    }));
  }

  setModificationGroupSize(value: string): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }
    this.modificationDraft.update((draft) => {
      const min = this.partySizeMinForTable(draft.tableId);
      const max = this.partySizeMaxForTable(draft.tableId);
      return { ...draft, groupSize: Math.max(min, Math.min(max, Math.round(parsed))) };
    });
  }

  confirmMoveTable(): void {
    const booking = this.activeBooking();
    const nextTableId = this.modificationDraft().tableId;
    if (!booking || !nextTableId) {
      return;
    }
    const event = this.activeEvent();
    if (!event) {
      return;
    }
    if (!this.isPartySizeCompatible(nextTableId, booking.groupSize)) {
      return;
    }
    if (
      nextTableId !== booking.tableId &&
      this.resolveCellStatus(event.id, booking.sessionId, nextTableId) !== 'available'
    ) {
      return;
    }
    this.bookings.update((rows) =>
      rows.map((row) => (row.id === booking.id ? { ...row, tableId: nextTableId } : row)),
    );
    this.sidePanelMode.set('details');
  }

  confirmBookingModification(): void {
    const booking = this.activeBooking();
    const next = this.modificationDraft();
    if (!booking) {
      return;
    }
    const table = this.assets.find((asset) => asset.id === next.tableId);
    if (!table) {
      return;
    }
    if (!this.canConfirmBookingModification()) {
      return;
    }
    const maxGroupSize = this.partySizeMaxForTable(next.tableId);
    const minGroupSize = this.partySizeMinForTable(next.tableId);
    const groupSize = Math.max(minGroupSize, Math.min(maxGroupSize, next.groupSize));
    this.bookings.update((rows) =>
      rows.map((row) => {
        if (row.id !== booking.id) {
          return row;
        }
        const nextPrice = table.basePrice + Math.max(0, groupSize - table.maxPax) * 120;
        return {
          ...row,
          tableId: next.tableId,
          groupSize,
          totalPrice: nextPrice,
        };
      }),
    );
    this.sidePanelMode.set('details');
  }

  reserveOrderRefForActiveCell(): string {
    return this.reservedSlotForActiveCell()?.orderRef ?? '—';
  }

  reserveGuestForActiveCell(): string {
    return this.reservedSlotForActiveCell()?.guestName ?? '—';
  }

  reserveEmailForActiveCell(): string {
    const v = this.reservedSlotForActiveCell()?.email?.trim();
    return v ? v : '—';
  }

  reserveGroupSizeForActiveCell(): number {
    return this.reservedSlotForActiveCell()?.groupSize ?? 0;
  }

  reserveEstimatedPriceForActiveCell(): number {
    const cell = this.activeCell();
    const reserved = this.reservedSlotForActiveCell();
    if (!cell || !reserved) {
      return 0;
    }
    return cell.table.basePrice + Math.max(0, reserved.groupSize - cell.table.maxPax) * 120;
  }

  reserveAssignmentStatusForActiveCell(): AssignmentStatus {
    return this.reservedSlotForActiveCell()?.assignmentStatus ?? 'pending confirmation';
  }

  reserveAssignmentStatusLabel(status: AssignmentStatus): string {
    if (status === 'pending confirmation') {
      return 'Pending confirmation';
    }
    return 'Confirmed';
  }

  reserveAssignmentIsPending(status: AssignmentStatus): boolean {
    return status === 'pending confirmation';
  }

  confirmReservedAssignment(): void {
    const event = this.activeEvent();
    const cell = this.activeCell();
    if (!event || !cell) {
      return;
    }
    const key = this.cellKey(event.id, cell.session.id, cell.table.id);
    this.reservedSlots.update((rows) => {
      const slot = rows[key];
      if (!slot || slot.assignmentStatus === 'confirmed') {
        return rows;
      }
      return {
        ...rows,
        [key]: { ...slot, assignmentStatus: 'confirmed' },
      };
    });
  }

  openReservedMove(): void {
    const cell = this.activeCell();
    if (!cell) {
      return;
    }
    this.reservedMoveTableId.set(cell.table.id);
    this.sidePanelMode.set('reserved-move');
  }

  setReservedMoveTable(tableId: string): void {
    this.reservedMoveTableId.set(tableId);
  }

  backToReservedPanel(): void {
    this.sidePanelMode.set('reserved');
  }

  canConfirmReservedMove(): boolean {
    const event = this.activeEvent();
    const cell = this.activeCell();
    const reserved = this.reservedSlotForActiveCell();
    const targetId = this.reservedMoveTableId();
    if (!event || !cell || !reserved || !targetId) {
      return false;
    }
    if (!this.isPartySizeCompatible(targetId, reserved.groupSize)) {
      return false;
    }
    if (targetId === cell.table.id) {
      return true;
    }
    return this.resolveCellStatus(event.id, cell.session.id, targetId) === 'available';
  }

  confirmReservedMove(): void {
    if (!this.canConfirmReservedMove()) {
      return;
    }
    const event = this.activeEvent();
    const cell = this.activeCell();
    const reserved = this.reservedSlotForActiveCell();
    const targetId = this.reservedMoveTableId();
    if (!event || !cell || !reserved || !targetId) {
      return;
    }
    const fromKey = this.cellKey(event.id, cell.session.id, cell.table.id);
    const toKey = this.cellKey(event.id, cell.session.id, targetId);
    this.reservedSlots.update((rows) => {
      const next = { ...rows };
      delete next[fromKey];
      next[toKey] = { ...reserved, assignmentStatus: 'confirmed' };
      return next;
    });
    const targetTable = this.tableById(targetId);
    if (targetTable) {
      this.activeCell.set({ session: cell.session, table: targetTable });
    }
    this.sidePanelMode.set('reserved');
  }

  blockedReasonForActiveCell(): string {
    const event = this.activeEvent();
    const cell = this.activeCell();
    if (!event || !cell) {
      return 'Blocked slot';
    }
    const key = this.cellKey(event.id, cell.session.id, cell.table.id);
    return this.blocked()[key] ?? 'Blocked slot';
  }

  convertReservedToBooking(): void {
    const cell = this.activeCell();
    if (!cell) {
      return;
    }
    this.initializeReservationDraft(cell.session, cell.table);
    this.sidePanelMode.set('create');
  }

  releaseReservedSlot(): void {
    const event = this.activeEvent();
    const cell = this.activeCell();
    if (!event || !cell) {
      return;
    }
    const key = this.cellKey(event.id, cell.session.id, cell.table.id);
    this.reservedSlots.update((rows) => {
      if (!rows[key]) {
        return rows;
      }
      const next = { ...rows };
      delete next[key];
      return next;
    });
    this.closeSidePanel();
  }

  unblockSlot(): void {
    const event = this.activeEvent();
    const cell = this.activeCell();
    if (!event || !cell) {
      return;
    }
    const key = this.cellKey(event.id, cell.session.id, cell.table.id);
    this.blocked.update((rows) => {
      if (!rows[key]) {
        return rows;
      }
      const next = { ...rows };
      delete next[key];
      return next;
    });
    this.closeSidePanel();
  }

  tableById(tableId: string): TableAsset | null {
    return this.assets.find((asset) => asset.id === tableId) ?? null;
  }

  sessionById(sessionId: string): EventSession | null {
    return this.activeEvent()?.sessions.find((session) => session.id === sessionId) ?? null;
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + ' €';
  }

  canConfirmReservation(): boolean {
    const draft = this.reservationDraft();
    const min = this.partySizeMinForTable(draft.tableId);
    const max = this.partySizeMaxForTable(draft.tableId);
    return Boolean(draft.guestName.trim()) && draft.groupSize >= min && draft.groupSize <= max;
  }

  canConfirmMoveTable(): boolean {
    const booking = this.activeBooking();
    const nextTableId = this.modificationDraft().tableId;
    const event = this.activeEvent();
    if (!booking || !nextTableId || !event) {
      return false;
    }
    if (!this.isPartySizeCompatible(nextTableId, booking.groupSize)) {
      return false;
    }
    if (nextTableId === booking.tableId) {
      return true;
    }
    return this.resolveCellStatus(event.id, booking.sessionId, nextTableId) === 'available';
  }

  canConfirmBookingModification(): boolean {
    const booking = this.activeBooking();
    const next = this.modificationDraft();
    const event = this.activeEvent();
    if (!booking || !next.tableId || !event) {
      return false;
    }
    if (!this.isPartySizeCompatible(next.tableId, next.groupSize)) {
      return false;
    }
    if (next.tableId !== booking.tableId) {
      return this.resolveCellStatus(event.id, booking.sessionId, next.tableId) === 'available';
    }
    return true;
  }

  /** FeverZone-style details drawer for booked slots (details / move / modify). */
  isBookedSidePanelMode(): boolean {
    const mode = this.sidePanelMode();
    return mode === 'reserved' || mode === 'reserved-move' || mode === 'details' || mode === 'move' || mode === 'modify';
  }

  isBookedDetailsMode(): boolean {
    const mode = this.sidePanelMode();
    return mode === 'reserved' || mode === 'reserved-move' || mode === 'details';
  }

  orderIdLine(booking: Booking): string {
    const id = booking.orderDisplayId ?? booking.id.replace(/^b-/, '');
    return `Order ID - ${id}`;
  }

  timeRangeForBooking(booking: Booking): string {
    return booking.timeRangeLabel ?? '10:00 AM - 8:00 PM (10h)';
  }

  emailForBooking(booking: Booking): string {
    const v = booking.email?.trim();
    return v ? v : '—';
  }

  phoneForBooking(booking: Booking): string {
    const v = booking.phone?.trim();
    return v ? v : '—';
  }

  bookingFromForBooking(booking: Booking): string {
    return booking.bookingFrom ?? 'Online';
  }

  /** Full status label for drawer badge (matches FeverZone copy). */
  bookingStatusBadgeLabel(status: BookingStatus): string {
    if (status === 'pending confirmation') {
      return 'Pending confirmation';
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  bookingStatusBadgePending(status: BookingStatus): boolean {
    return status === 'pending confirmation';
  }

  bookingPaymentTagLabel(booking: Booking): string {
    return booking.paymentStatus === 'paid' ? 'Paid' : 'Not paid';
  }

  bookingIsPaid(booking: Booking): boolean {
    return booking.paymentStatus === 'paid';
  }

  confirmAssignment(): void {
    const booking = this.activeBooking();
    if (!booking || booking.status !== 'pending confirmation') {
      return;
    }
    this.bookings.update((rows) =>
      rows.map((row) => (row.id === booking.id ? { ...row, status: 'confirmed' } : row)),
    );
    this.sidePanelMode.set('details');
  }

  reservedSlotForCell(eventId: string, sessionId: string, tableId: string): ReservedSlotInfo | null {
    return this.reservedSlots()[this.cellKey(eventId, sessionId, tableId)] ?? null;
  }

  reservedOrderLabelForCell(eventId: string, sessionId: string, tableId: string): string {
    const slot = this.reservedSlotForCell(eventId, sessionId, tableId);
    return slot?.orderRef ?? 'Reserved';
  }

  reservedGuestLabelForCell(eventId: string, sessionId: string, tableId: string): string {
    const slot = this.reservedSlotForCell(eventId, sessionId, tableId);
    return slot?.guestName ?? 'Reserved booking';
  }

  reservedGroupSizeForCell(eventId: string, sessionId: string, tableId: string): number {
    const slot = this.reservedSlotForCell(eventId, sessionId, tableId);
    return slot?.groupSize ?? 0;
  }

  reservedCellSecondaryLabel(eventId: string, sessionId: string, tableId: string): string {
    const slot = this.reservedSlotForCell(eventId, sessionId, tableId);
    if (!slot) {
      return 'Not paid';
    }
    return `Not paid · ${this.reserveAssignmentStatusLabel(slot.assignmentStatus)}`;
  }

  partySizeMinForTable(tableId: string): number {
    return this.tableById(tableId)?.minPax ?? 1;
  }

  partySizeMaxForTable(tableId: string): number {
    return this.tableById(tableId)?.maxPax ?? 20;
  }


  tablePaxRangeLabel(table: TableAsset): string {
    if (table.minPax === table.maxPax) {
      return `${table.maxPax}`;
    }
    return `${table.minPax}-${table.maxPax}`;
  }

  isPartySizeCompatible(tableId: string, partySize: number): boolean {
    const min = this.partySizeMinForTable(tableId);
    const max = this.partySizeMaxForTable(tableId);
    return partySize >= min && partySize <= max;
  }

  private avgCapacity(tables: TableAsset[]): number {
    if (tables.length === 0) {
      return 0;
    }
    const total = tables.reduce((sum, table) => sum + table.maxPax, 0);
    return total / tables.length;
  }

  private cellKey(eventId: string, sessionId: string, tableId: string): string {
    return `${eventId}|${sessionId}|${tableId}`;
  }

  private reservedSlotForActiveCell(): ReservedSlotInfo | null {
    const event = this.activeEvent();
    const cell = this.activeCell();
    if (!event || !cell) {
      return null;
    }
    return this.reservedSlotForCell(event.id, cell.session.id, cell.table.id);
  }

  private initializeReservationDraft(session: EventSession, table: TableAsset): void {
    this.reservationDraft.set({
      sessionId: session.id,
      tableId: table.id,
      guestName: '',
      groupSize: Math.min(table.maxPax, Math.max(4, table.minPax)),
    });
  }
}
