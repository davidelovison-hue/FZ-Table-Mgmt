export type EventMode = 'one-off' | 'recurring';
export type CalendarView = 'single-day' | 'multi-day';
export type CellInventoryStatus = 'available' | 'reserved' | 'booked' | 'blocked';
export type ZoneKey = 'vip' | 'main-room' | 'terrace';
export type ZoneOrder = 'alphabetical' | 'capacity-high' | 'price-high' | 'price-low';

/** PRD §5.0 — manual transitions; prototype does not enforce a strict graph. */
export type ReservationLifecycleStatus =
  | 'pending'
  | 'to_review'
  | 'accepted'
  | 'cancelled_by_client'
  | 'canceled'
  | 'not_completed'
  | 'arrival'
  | 'seated'
  | 'charged'
  | 'released'
  | 'no_show';

export interface EventSession {
  id: string;
  label: string;
  dateLabel: string;
  datetimeIso: string;
}

export interface EventConfig {
  id: string;
  name: string;
  mode: EventMode;
  sessions: EventSession[];
}

export interface TableAsset {
  id: string;
  name: string;
  zone: ZoneKey;
  zoneLabel: string;
  minPax: number;
  maxPax: number;
  basePrice: number;
  locked: boolean;
  hidden: boolean;
}

export interface PaymentEntry {
  id: string;
  method: string;
  amount: number;
  atIso: string;
  addedBy: string;
}

export interface UpfrontPaymentRequest {
  id: string;
  amount: number;
  note: string;
  requestedAtIso: string;
  status: 'requested' | 'sent';
}

export interface AuditEntry {
  id: string;
  atIso: string;
  actor: string;
  message: string;
}

export interface PosBillLine {
  label: string;
  qty: number;
  amount: number;
}

export interface PosSession {
  id: string;
  openedAtIso: string;
  lines: PosBillLine[];
  total: number;
  delayed: boolean;
}

export interface Reservation {
  id: string;
  orderDisplayId?: string;
  eventId: string;
  sessionId: string;
  tableId: string | null;
  zonePreference?: ZoneKey;
  guestName: string;
  groupSize: number;
  phone: string;
  email: string;
  lifecycleStatus: ReservationLifecycleStatus;
  totalPrice: number;
  depositTarget: number;
  payments: PaymentEntry[];
  upfrontPaymentRequests?: UpfrontPaymentRequest[];
  internalNotes: string;
  customerNotes: string;
  attribution: string;
  bookingFrom: string;
  timeRangeLabel?: string;
  checkedInCount: number;
  rfidLinkedCount: number;
  pos: PosSession | null;
  checkInAtIso: string | null;
  checkOutAtIso: string | null;
  audit: AuditEntry[];
}

export interface ReservedSlotInfo {
  orderRef: string;
  guestName: string;
  email: string;
  groupSize: number;
  assignmentStatus: 'pending_confirmation' | 'confirmed';
}

export interface ZoneGroup {
  key: ZoneKey;
  label: string;
  tables: TableAsset[];
}

export interface CellContext {
  session: EventSession;
  table: TableAsset;
}

export type OpsTab = 'floor' | 'bookings' | 'door' | 'reporting';

export type SidePanelMode =
  | 'closed'
  | 'available'
  | 'create'
  | 'reserved'
  | 'reserved-move'
  | 'blocked'
  | 'details'
  | 'move'
  | 'modify';

export interface ReservationDraft {
  sessionId: string;
  tableId: string;
  guestName: string;
  groupSize: number;
}

export const RESERVATION_STATUS_OPTIONS: ReservationLifecycleStatus[] = [
  'pending',
  'to_review',
  'accepted',
  'cancelled_by_client',
  'canceled',
  'not_completed',
  'arrival',
  'seated',
  'charged',
  'released',
  'no_show',
];
