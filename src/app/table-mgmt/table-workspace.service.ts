import { Injectable, computed, signal } from '@angular/core';
import type {
  AuditEntry,
  CalendarView,
  CellContext,
  CellInventoryStatus,
  EventConfig,
  EventSession,
  OpsTab,
  PaymentEntry,
  PosBillLine,
  PosSession,
  Reservation,
  ReservationDraft,
  ReservationLifecycleStatus,
  ReservedSlotInfo,
  SidePanelMode,
  TableAsset,
  UpfrontPaymentRequest,
  ZoneKey,
  ZoneOrder,
} from './table.models';
import { RESERVATION_STATUS_OPTIONS } from './table.models';

const VARIABLE_PER_GUEST = 120;

function allFloorLifecycleSlotFiltersOn(): Record<ReservationLifecycleStatus, boolean> {
  return Object.fromEntries(RESERVATION_STATUS_OPTIONS.map((s) => [s, true])) as Record<
    ReservationLifecycleStatus,
    boolean
  >;
}

function allFloorLifecycleSlotFiltersOff(): Record<ReservationLifecycleStatus, boolean> {
  return Object.fromEntries(RESERVATION_STATUS_OPTIONS.map((s) => [s, false])) as Record<
    ReservationLifecycleStatus,
    boolean
  >;
}

function nowIso(): string {
  return new Date().toISOString();
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

@Injectable({ providedIn: 'root' })
export class TableWorkspaceService {
  readonly events: EventConfig[] = [
    {
      id: 'event-recurring-sky-fridays',
      name: 'Nightclub event — August (recurring)',
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
      name: 'Nightclub event — one-off',
      mode: 'one-off',
      sessions: [{ id: 'oneoff-1', label: 'Fri', dateLabel: '14 Aug', datetimeIso: '2026-08-14T22:00:00Z' }],
    },
  ];

  readonly tables = signal<TableAsset[]>([
    { id: 't-vip-1', name: 'VIP Booth A1', zone: 'vip', zoneLabel: 'VIP', minPax: 8, maxPax: 10, basePrice: 1200, locked: false, hidden: false },
    { id: 't-vip-2', name: 'VIP Booth A2', zone: 'vip', zoneLabel: 'VIP', minPax: 10, maxPax: 12, basePrice: 1500, locked: false, hidden: false },
    { id: 't-vip-3', name: 'VIP Booth A3', zone: 'vip', zoneLabel: 'VIP', minPax: 12, maxPax: 12, basePrice: 1800, locked: false, hidden: false },
    { id: 't-main-1', name: 'Main Floor 1', zone: 'main-room', zoneLabel: 'Main Room', minPax: 4, maxPax: 6, basePrice: 700, locked: false, hidden: false },
    { id: 't-main-2', name: 'Main Floor 2', zone: 'main-room', zoneLabel: 'Main Room', minPax: 6, maxPax: 8, basePrice: 900, locked: false, hidden: false },
    { id: 't-main-3', name: 'Main Floor 3', zone: 'main-room', zoneLabel: 'Main Room', minPax: 10, maxPax: 10, basePrice: 1050, locked: false, hidden: false },
    { id: 't-ter-1', name: 'Terrace 1', zone: 'terrace', zoneLabel: 'Terrace', minPax: 2, maxPax: 4, basePrice: 450, locked: false, hidden: false },
    { id: 't-ter-2', name: 'Terrace 2', zone: 'terrace', zoneLabel: 'Terrace', minPax: 6, maxPax: 6, basePrice: 620, locked: false, hidden: false },
  ]);

  readonly reservations = signal<Reservation[]>([
    {
      id: 'b-400',
      orderDisplayId: '111048900',
      eventId: 'event-recurring-sky-fridays',
      sessionId: 's-mon',
      tableId: 't-main-1',
      guestName: 'Alicia Romero',
      groupSize: 6,
      phone: '+34 600 000 000',
      email: 'alicia@example.com',
      lifecycleStatus: 'accepted',
      totalPrice: 700,
      depositTarget: 350,
      payments: [{ id: 'pay-b400-1', method: 'Card', amount: 250, atIso: '2026-08-01T10:00:00.000Z', addedBy: 'Checkout' }],
      internalNotes: 'VIP host follow-up',
      customerNotes: '',
      attribution: 'Concierge — Ana',
      bookingFrom: 'Online',
      timeRangeLabel: '10:00 AM - 8:00 PM (10h)',
      checkedInCount: 0,
      rfidLinkedCount: 0,
      pos: null,
      checkInAtIso: null,
      checkOutAtIso: null,
      audit: [{ id: 'aud-seed-400', atIso: '2026-07-28T12:00:00.000Z', actor: 'System', message: 'Reservation seeded (prototype)' }],
    },
    {
      id: 'b-401',
      orderDisplayId: '111048958',
      eventId: 'event-recurring-sky-fridays',
      sessionId: 's-mon',
      tableId: 't-vip-3',
      guestName: 'Davide Lovison',
      groupSize: 12,
      phone: '+34633146693',
      email: 'davide.lovison@feverup.com',
      lifecycleStatus: 'accepted',
      totalPrice: 3800,
      depositTarget: 1900,
      payments: [{ id: 'pay-b401-1', method: 'Card', amount: 3800, atIso: '2026-08-02T09:30:00.000Z', addedBy: 'Checkout' }],
      internalNotes: '',
      customerNotes: 'Birthday table',
      attribution: 'PR — Marco',
      bookingFrom: 'Online',
      timeRangeLabel: '10:00 AM - 8:00 PM (10h)',
      checkedInCount: 0,
      rfidLinkedCount: 0,
      pos: null,
      checkInAtIso: null,
      checkOutAtIso: null,
      audit: [{ id: 'aud-seed-401', atIso: '2026-07-29T09:00:00.000Z', actor: 'System', message: 'Reservation seeded (prototype)' }],
    },
    {
      id: 'b-402',
      orderDisplayId: '111048999',
      eventId: 'event-recurring-sky-fridays',
      sessionId: 's-sat',
      tableId: 't-main-2',
      guestName: 'Marta Fernandez',
      groupSize: 8,
      phone: '+34 611 222 333',
      email: 'marta@example.com',
      lifecycleStatus: 'accepted',
      totalPrice: 950,
      depositTarget: 475,
      payments: [{ id: 'pay-b402-1', method: 'Bank transfer', amount: 950, atIso: '2026-08-03T14:00:00.000Z', addedBy: 'Finance' }],
      internalNotes: '',
      customerNotes: '',
      attribution: 'Box office',
      bookingFrom: 'Box office',
      timeRangeLabel: '10:00 AM - 8:00 PM (10h)',
      checkedInCount: 0,
      rfidLinkedCount: 0,
      pos: null,
      checkInAtIso: null,
      checkOutAtIso: null,
      audit: [{ id: 'aud-seed-402', atIso: '2026-07-30T11:00:00.000Z', actor: 'System', message: 'Reservation seeded (prototype)' }],
    },
    {
      id: 'b-403-pending-table',
      orderDisplayId: '111049050',
      eventId: 'event-recurring-sky-fridays',
      sessionId: 's-mon',
      tableId: 't-main-2',
      guestName: 'Demo · Pending — Leo Zhang',
      groupSize: 8,
      phone: '+34 633 100 200',
      email: 'leo.zhang@example.com',
      lifecycleStatus: 'pending',
      totalPrice: 900,
      depositTarget: 450,
      payments: [],
      internalNotes: 'Floor filter demo: counts under “To review” with slot holds',
      customerNotes: '',
      attribution: 'Sales',
      bookingFrom: 'Phone',
      timeRangeLabel: '10:00 AM - 8:00 PM (10h)',
      checkedInCount: 0,
      rfidLinkedCount: 0,
      pos: null,
      checkInAtIso: null,
      checkOutAtIso: null,
      audit: [{ id: 'aud-demo-pending', atIso: '2026-07-31T10:00:00.000Z', actor: 'Demo', message: 'Mock pending booking on table (prototype)' }],
    },
    {
      id: 'b-404-to-review-table',
      orderDisplayId: '111049051',
      eventId: 'event-recurring-sky-fridays',
      sessionId: 's-mon',
      tableId: 't-vip-1',
      guestName: 'Demo · To review — Kim Andersen',
      groupSize: 8,
      phone: '+34 633 100 201',
      email: 'kim.andersen@example.com',
      lifecycleStatus: 'to_review',
      totalPrice: 1200,
      depositTarget: 600,
      payments: [{ id: 'pay-b404-1', method: 'Card', amount: 200, atIso: '2026-08-01T12:00:00.000Z', addedBy: 'Checkout' }],
      internalNotes: 'Floor filter demo: lifecycle To review',
      customerNotes: '',
      attribution: 'Concierge',
      bookingFrom: 'Online',
      timeRangeLabel: '10:00 AM - 8:00 PM (10h)',
      checkedInCount: 0,
      rfidLinkedCount: 0,
      pos: null,
      checkInAtIso: null,
      checkOutAtIso: null,
      audit: [{ id: 'aud-demo-toreview', atIso: '2026-07-31T11:00:00.000Z', actor: 'Demo', message: 'Mock to_review on VIP table (prototype)' }],
    },
    {
      id: 'b-unassigned-1',
      orderDisplayId: '111049100',
      eventId: 'event-recurring-sky-fridays',
      sessionId: 's-mon',
      tableId: null,
      zonePreference: 'vip',
      guestName: 'Walk-in hold — Nina Ortiz',
      groupSize: 8,
      phone: '+34 622 333 444',
      email: 'nina@example.com',
      lifecycleStatus: 'pending',
      totalPrice: 1500,
      depositTarget: 750,
      payments: [],
      internalNotes: 'Needs VIP placement',
      customerNotes: '',
      attribution: 'Door',
      bookingFrom: 'Phone',
      timeRangeLabel: '10:00 AM - 8:00 PM (10h)',
      checkedInCount: 0,
      rfidLinkedCount: 0,
      pos: null,
      checkInAtIso: null,
      checkOutAtIso: null,
      audit: [{ id: 'aud-unassigned', atIso: nowIso(), actor: 'Operator', message: 'Unassigned reservation created (demo)' }],
    },
  ]);

  readonly reservedSlots = signal<Record<string, ReservedSlotInfo>>({
    'event-recurring-sky-fridays|s-mon|t-vip-2': {
      orderRef: 'ORD-R-110401',
      guestName: 'Nadia Ruiz',
      email: 'nadia.ruiz@example.com',
      groupSize: 10,
      assignmentStatus: 'pending_confirmation',
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
      assignmentStatus: 'pending_confirmation',
    },
  });

  readonly blocked = signal<Record<string, string>>({
    'event-recurring-sky-fridays|s-mon|t-ter-2': 'Technical issue',
    'event-recurring-sky-fridays|s-sun|t-main-3': 'Maintenance',
    'event-one-off-launch|oneoff-1|t-vip-1': 'VIP sponsor lock',
  });

  readonly eventId = signal('event-recurring-sky-fridays');
  readonly view = signal<CalendarView>('single-day');
  readonly singleDaySessionIndex = signal(0);
  readonly zoneOrder = signal<ZoneOrder>('alphabetical');
  readonly selectedZones = signal<Record<ZoneKey, boolean>>({
    vip: true,
    'main-room': true,
    terrace: true,
  });
  /** Floor + modify panel: show booking slots whose reservation lifecycle is checked (plus empty/blocked always; holds when Pending or To review is on). */
  readonly floorLifecycleSlotFilters = signal<Record<ReservationLifecycleStatus, boolean>>(allFloorLifecycleSlotFiltersOn());
  readonly collapsedZones = signal<Record<ZoneKey, boolean>>({
    vip: false,
    'main-room': false,
    terrace: false,
  });

  readonly opsTab = signal<OpsTab>('floor');
  readonly sidePanelMode = signal<SidePanelMode>('closed');
  readonly activeCell = signal<CellContext | null>(null);
  readonly activeReservationId = signal<string | null>(null);
  readonly reservedMoveTableId = signal('');
  readonly availableActionMessage = signal<string | null>(null);

  readonly reservationDraft = signal<ReservationDraft>({
    sessionId: '',
    tableId: '',
    guestName: '',
    groupSize: 2,
  });
  readonly modificationDraft = signal<{ tableId: string; groupSize: number; totalPrice: number; manualTotalPrice: boolean }>({
    tableId: '',
    groupSize: 2,
    totalPrice: 0,
    manualTotalPrice: false,
  });

  readonly paymentDraft = signal<{ method: string; amount: string; addedBy: string }>({
    method: 'Bank transfer',
    amount: '',
    addedBy: 'Operator',
  });
  readonly upfrontRequestDraft = signal<{ amount: string; note: string }>({
    amount: '',
    note: '',
  });

  setPaymentDraft(partial: Partial<{ method: string; amount: string; addedBy: string }>): void {
    this.paymentDraft.update((d) => ({ ...d, ...partial }));
  }

  setUpfrontRequestDraft(partial: Partial<{ amount: string; note: string }>): void {
    this.upfrontRequestDraft.update((draft) => ({ ...draft, ...partial }));
  }

  readonly bookingStatusFilter = signal<ReservationLifecycleStatus | 'all'>('all');
  readonly bookingQuery = signal('');
  readonly doorQuery = signal('');

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

  readonly singleDayTodaySessionIndex = computed(() => {
    const event = this.activeEvent();
    if (!event?.sessions.length) {
      return 0;
    }
    const now = new Date();
    const y = now.getFullYear();
    const mo = now.getMonth();
    const d = now.getDate();
    for (let i = 0; i < event.sessions.length; i++) {
      const dt = new Date(event.sessions[i].datetimeIso);
      if (dt.getFullYear() === y && dt.getMonth() === mo && dt.getDate() === d) {
        return i;
      }
    }
    return 0;
  });

  readonly isSingleDayOnTodaySession = computed(
    () => this.singleDaySessionIndex() === this.singleDayTodaySessionIndex(),
  );

  readonly orderedZones = computed(() => {
    const groups: Record<ZoneKey, TableAsset[]> = {
      vip: [],
      'main-room': [],
      terrace: [],
    };
    for (const table of this.tables()) {
      if (!table.hidden) {
        groups[table.zone].push(table);
      }
    }

    const sortMode = this.zoneOrder();
    const entries = Object.entries(groups) as [ZoneKey, TableAsset[]][];
    let orderByMode: ZoneKey[];
    switch (sortMode) {
      case 'alphabetical':
        orderByMode = entries
          .filter((e) => e[1].length > 0)
          .sort((a, b) => a[1][0].zoneLabel.localeCompare(b[1][0].zoneLabel))
          .map((e) => e[0]);
        break;
      case 'capacity-high':
        orderByMode = entries
          .filter((e) => e[1].length > 0)
          .sort((a, b) => this.avgCapacity(b[1]) - this.avgCapacity(a[1]))
          .map((e) => e[0]);
        break;
      case 'price-high':
        orderByMode = entries
          .filter((e) => e[1].length > 0)
          .sort((a, b) => this.avgBasePrice(b[1]) - this.avgBasePrice(a[1]))
          .map((e) => e[0]);
        break;
      case 'price-low':
        orderByMode = entries
          .filter((e) => e[1].length > 0)
          .sort((a, b) => this.avgBasePrice(a[1]) - this.avgBasePrice(b[1]))
          .map((e) => e[0]);
        break;
    }

    return orderByMode.map((zone) => ({
      key: zone,
      label: groups[zone][0]?.zoneLabel ?? zone,
      tables: groups[zone],
    }));
  });

  readonly visibleZones = computed(() => this.orderedZones().filter((zone) => this.selectedZones()[zone.key]));

  readonly floorZones = computed(() => {
    const event = this.activeEvent();
    const sessions = this.visibleSessions();
    const zones = this.visibleZones();
    if (!event || !sessions.length) {
      return [];
    }
    return zones
      .map((zone) => ({
        ...zone,
        tables: zone.tables.filter((table) =>
          sessions.some((session) => this.floorSlotFilterVisible(event.id, session.id, table.id)),
        ),
      }))
      .filter((zone) => zone.tables.length > 0);
  });

  /** Per-table summary for venue map across visible sessions (matches floor cell semantics). */
  readonly venueMapTableStatusLabels = computed(() => {
    const event = this.activeEvent();
    const sessions = this.visibleSessions();
    const out: Record<string, string> = {};
    if (!event || !sessions.length) {
      return out;
    }

    for (const table of this.tables()) {
      if (table.hidden) {
        continue;
      }
      const labels = new Set<string>();
      for (const session of sessions) {
        const st = this.resolveCellStatus(event.id, session.id, table.id);
        const res = this.resolveReservationOnCell(event.id, session.id, table.id);
        labels.add(this.calendarSlotStatusLabel(st, res));
      }
      if (labels.size === 1) {
        out[table.id] = [...labels][0];
      } else {
        out[table.id] = 'Mixed sessions';
      }
    }
    return out;
  });

  /**
   * Venue map / cross-session summary: whether the table has a reservation on all, some, or none of the visible sessions.
   */
  readonly venueMapTableAssignmentKind = computed(() => {
    const event = this.activeEvent();
    const sessions = this.visibleSessions();
    const out: Record<string, 'assigned' | 'partial' | 'open' | 'blocked'> = {};
    if (!event || !sessions.length) {
      return out;
    }

    for (const table of this.tables()) {
      if (table.hidden) {
        continue;
      }
      let blocked = 0;
      let withRes = 0;
      let open = 0;

      for (const session of sessions) {
        const st = this.resolveCellStatus(event.id, session.id, table.id);
        const res = this.resolveReservationOnCell(event.id, session.id, table.id);
        if (st === 'blocked') {
          blocked++;
        } else if (res) {
          withRes++;
        } else {
          open++;
        }
      }

      const bookable = sessions.length - blocked;
      if (bookable <= 0) {
        out[table.id] = 'blocked';
      } else if (withRes === bookable) {
        out[table.id] = 'assigned';
      } else if (withRes === 0) {
        out[table.id] = 'open';
      } else {
        out[table.id] = 'partial';
      }
    }
    return out;
  });

  /** Tooltip / a11y line for floor grid cells (assigned vs not). */
  floorSlotAssignmentSummary(status: CellInventoryStatus, hasReservation: boolean): string {
    if (hasReservation) {
      return 'Table assigned — reservation on this slot';
    }
    if (status === 'blocked') {
      return 'Blocked — not assignable';
    }
    if (status === 'reserved') {
      return `${this.lifecycleLabel('to_review')} — slot held, table not assigned yet`;
    }
    return 'Not assigned — table available';
  }

  /** Title tooltip when a booking occupies the floor cell (deposit paid + booking total). */
  floorSlotReservationTooltip(status: CellInventoryStatus, reservation: Reservation | null): string {
    const base = this.floorSlotAssignmentSummary(status, !!reservation);
    if (!reservation) {
      return base;
    }
    return `${base}. Deposit paid ${this.formatPrice(this.sumPayments(reservation))}, total ${this.formatPrice(reservation.totalPrice)}`;
  }

  venueMapTableAssignmentTitle(tableId: string): string {
    switch (this.venueMapTableAssignmentKind()[tableId]) {
      case 'assigned':
        return 'Table assigned on all visible sessions';
      case 'partial':
        return 'Assigned on some sessions only';
      case 'blocked':
        return 'Blocked on all visible sessions';
      default:
        return 'Not assigned on visible sessions';
    }
  }

  readonly activeReservation = computed(() => {
    const id = this.activeReservationId();
    if (!id) {
      return null;
    }
    return this.reservations().find((r) => r.id === id) ?? null;
  });

  readonly availableTablesForMove = computed(() => {
    const reservation = this.activeReservation();
    const event = this.activeEvent();
    if (!reservation?.tableId || !event) {
      return [];
    }
    const current = this.tableById(reservation.tableId);
    if (!current) {
      return [];
    }
    const zoneMeta = this.orderedZones().find((zone) => zone.key === current.zone);
    if (!zoneMeta) {
      return [];
    }
    const tables = zoneMeta.tables.filter((table) => {
      if (table.zone !== current.zone || table.locked) {
        return false;
      }
      if (!this.isPartySizeCompatible(table.id, reservation.groupSize)) {
        return false;
      }
      if (table.id === reservation.tableId) {
        return true;
      }
      return this.resolveCellStatus(event.id, reservation.sessionId, table.id) === 'available';
    });
    return tables.length ? [{ ...zoneMeta, tables }] : [];
  });

  readonly availableTablesForReservedMove = computed(() => {
    const event = this.activeEvent();
    const cell = this.activeCell();
    const reserved = this.reservedSlotForActiveCell();
    if (!event || !cell || !reserved) {
      return [];
    }
    const zoneMeta = this.orderedZones().find((zone) => zone.key === cell.table.zone);
    if (!zoneMeta) {
      return [];
    }
    const tables = zoneMeta.tables.filter((table) => {
      if (table.zone !== cell.table.zone || table.locked) {
        return false;
      }
      if (!this.isPartySizeCompatible(table.id, reserved.groupSize)) {
        return false;
      }
      if (table.id === cell.table.id) {
        return true;
      }
      return this.resolveCellStatus(event.id, cell.session.id, table.id) === 'available';
    });
    return tables.length ? [{ ...zoneMeta, tables }] : [];
  });

  readonly currentModificationDelta = computed(() => {
    const reservation = this.activeReservation();
    if (!reservation) {
      return 0;
    }
    const next = this.modificationDraft();
    if (!Number.isFinite(next.totalPrice)) {
      return 0;
    }
    return next.totalPrice - reservation.totalPrice;
  });

  readonly reportingSnapshot = computed(() => {
    const rows = this.reservations();
    let pendingPayments = 0;
    let depositAndPrepay = 0;
    let posConsumption = 0;
    let noShow = 0;
    let checkedIn = 0;
    let expected = 0;
    for (const r of rows) {
      expected += r.groupSize;
      checkedIn += r.checkedInCount;
      const paid = this.sumPayments(r);
      const outstanding = Math.max(0, r.totalPrice - paid);
      if (outstanding > 0.01 && !['cancelled_by_client', 'canceled', 'released', 'no_show'].includes(r.lifecycleStatus)) {
        pendingPayments++;
      }
      depositAndPrepay += paid;
      if (r.pos) {
        posConsumption += r.pos.total;
      }
      if (r.lifecycleStatus === 'no_show') {
        noShow++;
      }
    }
    const occupancyRate = expected > 0 ? checkedIn / expected : 0;
    const noShowRate = rows.length > 0 ? noShow / rows.length : 0;
    return {
      pendingPayments,
      totalReservationPayments: depositAndPrepay,
      posConsumption,
      totalRevenueApprox: depositAndPrepay + posConsumption,
      occupancyRate,
      noShowRate,
      reconciliationNote: 'Prototype: Fever bookings + POS consumption + RFID counts (mock).',
    };
  });

  readonly reservationsByZone = computed(() => {
    const event = this.activeEvent();
    const sessions = this.visibleSessions();
    const sessionIdSet = new Set(sessions.map((s) => s.id));
    const filter = this.bookingStatusFilter();
    const q = this.bookingQuery().trim().toLowerCase();
    const hasQuery = q.length > 0;
    const qPhone = q.replace(/\s/g, '');
    const rows = this.reservations().filter(
      (r) =>
        r.eventId === event?.id &&
        sessionIdSet.has(r.sessionId) &&
        (filter === 'all' || r.lifecycleStatus === filter) &&
        (!q ||
          r.guestName.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.phone.replace(/\s/g, '').includes(qPhone)),
    );

    const zones = this.orderedZones();
    const result: {
      key: ZoneKey;
      label: string;
      reservations: Reservation[];
      tablesTotal: number;
      tablesReserved: number;
      bookings: number;
      checkedIn: number;
      expectedGuests: number;
      depositPaidSum: number;
      reservationsTotalSum: number;
    }[] = [];

    for (const z of zones) {
      const tablesTotal = z.tables.filter((t) => !t.hidden).length;
      const inZone = rows.filter((r) => {
        if (r.tableId) {
          const t = this.tableById(r.tableId);
          return t?.zone === z.key;
        }
        return r.zonePreference === z.key;
      });
      const tablesReserved = new Set(
        inZone.map((r) => r.tableId).filter((id): id is string => Boolean(id)),
      ).size;
      const checkedIn = inZone.reduce((s, r) => s + r.checkedInCount, 0);
      const expectedGuests = inZone.reduce((s, r) => s + r.groupSize, 0);
      const depositPaidSum = inZone.reduce((s, r) => s + this.sumPayments(r), 0);
      const reservationsTotalSum = inZone.reduce((s, r) => s + r.totalPrice, 0);
      const block = {
        key: z.key,
        label: z.label,
        reservations: inZone,
        tablesTotal,
        tablesReserved,
        bookings: inZone.length,
        checkedIn,
        expectedGuests,
        depositPaidSum,
        reservationsTotalSum,
      };
      if (!hasQuery || block.reservations.length > 0) {
        result.push(block);
      }
    }
    return result;
  });

  readonly doorMatches = computed(() => {
    const q = this.doorQuery().trim().toLowerCase();
    const event = this.activeEvent();
    if (!event) {
      return [];
    }
    let rows = this.reservations().filter((r) => r.eventId === event.id);
    if (q) {
      rows = rows.filter(
        (r) =>
          r.guestName.toLowerCase().includes(q) ||
          r.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
          r.email.toLowerCase().includes(q),
      );
    }
    return rows.slice(0, 40);
  });

  setOpsTab(tab: OpsTab): void {
    this.opsTab.set(tab);
  }

  setEvent(eventId: string): void {
    this.eventId.set(eventId);
    this.singleDaySessionIndex.set(0);
    const selectedEvent = this.events.find((event) => event.id === eventId);
    if (selectedEvent?.mode === 'one-off') {
      this.view.set('single-day');
    }
    this.sidePanelMode.set('closed');
    this.activeReservationId.set(null);
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

  goTodaySingleDay(): void {
    this.singleDaySessionIndex.set(this.singleDayTodaySessionIndex());
  }

  setZoneOrder(order: ZoneOrder): void {
    this.zoneOrder.set(order);
  }

  toggleZoneFilter(zone: ZoneKey): void {
    this.selectedZones.update((state) => ({ ...state, [zone]: !state[zone] }));
  }

  toggleFloorLifecycleSlotFilter(status: ReservationLifecycleStatus): void {
    this.floorLifecycleSlotFilters.update((state) => ({ ...state, [status]: !state[status] }));
  }

  selectAllFloorLifecycleSlotFilters(): void {
    this.floorLifecycleSlotFilters.set(allFloorLifecycleSlotFiltersOn());
  }

  clearFloorLifecycleSlotFilters(): void {
    this.floorLifecycleSlotFilters.set(allFloorLifecycleSlotFiltersOff());
  }

  toggleZoneCollapse(zone: ZoneKey): void {
    this.collapsedZones.update((state) => ({ ...state, [zone]: !state[zone] }));
  }

  isZoneCollapsed(zone: ZoneKey): boolean {
    return this.collapsedZones()[zone];
  }

  /**
   * Floor grid: lifecycle checkboxes only (bookings). Empty + blocked slots always shown; slot holds when Pending or To review is on.
   */
  floorSlotFilterVisible(eventId: string, sessionId: string, tableId: string): boolean {
    const status = this.resolveCellStatus(eventId, sessionId, tableId);
    const res = this.resolveReservationOnCell(eventId, sessionId, tableId);
    const filters = this.floorLifecycleSlotFilters();

    if (status === 'blocked' || status === 'available') {
      return true;
    }
    if (status === 'reserved') {
      return Boolean(filters.pending || filters.to_review);
    }
    if (status === 'booked' && res) {
      return Boolean(filters[res.lifecycleStatus]);
    }
    return true;
  }

  resolveCellStatus(eventId: string, sessionId: string, tableId: string): CellInventoryStatus {
    const key = this.cellKey(eventId, sessionId, tableId);
    const tbl = this.tableById(tableId);
    if (tbl?.locked) {
      return 'blocked';
    }
    if (this.blocked()[key]) {
      return 'blocked';
    }
    const booked = this.reservations().some(
      (r) =>
        r.tableId === tableId &&
        r.eventId === eventId &&
        r.sessionId === sessionId &&
        !this.isTerminalLifecycle(r.lifecycleStatus),
    );
    if (booked) {
      return 'booked';
    }
    if (this.reservedSlots()[key]) {
      return 'reserved';
    }
    return 'available';
  }

  resolveReservationOnCell(eventId: string, sessionId: string, tableId: string): Reservation | null {
    return (
      this.reservations().find(
        (r) =>
          r.tableId === tableId &&
          r.eventId === eventId &&
          r.sessionId === sessionId &&
          !this.isTerminalLifecycle(r.lifecycleStatus),
      ) ?? null
    );
  }

  openCell(session: EventSession, table: TableAsset): void {
    const event = this.activeEvent();
    if (!event) {
      return;
    }
    const status = this.resolveCellStatus(event.id, session.id, table.id);
    if (!this.floorSlotFilterVisible(event.id, session.id, table.id)) {
      return;
    }
    const reservation = this.resolveReservationOnCell(event.id, session.id, table.id);
    if (reservation) {
      this.openReservationDetails(reservation.id);
      return;
    }
    this.activeReservationId.set(null);
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

  openReservationDetails(reservationId: string): void {
    const reservation = this.reservations().find((row) => row.id === reservationId);
    if (!reservation) {
      return;
    }
    this.activeReservationId.set(reservation.id);
    this.modificationDraft.set({
      tableId: reservation.tableId ?? '',
      groupSize: reservation.groupSize,
      totalPrice: reservation.totalPrice,
      manualTotalPrice: false,
    });
    this.upfrontRequestDraft.set({ amount: '', note: '' });
    this.sidePanelMode.set('details');
  }

  closeSidePanel(): void {
    this.sidePanelMode.set('closed');
    this.activeCell.set(null);
    this.activeReservationId.set(null);
    this.reservedMoveTableId.set('');
    this.availableActionMessage.set(null);
  }

  openCreateBookingExternalFlow(): void {
    this.availableActionMessage.set('Checkout / partner booking flow would open here (mock).');
  }

  openViewReservationExternalFlow(): void {
    this.availableActionMessage.set('Partner reservation detail would open here (mock).');
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
    const table = this.tables().find((asset) => asset.id === draft.tableId);
    if (!table || table.locked) {
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
    const totalPrice = table.basePrice + Math.max(0, groupSize - table.maxPax) * VARIABLE_PER_GUEST;
    const newReservation: Reservation = {
      id: uid('b'),
      orderDisplayId: oid,
      eventId: event.id,
      sessionId: draft.sessionId,
      tableId: draft.tableId,
      guestName: draft.guestName.trim(),
      groupSize,
      phone: '',
      email: '',
      lifecycleStatus: 'pending',
      totalPrice,
      depositTarget: Math.round(totalPrice * 0.5),
      payments: [],
      internalNotes: '',
      customerNotes: '',
      attribution: 'Staff — Floor',
      bookingFrom: 'Online',
      timeRangeLabel: '10:00 AM - 8:00 PM (10h)',
      checkedInCount: 0,
      rfidLinkedCount: 0,
      pos: null,
      checkInAtIso: null,
      checkOutAtIso: null,
      audit: [],
    };
    newReservation.audit = this.appendAudit(newReservation.audit, 'Reservation created from floor');
    this.reservations.update((rows) => [...rows, newReservation]);
    const key = this.cellKey(event.id, draft.sessionId, draft.tableId);
    this.reservedSlots.update((rows) => {
      if (!rows[key]) {
        return rows;
      }
      const next = { ...rows };
      delete next[key];
      return next;
    });
    this.openReservationDetails(newReservation.id);
  }

  quickCreateUnassigned(name: string, pax: number, zone: ZoneKey): void {
    const event = this.activeEvent();
    if (!event || !name.trim()) {
      return;
    }
    const sessionId = this.visibleSessions()[0]?.id ?? event.sessions[0]?.id;
    if (!sessionId) {
      return;
    }
    const totalPrice = 1000 + pax * 50;
    const row: Reservation = {
      id: uid('b'),
      orderDisplayId: String(Math.floor(100000000 + Math.random() * 899999999)),
      eventId: event.id,
      sessionId,
      tableId: null,
      zonePreference: zone,
      guestName: name.trim(),
      groupSize: Math.max(1, Math.round(pax)),
      phone: '',
      email: '',
      lifecycleStatus: 'pending',
      totalPrice,
      depositTarget: Math.round(totalPrice * 0.5),
      payments: [],
      internalNotes: '',
      customerNotes: '',
      attribution: 'Concierge',
      bookingFrom: 'Backoffice',
      timeRangeLabel: '10:00 AM - 8:00 PM (10h)',
      checkedInCount: 0,
      rfidLinkedCount: 0,
      pos: null,
      checkInAtIso: null,
      checkOutAtIso: null,
      audit: [],
    };
    row.audit = this.appendAudit(row.audit, 'Quick create (unassigned)');
    this.reservations.update((rows) => [...rows, row]);
    this.openReservationDetails(row.id);
    this.opsTab.set('bookings');
  }

  createReservationFromBookings(payload: {
    sessionId: string;
    tableId: string | null;
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
  }): string | null {
    const event = this.activeEvent();
    if (!event) {
      return null;
    }
    const guestName = payload.guestName.trim();
    if (!guestName || !payload.sessionId) {
      return null;
    }

    const table = payload.tableId ? this.tableById(payload.tableId) : null;
    if (payload.tableId && (!table || table.locked)) {
      return null;
    }
    if (table) {
      const status = this.resolveCellStatus(event.id, payload.sessionId, table.id);
      if (status !== 'available' && status !== 'reserved') {
        return null;
      }
    }

    const minPartySize = table ? this.partySizeMinForTable(table.id) : 1;
    const maxPartySize = table ? this.partySizeMaxForTable(table.id) : 20;
    const groupSize = Math.max(minPartySize, Math.min(maxPartySize, Math.round(payload.groupSize)));
    const fallbackPrice = table ? table.basePrice : 1000 + groupSize * 50;
    const totalPrice = Number.isFinite(payload.totalPrice) ? Math.max(0, Math.round(payload.totalPrice)) : fallbackPrice;
    const depositTarget = Number.isFinite(payload.depositTarget)
      ? Math.max(0, Math.round(payload.depositTarget))
      : Math.round(totalPrice * 0.5);

    const row: Reservation = {
      id: uid('b'),
      orderDisplayId: String(Math.floor(100000000 + Math.random() * 899999999)),
      eventId: event.id,
      sessionId: payload.sessionId,
      tableId: table?.id ?? null,
      zonePreference: table?.zone ?? payload.zonePreference,
      guestName,
      groupSize,
      phone: payload.phone.trim(),
      email: payload.email.trim(),
      lifecycleStatus: payload.lifecycleStatus,
      totalPrice,
      depositTarget,
      payments: [],
      internalNotes: payload.internalNotes.trim(),
      customerNotes: payload.customerNotes.trim(),
      attribution: payload.attribution.trim() || 'Operator',
      bookingFrom: payload.bookingFrom.trim() || 'Backoffice',
      timeRangeLabel: payload.timeRangeLabel.trim() || '10:00 AM - 8:00 PM (10h)',
      checkedInCount: 0,
      rfidLinkedCount: 0,
      pos: null,
      checkInAtIso: null,
      checkOutAtIso: null,
      audit: [],
    };
    row.audit = this.appendAudit(row.audit, 'Reservation created from Reservations tab');

    this.reservations.update((rows) => [...rows, row]);

    if (table) {
      const key = this.cellKey(event.id, payload.sessionId, table.id);
      this.reservedSlots.update((rows) => {
        if (!rows[key]) {
          return rows;
        }
        const next = { ...rows };
        delete next[key];
        return next;
      });
    }

    this.openReservationDetails(row.id);
    this.opsTab.set('bookings');
    return row.id;
  }

  openMoveTable(): void {
    if (!this.activeReservation()) {
      return;
    }
    this.sidePanelMode.set('move');
  }

  openModifyBooking(): void {
    if (!this.activeReservation()) {
      return;
    }
    this.upfrontRequestDraft.set({ amount: '', note: '' });
    this.sidePanelMode.set('modify');
  }

  setModificationTable(tableId: string): void {
    const reservation = this.activeReservation();
    const draft = this.modificationDraft();
    if (!tableId) {
      this.modificationDraft.update((d) => ({
        ...d,
        tableId: '',
        totalPrice: reservation?.totalPrice ?? d.totalPrice,
        manualTotalPrice: false,
      }));
      return;
    }
    const min = this.partySizeMinForTable(tableId);
    const max = this.partySizeMaxForTable(tableId);
    const groupSize = Math.max(min, Math.min(max, draft.groupSize));
    const suggested = this.suggestedModificationTotalPrice(tableId, groupSize);
    this.modificationDraft.update(() => ({
      tableId,
      groupSize,
      totalPrice: suggested,
      manualTotalPrice: false,
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
      const groupSize = Math.max(min, Math.min(max, Math.round(parsed)));
      const suggested = this.suggestedModificationTotalPrice(draft.tableId, groupSize);
      return {
        ...draft,
        groupSize,
        totalPrice: draft.manualTotalPrice ? draft.totalPrice : suggested,
      };
    });
  }

  setModificationTotalPrice(value: string): void {
    const parsed = Math.round(Number(value));
    if (!Number.isFinite(parsed)) {
      return;
    }
    this.modificationDraft.update((draft) => ({
      ...draft,
      totalPrice: Math.max(0, parsed),
      manualTotalPrice: true,
    }));
  }

  confirmMoveTable(): void {
    const reservation = this.activeReservation();
    const nextTableId = this.modificationDraft().tableId;
    if (!reservation || !nextTableId) {
      return;
    }
    const event = this.activeEvent();
    if (!event) {
      return;
    }
    if (!this.isPartySizeCompatible(nextTableId, reservation.groupSize)) {
      return;
    }
    if (
      nextTableId !== reservation.tableId &&
      this.resolveCellStatus(event.id, reservation.sessionId, nextTableId) !== 'available'
    ) {
      return;
    }
    this.patchReservation(reservation.id, (r) => ({
      ...r,
      tableId: nextTableId,
      audit: this.appendAudit(r.audit, `Moved table → ${nextTableId}`),
    }));
    this.sidePanelMode.set('details');
  }

  confirmBookingModification(): void {
    const reservation = this.activeReservation();
    const next = this.modificationDraft();
    if (!reservation) {
      return;
    }
    const table = this.tables().find((asset) => asset.id === next.tableId);
    if (!table || !this.canConfirmBookingModification()) {
      return;
    }
    const maxGroupSize = this.partySizeMaxForTable(next.tableId);
    const minGroupSize = this.partySizeMinForTable(next.tableId);
    const groupSize = Math.max(minGroupSize, Math.min(maxGroupSize, next.groupSize));
    const nextPrice = Math.max(0, Math.round(next.totalPrice));
    this.patchReservation(reservation.id, (r) => ({
      ...r,
      tableId: next.tableId,
      groupSize,
      totalPrice: nextPrice,
      depositTarget: Math.max(r.depositTarget, this.sumPayments(r)),
      audit: this.appendAudit(r.audit, `Modified booking: table & pax (${groupSize})`),
    }));
    this.sidePanelMode.set('details');
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
    return this.tables().find((asset) => asset.id === tableId) ?? null;
  }

  formatPrice(value: number): string {
    return (
      new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value) + ' €'
    );
  }

  canConfirmReservation(): boolean {
    const draft = this.reservationDraft();
    const min = this.partySizeMinForTable(draft.tableId);
    const max = this.partySizeMaxForTable(draft.tableId);
    return Boolean(draft.guestName.trim()) && draft.groupSize >= min && draft.groupSize <= max;
  }

  canConfirmMoveTable(): boolean {
    const reservation = this.activeReservation();
    const nextTableId = this.modificationDraft().tableId;
    const event = this.activeEvent();
    if (!reservation || !nextTableId || !event) {
      return false;
    }
    if (!this.isPartySizeCompatible(nextTableId, reservation.groupSize)) {
      return false;
    }
    if (nextTableId === reservation.tableId) {
      return true;
    }
    return this.resolveCellStatus(event.id, reservation.sessionId, nextTableId) === 'available';
  }

  canConfirmBookingModification(): boolean {
    const reservation = this.activeReservation();
    const next = this.modificationDraft();
    const event = this.activeEvent();
    if (!reservation || !next.tableId || !event) {
      return false;
    }
    if (!this.isPartySizeCompatible(next.tableId, next.groupSize)) {
      return false;
    }
    if (!Number.isFinite(next.totalPrice) || next.totalPrice < 0) {
      return false;
    }
    if (next.tableId !== reservation.tableId) {
      return this.resolveCellStatus(event.id, reservation.sessionId, next.tableId) === 'available';
    }
    return true;
  }

  suggestedModificationTotalPrice(tableId: string, groupSize: number): number {
    const table = this.tables().find((asset) => asset.id === tableId);
    if (!table) {
      return 0;
    }
    return table.basePrice + Math.max(0, groupSize - table.maxPax) * VARIABLE_PER_GUEST;
  }

  isBookedSidePanelMode(): boolean {
    const mode = this.sidePanelMode();
    return (
      mode === 'reserved' ||
      mode === 'reserved-move' ||
      mode === 'details' ||
      mode === 'move' ||
      mode === 'modify'
    );
  }

  isBookedDetailsMode(): boolean {
    const mode = this.sidePanelMode();
    return mode === 'reserved' || mode === 'reserved-move' || mode === 'details';
  }

  orderIdLine(reservation: Reservation): string {
    const id = reservation.orderDisplayId ?? reservation.id.replace(/^b-/, '');
    return `Order ID - ${id}`;
  }

  timeRangeForReservation(reservation: Reservation): string {
    return reservation.timeRangeLabel ?? '10:00 AM - 8:00 PM (10h)';
  }

  sumPayments(r: Reservation): number {
    return r.payments.reduce((s, p) => s + p.amount, 0);
  }

  outstanding(r: Reservation): number {
    return Math.max(0, r.totalPrice - this.sumPayments(r));
  }

  isFullyPaid(r: Reservation): boolean {
    return this.outstanding(r) <= 0.01;
  }

  assignmentLine(r: Reservation): string {
    if (!r.tableId) {
      return 'Unassigned';
    }
    return this.tableById(r.tableId)?.name ?? r.tableId;
  }

  depositOutstanding(r: Reservation): number {
    const paid = this.sumPayments(r);
    return Math.max(0, r.depositTarget - paid);
  }

  upfrontPaymentRequests(r: Reservation): UpfrontPaymentRequest[] {
    return r.upfrontPaymentRequests ?? [];
  }

  setDepositTarget(reservationId: string, value: string): void {
    const parsed = Math.round(Number(value));
    if (!Number.isFinite(parsed)) {
      return;
    }
    this.patchReservation(reservationId, (r) => {
      const next = Math.max(0, parsed);
      if (next === r.depositTarget) {
        return r;
      }
      return {
        ...r,
        depositTarget: next,
        audit: this.appendAudit(r.audit, `Deposit target set → ${this.formatPrice(next)}`),
      };
    });
  }

  requestAdditionalUpfrontPayment(reservationId: string): boolean {
    const draft = this.upfrontRequestDraft();
    const amount = Math.round(Number(draft.amount));
    if (!Number.isFinite(amount) || amount <= 0) {
      return false;
    }
    const note = draft.note.trim();
    this.patchReservation(reservationId, (r) => {
      const request: UpfrontPaymentRequest = {
        id: uid('upr'),
        amount,
        note,
        requestedAtIso: nowIso(),
        status: 'requested',
      };
      const current = r.upfrontPaymentRequests ?? [];
      return {
        ...r,
        depositTarget: r.depositTarget + amount,
        upfrontPaymentRequests: [...current, request],
        audit: this.appendAudit(
          r.audit,
          `Upfront payment request +${this.formatPrice(amount)}${note ? ` (${note})` : ''}`,
        ),
      };
    });
    this.upfrontRequestDraft.set({ amount: '', note: '' });
    return true;
  }

  secureAttendance(reservationId: string): void {
    this.patchReservation(reservationId, (r) => ({
      ...r,
      lifecycleStatus: r.lifecycleStatus === 'accepted' ? r.lifecycleStatus : 'accepted',
      audit: this.appendAudit(r.audit, 'Attendance secured after upfront payment review'),
    }));
  }

  lifecycleLabel(status: ReservationLifecycleStatus): string {
    const map: Record<ReservationLifecycleStatus, string> = {
      pending: 'Pending',
      to_review: 'To review',
      accepted: 'Accepted',
      cancelled_by_client: 'Cancelled by client',
      canceled: 'Canceled',
      not_completed: 'Not completed',
      arrival: 'Arrival',
      seated: 'Seated',
      charged: 'Charged',
      released: 'Released',
      no_show: 'No-show',
    };
    return map[status];
  }

  /**
   * Calendar / floor status text — uses reservation lifecycle dropdown labels everywhere there is a booking.
   * Hold-only slots use `to_review` so wording matches the dropdown without duplicating `pending` in the legend.
   */
  calendarSlotStatusLabel(status: CellInventoryStatus, reservation: Reservation | null): string {
    if (reservation) {
      return this.lifecycleLabel(reservation.lifecycleStatus);
    }
    if (status === 'booked') {
      return this.lifecycleLabel('accepted');
    }
    if (status === 'blocked') {
      return 'Blocked';
    }
    if (status === 'reserved') {
      return this.lifecycleLabel('to_review');
    }
    return 'Available';
  }

  calendarFilteredSlotTitle(eventId: string, sessionId: string, tableId: string, status: CellInventoryStatus): string {
    const res = this.resolveReservationOnCell(eventId, sessionId, tableId);
    return `Filtered out — ${this.calendarSlotStatusLabel(status, res)}`;
  }

  calendarFilteredSlotText(eventId: string, sessionId: string, tableId: string, status: CellInventoryStatus): string {
    const res = this.resolveReservationOnCell(eventId, sessionId, tableId);
    return this.calendarSlotStatusLabel(status, res);
  }

  paymentTag(reservation: Reservation): string {
    const o = this.outstanding(reservation);
    const paid = this.sumPayments(reservation);
    if (paid <= 0) {
      return 'Not paid';
    }
    if (o <= 0.01) {
      return 'Paid';
    }
    return 'Partial payment';
  }

  confirmAssignment(): void {
    const reservation = this.activeReservation();
    if (!reservation || reservation.lifecycleStatus !== 'pending') {
      return;
    }
    this.patchReservation(reservation.id, (r) => ({
      ...r,
      lifecycleStatus: 'accepted',
      audit: this.appendAudit(r.audit, 'Assignment confirmed'),
    }));
    this.sidePanelMode.set('details');
  }

  saveReservationConfiguration(reservationId: string): void {
    this.patchReservation(reservationId, (r) => ({
      ...r,
      audit: this.appendAudit(r.audit, 'Reservation configuration saved'),
    }));
  }

  setLifecycleStatus(id: string, status: ReservationLifecycleStatus): void {
    this.patchReservation(id, (r) => ({
      ...r,
      lifecycleStatus: status,
      audit: this.appendAudit(r.audit, `Status → ${this.lifecycleLabel(status)}`),
    }));
  }

  updateNotes(id: string, internalNotes: string, customerNotes: string): void {
    this.patchReservation(id, (r) => ({
      ...r,
      internalNotes,
      customerNotes,
      audit: this.appendAudit(r.audit, 'Notes updated'),
    }));
  }

  updateCustomer(id: string, guestName: string, phone: string, email: string): void {
    this.patchReservation(id, (r) => ({
      ...r,
      guestName: guestName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      audit: this.appendAudit(r.audit, 'Customer details updated'),
    }));
  }

  assignReservationToTable(reservationId: string, tableId: string | null): void {
    const event = this.activeEvent();
    const res = this.reservations().find((r) => r.id === reservationId);
    if (!res || !event) {
      return;
    }
    if (tableId && !this.isPartySizeCompatible(tableId, res.groupSize)) {
      return;
    }
    if (
      tableId &&
      this.resolveCellStatus(event.id, res.sessionId, tableId) !== 'available' &&
      !(res.tableId === tableId)
    ) {
      return;
    }
    this.patchReservation(reservationId, (r) => ({
      ...r,
      tableId,
      audit: this.appendAudit(r.audit, tableId ? `Assigned table ${tableId}` : 'Unassigned table'),
    }));
  }

  unassignReservation(reservationId: string): void {
    this.assignReservationToTable(reservationId, null);
  }

  addPaymentFromDraft(reservationId: string): void {
    const draft = this.paymentDraft();
    const amount = Number(draft.amount.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }
    const entry: PaymentEntry = {
      id: uid('pay'),
      method: draft.method,
      amount,
      atIso: nowIso(),
      addedBy: draft.addedBy || 'Operator',
    };
    this.patchReservation(reservationId, (r) => ({
      ...r,
      payments: [...r.payments, entry],
      audit: this.appendAudit(r.audit, `Payment recorded ${this.formatPrice(amount)} (${entry.method})`),
    }));
    this.paymentDraft.set({ ...draft, amount: '' });
  }

  removePayment(reservationId: string, paymentId: string): void {
    this.patchReservation(reservationId, (r) => ({
      ...r,
      payments: r.payments.filter((p) => p.id !== paymentId),
      audit: this.appendAudit(r.audit, `Payment removed (${paymentId})`),
    }));
  }

  checkInOneTap(reservationId: string): void {
    this.patchReservation(reservationId, (r) => {
      const nextCount = r.groupSize;
      return {
        ...r,
        lifecycleStatus: 'arrival',
        checkedInCount: nextCount,
        checkInAtIso: r.checkInAtIso ?? nowIso(),
        audit: this.appendAudit(r.audit, `Check-in: ${nextCount}/${r.groupSize} guests`),
      };
    });
  }

  adjustCheckedIn(reservationId: string, delta: number): void {
    this.patchReservation(reservationId, (r) => {
      const next = Math.max(0, Math.min(r.groupSize, r.checkedInCount + delta));
      return {
        ...r,
        checkedInCount: next,
        audit: this.appendAudit(r.audit, `Attendance adjusted → ${next}/${r.groupSize}`),
      };
    });
  }

  setCheckedInCount(reservationId: string, value: string): void {
    const parsed = Math.round(Number(value));
    if (!Number.isFinite(parsed)) {
      return;
    }
    this.patchReservation(reservationId, (r) => {
      const next = Math.max(0, Math.min(r.groupSize, parsed));
      if (next === r.checkedInCount) {
        return r;
      }
      return {
        ...r,
        checkedInCount: next,
        checkInAtIso: next > 0 ? (r.checkInAtIso ?? nowIso()) : r.checkInAtIso,
        audit: this.appendAudit(r.audit, `Attendance set → ${next}/${r.groupSize}`),
      };
    });
  }

  linkRfidMock(reservationId: string, delta: number): void {
    this.patchReservation(reservationId, (r) => {
      const next = Math.max(0, Math.min(r.groupSize, r.rfidLinkedCount + delta));
      return {
        ...r,
        rfidLinkedCount: next,
        audit: this.appendAudit(r.audit, `RFID linked (mock) → ${next}`),
      };
    });
  }

  markNoShow(reservationId: string, releaseTable: boolean): void {
    this.patchReservation(reservationId, (r) => {
      let tableId = r.tableId;
      if (releaseTable) {
        tableId = null;
      }
      return {
        ...r,
        lifecycleStatus: 'no_show',
        tableId,
        checkOutAtIso: nowIso(),
        audit: this.appendAudit(r.audit, `No-show marked${releaseTable ? '; table released' : ''}`),
      };
    });
  }

  addGuests(reservationId: string, delta: number): void {
    this.patchReservation(reservationId, (r) => ({
      ...r,
      groupSize: Math.max(1, r.groupSize + delta),
      audit: this.appendAudit(r.audit, `Group size Δ ${delta >= 0 ? '+' : ''}${delta}`),
    }));
  }

  toggleTableLock(tableId: string): void {
    this.tables.update((rows) =>
      rows.map((t) => (t.id === tableId ? { ...t, locked: !t.locked } : t)),
    );
  }

  toggleTableHide(tableId: string): void {
    this.tables.update((rows) =>
      rows.map((t) => (t.id === tableId ? { ...t, hidden: !t.hidden } : t)),
    );
  }

  openPosTab(reservationId: string): void {
    const session: PosSession = {
      id: uid('pos'),
      openedAtIso: nowIso(),
      lines: [],
      total: 0,
      delayed: false,
    };
    this.patchReservation(reservationId, (r) => ({
      ...r,
      lifecycleStatus: r.lifecycleStatus === 'accepted' ? 'charged' : r.lifecycleStatus,
      pos: session,
      audit: this.appendAudit(r.audit, `POS tab opened (mock) ${session.id}`),
    }));
  }

  simulatePosBill(reservationId: string): void {
    const lines: PosBillLine[] = [
      { label: 'Vodka magnum', qty: 2, amount: 890 },
      { label: 'Mixers', qty: 6, amount: 120 },
      { label: 'Water', qty: 4, amount: 60 },
    ];
    const total = lines.reduce((s, l) => s + l.amount, 0);
    this.patchReservation(reservationId, (r) => ({
      ...r,
      pos: r.pos
        ? {
            ...r.pos,
            lines,
            total,
            delayed: false,
          }
        : {
            id: uid('pos'),
            openedAtIso: nowIso(),
            lines,
            total,
            delayed: false,
          },
      audit: this.appendAudit(r.audit, 'POS bill received (mock)'),
    }));
  }

  setPosDelayed(reservationId: string, delayed: boolean): void {
    this.patchReservation(reservationId, (r) =>
      r.pos
        ? {
            ...r,
            pos: { ...r.pos, delayed },
            audit: this.appendAudit(r.audit, delayed ? 'POS marked delayed' : 'POS delay cleared'),
          }
        : r,
    );
  }

  highlightReservation(r: Reservation): boolean {
    const unassigned = !r.tableId && !this.isTerminalLifecycle(r.lifecycleStatus);
    const unpaid = this.outstanding(r) > 0.01 && !['cancelled_by_client', 'canceled', 'released', 'no_show'].includes(r.lifecycleStatus);
    const posIssue = Boolean(r.pos?.delayed);
    const late =
      ['pending', 'to_review', 'accepted'].includes(r.lifecycleStatus) &&
      new Date().getHours() >= 22;
    return unassigned || unpaid || posIssue || late;
  }

  /**
   * Reservations tab grouping: yellow = lifecycle pending / to review; red = partial check-in; green = rest (free / clear).
   */
  reservationBookingsMenuBucket(r: Reservation): 'pending' | 'partial' | 'free' {
    if (r.lifecycleStatus === 'pending' || r.lifecycleStatus === 'to_review') {
      return 'pending';
    }
    if (r.tableId && r.checkedInCount > 0 && r.checkedInCount < r.groupSize) {
      return 'partial';
    }
    return 'free';
  }

  bookingsAttendanceGroups(rows: Reservation[]): Array<{
    key: 'pending' | 'partial' | 'free';
    label: string;
    reservations: Reservation[];
  }> {
    const pending = rows.filter((r) => this.reservationBookingsMenuBucket(r) === 'pending');
    const partial = rows.filter((r) => this.reservationBookingsMenuBucket(r) === 'partial');
    const free = rows.filter((r) => this.reservationBookingsMenuBucket(r) === 'free');
    const byGuest = (a: Reservation, b: Reservation) => a.guestName.localeCompare(b.guestName);
    pending.sort(byGuest);
    partial.sort(byGuest);
    free.sort(byGuest);
    const groups: Array<{ key: 'pending' | 'partial' | 'free'; label: string; reservations: Reservation[] }> = [];
    if (free.length) {
      groups.push({ key: 'free', label: 'Free', reservations: free });
    }
    if (pending.length) {
      groups.push({ key: 'pending', label: 'Pending', reservations: pending });
    }
    if (partial.length) {
      groups.push({ key: 'partial', label: 'Occupied somewhat', reservations: partial });
    }
    return groups;
  }

  setBookingStatusFilter(v: ReservationLifecycleStatus | 'all'): void {
    this.bookingStatusFilter.set(v);
  }

  setBookingQuery(q: string): void {
    this.bookingQuery.set(q);
  }

  setDoorQuery(q: string): void {
    this.doorQuery.set(q);
  }

  reservedSlotForCell(eventId: string, sessionId: string, tableId: string): ReservedSlotInfo | null {
    return this.reservedSlots()[this.cellKey(eventId, sessionId, tableId)] ?? null;
  }

  reservedGuestLabelForCell(eventId: string, sessionId: string, tableId: string): string {
    return this.reservedSlotForCell(eventId, sessionId, tableId)?.guestName ?? 'Reserved booking';
  }

  reservedGroupSizeForCell(eventId: string, sessionId: string, tableId: string): number {
    return this.reservedSlotForCell(eventId, sessionId, tableId)?.groupSize ?? 0;
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
    return (
      cell.table.basePrice + Math.max(0, reserved.groupSize - cell.table.maxPax) * VARIABLE_PER_GUEST
    );
  }

  reserveAssignmentStatusForActiveCell(): 'pending_confirmation' | 'confirmed' {
    return this.reservedSlotForActiveCell()?.assignmentStatus ?? 'pending_confirmation';
  }

  reserveAssignmentStatusLabel(status: 'pending_confirmation' | 'confirmed'): string {
    return status === 'pending_confirmation' ? 'Table pending confirmation' : 'Table confirmed';
  }

  reserveAssignmentIsPending(status: 'pending_confirmation' | 'confirmed'): boolean {
    return status === 'pending_confirmation';
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

  private cellKey(eventId: string, sessionId: string, tableId: string): string {
    return `${eventId}|${sessionId}|${tableId}`;
  }

  private avgCapacity(tables: TableAsset[]): number {
    if (tables.length === 0) {
      return 0;
    }
    const total = tables.reduce((sum, table) => sum + table.maxPax, 0);
    return total / tables.length;
  }

  private avgBasePrice(tables: TableAsset[]): number {
    if (tables.length === 0) {
      return 0;
    }
    const total = tables.reduce((sum, table) => sum + table.basePrice, 0);
    return total / tables.length;
  }

  private isTerminalLifecycle(s: ReservationLifecycleStatus): boolean {
    return ['released', 'no_show', 'cancelled_by_client', 'canceled'].includes(s);
  }

  private patchReservation(id: string, fn: (r: Reservation) => Reservation): void {
    this.reservations.update((rows) => rows.map((r) => (r.id === id ? fn(r) : r)));
  }

  private appendAudit(entries: AuditEntry[], message: string, actor = 'Operator'): AuditEntry[] {
    return [...entries, { id: uid('aud'), atIso: nowIso(), actor, message }];
  }
}
