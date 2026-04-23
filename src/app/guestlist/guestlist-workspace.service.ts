import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { GUESTLIST_CATALOG } from './guestlist-catalog';
import { GuestlistSummariesService } from './guestlist-summaries.service';

export type GuestlistVisibility = 'public' | 'hidden';

export type GenderRestriction = 'none' | 'women' | 'men';

export interface GuestlistCondition {
  id: string;
  label: string;
  price: number;
  windowStart: string;
  windowEnd: string;
  minAge: number | null;
  genderRestriction: GenderRestriction;
  includes: string;
  additionalInfo: string;
}

export interface AttendeeFieldToggle {
  id: string;
  label: string;
  required: boolean;
}

export interface GuestlistConfig {
  id: string;
  name: string;
  listColor: string;
  visibility: GuestlistVisibility;
  description: string;
  opensAt: string;
  deadlineAt: string;
  maxCapacity: number | null;
  internalChannelEnabled: boolean;
  guestEmailConfirmationEnabled: boolean;
  notificationLanguage: string;
  enableRsvpRequests: boolean;
  condition: GuestlistCondition;
  attendeeFields: AttendeeFieldToggle[];
  prAssignees: string[];
  /**
   * Max tickets each PR (Fever Zone user id) may sell on this guestlist.
   * Omitted id = unlimited.
   */
  prTicketLimits: Record<string, number>;
  published: boolean;
}

export interface PrCatalogEntry {
  id: string;
  label: string;
}

const LS_KEY = 'fz-guestlist-workspace-v1';

const DEMO_EVENT = 'Nightclub event — August (recurring)';

const LIST_COLOR_HEX = /^#[0-9a-fA-F]{6}$/;
export const DEFAULT_LIST_COLOR = '#8a1343';

function sanitizeListColorHex(raw: string, fallback: string): string {
  const s = String(raw ?? '').trim();
  return LIST_COLOR_HEX.test(s) ? s.toLowerCase() : fallback;
}

function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function defaultAttendeeFields(): AttendeeFieldToggle[] {
  return [
    { id: 'name', label: 'Full name', required: true },
    { id: 'email', label: 'Email', required: true },
    { id: 'phone', label: 'Phone', required: false },
    { id: 'dob', label: 'Date of birth', required: false },
    { id: 'gender', label: 'Gender', required: false },
  ];
}

function defaultCondition(): GuestlistCondition {
  return {
    id: newId('cond'),
    label: 'Standard window',
    price: 0,
    windowStart: '22:00',
    windowEnd: '03:00',
    minAge: null,
    genderRestriction: 'none',
    includes: '',
    additionalInfo: '',
  };
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object';
}

function normalizePrTicketLimits(raw: unknown): Record<string, number> {
  if (!isRecord(raw)) {
    return {};
  }
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    const n = typeof v === 'number' ? v : Number(v);
    if (typeof k === 'string' && Number.isFinite(n) && n >= 0) {
      out[k] = Math.floor(n);
    }
  }
  return out;
}

function normalizeCondition(raw: unknown, fallback: GuestlistCondition): GuestlistCondition {
  if (!isRecord(raw)) {
    return { ...fallback };
  }
  const gender = raw['genderRestriction'];
  const genderRestriction: GenderRestriction =
    gender === 'women' || gender === 'men' ? gender : 'none';
  const minRaw = raw['minAge'];
  let minAge: number | null = fallback.minAge;
  if (minRaw === null || minRaw === undefined || minRaw === '') {
    minAge = null;
  } else if (typeof minRaw === 'number' && Number.isFinite(minRaw)) {
    minAge = Math.max(0, Math.floor(minRaw));
  }
  return {
    id: typeof raw['id'] === 'string' ? raw['id'] : fallback.id,
    label: typeof raw['label'] === 'string' ? raw['label'] : fallback.label,
    price: typeof raw['price'] === 'number' && Number.isFinite(raw['price']) ? Math.max(0, raw['price']) : fallback.price,
    windowStart: typeof raw['windowStart'] === 'string' ? raw['windowStart'] : fallback.windowStart,
    windowEnd: typeof raw['windowEnd'] === 'string' ? raw['windowEnd'] : fallback.windowEnd,
    minAge,
    genderRestriction,
    includes: typeof raw['includes'] === 'string' ? raw['includes'] : fallback.includes,
    additionalInfo: typeof raw['additionalInfo'] === 'string' ? raw['additionalInfo'] : fallback.additionalInfo,
  };
}

function normalizeAttendeeFields(raw: unknown): AttendeeFieldToggle[] | null {
  if (!Array.isArray(raw)) {
    return null;
  }
  const out: AttendeeFieldToggle[] = [];
  for (const row of raw) {
    if (!isRecord(row)) {
      continue;
    }
    if (typeof row['id'] !== 'string' || typeof row['label'] !== 'string') {
      continue;
    }
    out.push({
      id: row['id'],
      label: row['label'],
      required: Boolean(row['required']),
    });
  }
  return out.length ? out : null;
}

function normalizeGuestlist(row: unknown, seedMatch: GuestlistConfig | undefined): GuestlistConfig | null {
  if (!isRecord(row) || typeof row['id'] !== 'string' || typeof row['name'] !== 'string') {
    return null;
  }
  const base = seedMatch ?? {
    id: row['id'],
    name: row['name'],
    listColor: DEFAULT_LIST_COLOR,
    visibility: 'hidden' as const,
    description: '',
    opensAt: '2026-08-01T12:00',
    deadlineAt: '2026-08-10T23:59',
    maxCapacity: null,
    internalChannelEnabled: true,
    guestEmailConfirmationEnabled: true,
    notificationLanguage: 'en',
    enableRsvpRequests: false,
    condition: defaultCondition(),
    attendeeFields: defaultAttendeeFields(),
    prAssignees: [] as string[],
    prTicketLimits: {} as Record<string, number>,
    published: false,
  };
  const vis = row['visibility'];
  const visibility: GuestlistVisibility = vis === 'public' ? 'public' : 'hidden';
  const listColor = sanitizeListColorHex(String(row['listColor'] ?? ''), base.listColor);
  const attendeeFields = normalizeAttendeeFields(row['attendeeFields']) ?? base.attendeeFields;
  const prAssignees = Array.isArray(row['prAssignees'])
    ? row['prAssignees'].filter((x): x is string => typeof x === 'string')
    : base.prAssignees;
  return {
    ...base,
    name: row['name'],
    listColor,
    visibility,
    description: typeof row['description'] === 'string' ? row['description'] : base.description,
    opensAt: typeof row['opensAt'] === 'string' ? row['opensAt'] : base.opensAt,
    deadlineAt: typeof row['deadlineAt'] === 'string' ? row['deadlineAt'] : base.deadlineAt,
    maxCapacity: (() => {
      const mc = row['maxCapacity'];
      if (mc === null || mc === undefined || mc === '') {
        return null;
      }
      const n = Number(mc);
      if (!Number.isFinite(n)) {
        return base.maxCapacity;
      }
      return Math.max(0, Math.floor(n));
    })(),
    internalChannelEnabled: Boolean(row['internalChannelEnabled']),
    guestEmailConfirmationEnabled: Boolean(row['guestEmailConfirmationEnabled']),
    notificationLanguage:
      typeof row['notificationLanguage'] === 'string' ? row['notificationLanguage'] : base.notificationLanguage,
    enableRsvpRequests: Boolean(row['enableRsvpRequests']),
    condition: normalizeCondition(row['condition'], base.condition),
    attendeeFields,
    prAssignees,
    prTicketLimits: normalizePrTicketLimits(row['prTicketLimits']),
    published: Boolean(row['published']),
  };
}

function loadFromStorage(): GuestlistConfig[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return null;
    }
    const seeds = seedGuestlists();
    const normalized: GuestlistConfig[] = [];
    for (const row of parsed) {
      const id = isRecord(row) && typeof row['id'] === 'string' ? row['id'] : '';
      const seedMatch = seeds.find((s) => s.id === id);
      const g = normalizeGuestlist(row, seedMatch);
      if (g) {
        normalized.push(g);
      }
    }
    return normalized.length ? normalized : null;
  } catch {
    return null;
  }
}

function seedGuestlists(): GuestlistConfig[] {
  return [
    {
      id: GUESTLIST_CATALOG[0].id,
      name: GUESTLIST_CATALOG[0].name,
      listColor: '#8a1343',
      visibility: 'hidden',
      description: 'PR-managed VIP access for artists and partners.',
      opensAt: '2026-08-01T18:00',
      deadlineAt: '2026-08-07T23:59',
      maxCapacity: 120,
      internalChannelEnabled: true,
      guestEmailConfirmationEnabled: true,
      notificationLanguage: 'en',
      enableRsvpRequests: false,
      condition: {
        id: 'c1',
        label: 'Standard window',
        price: 0,
        windowStart: '22:00',
        windowEnd: '03:00',
        minAge: 18,
        genderRestriction: 'none',
        includes: '1 welcome drink, backstage access',
        additionalInfo: 'Dress code: smart casual',
      },
      attendeeFields: defaultAttendeeFields(),
      prAssignees: ['u-nadia', 'u-vip-team'],
      prTicketLimits: { 'u-nadia': 40, 'u-vip-team': 25 },
      published: true,
    },
    {
      id: GUESTLIST_CATALOG[1].id,
      name: GUESTLIST_CATALOG[1].name,
      listColor: '#0079ca',
      visibility: 'public',
      description: 'Local promoters and industry — internal adds only (Phase 1).',
      opensAt: '2026-08-02T12:00',
      deadlineAt: '2026-08-06T20:00',
      maxCapacity: 200,
      internalChannelEnabled: true,
      guestEmailConfirmationEnabled: false,
      notificationLanguage: 'es',
      enableRsvpRequests: true,
      condition: {
        id: 'c3',
        label: 'Main floor',
        price: 0,
        windowStart: '23:00',
        windowEnd: '04:00',
        minAge: null,
        genderRestriction: 'none',
        includes: 'Industry wristband',
        additionalInfo: 'Valid ID required at door',
      },
      attendeeFields: defaultAttendeeFields(),
      prAssignees: ['u-davide'],
      prTicketLimits: { 'u-davide': 80 },
      published: false,
    },
  ];
}

@Injectable({ providedIn: 'root' })
export class GuestlistWorkspaceService {
  private readonly summariesService = inject(GuestlistSummariesService);

  readonly prCatalog: PrCatalogEntry[] = [
    { id: 'u-nadia', label: 'Nadia Ruiz — nadia.ruiz@example.com' },
    { id: 'u-vip-team', label: 'PR team VIP — pr-team-vip@venue.com' },
    { id: 'u-davide', label: 'Davide Lovison — davide.lovison@feverup.com' },
    { id: 'u-marta', label: 'Marta Fernandez — marta@example.com' },
    { id: 'u-box', label: 'Box office — box@venue.com' },
    { id: 'u-door', label: 'Door lead — door@venue.com' },
  ];

  readonly eventLabel = DEMO_EVENT;

  readonly listColorPresets: ReadonlyArray<{ readonly hex: string; readonly label: string }> = [
    { hex: '#8a1343', label: 'Burgundy' },
    { hex: '#0079ca', label: 'Blue' },
    { hex: '#24a865', label: 'Green' },
    { hex: '#6f41d7', label: 'Purple' },
    { hex: '#eb0052', label: 'Magenta' },
    { hex: '#c27b00', label: 'Amber' },
    { hex: '#031419', label: 'Charcoal' },
  ];

  readonly notificationLanguageOptions: ReadonlyArray<{ readonly value: string; readonly label: string }> = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'it', label: 'Italian' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'ca', label: 'Catalan' },
  ];

  readonly guestlists = signal<GuestlistConfig[]>(loadFromStorage() ?? seedGuestlists());
  readonly selectedId = signal<string>(this.guestlists()[0]?.id ?? '');
  readonly persistMessage = signal<string | null>(null);

  readonly selectedGuestlist = computed(() => {
    const id = this.selectedId();
    return this.guestlists().find((g) => g.id === id) ?? null;
  });

  constructor() {
    effect(() => {
      const rows = this.guestlists().map((g) => ({
        id: g.id,
        name: g.name,
        listColor: g.listColor,
      }));
      this.summariesService.setSummaries(rows);
    });
    effect(() => {
      const data = this.guestlists();
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(data));
      } catch {
        /* ignore quota */
      }
    });
  }

  selectGuestlist(id: string): void {
    this.selectedId.set(id);
  }

  addGuestlist(): void {
    const id = newId('gl');
    const next: GuestlistConfig = {
      id,
      name: 'New guestlist',
      listColor: DEFAULT_LIST_COLOR,
      visibility: 'hidden',
      description: '',
      opensAt: '2026-08-01T12:00',
      deadlineAt: '2026-08-10T23:59',
      maxCapacity: null,
      internalChannelEnabled: true,
      guestEmailConfirmationEnabled: true,
      notificationLanguage: 'en',
      enableRsvpRequests: false,
      condition: defaultCondition(),
      attendeeFields: defaultAttendeeFields(),
      prAssignees: [],
      prTicketLimits: {},
      published: false,
    };
    this.guestlists.update((rows) => [...rows, next]);
    this.selectedId.set(id);
    this.flash('Added a new guestlist draft.');
  }

  removeGuestlist(id: string): void {
    this.guestlists.update((rows) => rows.filter((g) => g.id !== id));
    if (this.selectedId() === id) {
      this.selectedId.set(this.guestlists()[0]?.id ?? '');
    }
    this.flash('Guestlist removed.');
  }

  patchSelected(partial: Partial<GuestlistConfig>): void {
    const id = this.selectedId();
    this.guestlists.update((rows) => rows.map((g) => (g.id === id ? { ...g, ...partial } : g)));
  }

  patchSelectedNested<K extends keyof GuestlistConfig>(key: K, value: GuestlistConfig[K]): void {
    const id = this.selectedId();
    this.guestlists.update((rows) => rows.map((g) => (g.id === id ? { ...g, [key]: value } : g)));
  }

  setName(value: string): void {
    this.patchSelected({ name: value });
  }

  setListColor(value: string): void {
    const g = this.selectedGuestlist();
    const fallback = g?.listColor ?? DEFAULT_LIST_COLOR;
    this.patchSelected({ listColor: sanitizeListColorHex(value, fallback) });
  }

  isPresetListColor(hex: string): boolean {
    const h = hex.trim().toLowerCase();
    return this.listColorPresets.some((p) => p.hex.toLowerCase() === h);
  }

  setDescription(value: string): void {
    this.patchSelected({ description: value });
  }

  setVisibility(value: GuestlistVisibility): void {
    this.patchSelected({ visibility: value });
  }

  setOpensAt(value: string): void {
    this.patchSelected({ opensAt: value });
  }

  setDeadlineAt(value: string): void {
    this.patchSelected({ deadlineAt: value });
  }

  setMaxCapacity(value: string): void {
    const trimmed = value.trim();
    this.patchSelected({ maxCapacity: trimmed === '' ? null : Math.max(0, Number(trimmed) || 0) });
  }

  prAssignTriggerLabel(gl: GuestlistConfig): string {
    if (!gl.prAssignees.length) {
      return 'Select PR assignees…';
    }
    if (gl.prAssignees.length === 1) {
      return this.prShortLabel(gl.prAssignees[0]);
    }
    return `${gl.prAssignees.length} assignees selected`;
  }

  prShortLabel(id: string): string {
    const row = this.prCatalog.find((p) => p.id === id);
    if (!row) {
      return id;
    }
    const dash = row.label.indexOf(' —');
    return dash === -1 ? row.label : row.label.slice(0, dash);
  }

  /**
   * Limits tab: only PRs assigned to this guestlist (catalog order), then assignee ids not in the catalog.
   */
  assignedPrCatalogRows(gl: GuestlistConfig): PrCatalogEntry[] {
    const assigneeSet = new Set(gl.prAssignees);
    const fromCatalog = this.prCatalog.filter((p) => assigneeSet.has(p.id));
    const catalogIds = new Set(this.prCatalog.map((p) => p.id));
    const extras: PrCatalogEntry[] = [];
    for (const id of gl.prAssignees) {
      if (!catalogIds.has(id)) {
        extras.push({ id, label: id });
      }
    }
    return [...fromCatalog, ...extras];
  }

  togglePrAssignee(id: string, checked: boolean): void {
    const g = this.selectedGuestlist();
    if (!g) {
      return;
    }
    const set = new Set(g.prAssignees);
    if (checked) {
      set.add(id);
    } else {
      set.delete(id);
    }
    this.patchSelected({ prAssignees: [...set] });
  }

  toggleInternalChannel(checked: boolean): void {
    this.patchSelected({ internalChannelEnabled: checked });
  }

  toggleGuestEmailConfirmation(checked: boolean): void {
    this.patchSelected({ guestEmailConfirmationEnabled: checked });
  }

  setNotificationLanguage(value: string): void {
    const allowed = new Set(this.notificationLanguageOptions.map((o) => o.value));
    this.patchSelected({
      notificationLanguage: allowed.has(value) ? value : 'en',
    });
  }

  toggleEnableRsvpRequests(checked: boolean): void {
    this.patchSelected({ enableRsvpRequests: checked });
  }

  toggleAttendeeRequired(fieldId: string, required: boolean): void {
    const g = this.selectedGuestlist();
    if (!g) {
      return;
    }
    const attendeeFields = g.attendeeFields.map((f) => (f.id === fieldId ? { ...f, required } : f));
    this.patchSelectedNested('attendeeFields', attendeeFields);
  }

  updateCondition(partial: Partial<GuestlistCondition>): void {
    const g = this.selectedGuestlist();
    if (!g) {
      return;
    }
    this.patchSelected({ condition: { ...g.condition, ...partial } });
  }

  /** Empty or invalid → remove limit (unlimited). */
  setPrTicketLimit(prId: string, raw: string): void {
    const g = this.selectedGuestlist();
    if (!g) {
      return;
    }
    const trimmed = String(raw ?? '').trim();
    const next = { ...g.prTicketLimits };
    if (trimmed === '') {
      delete next[prId];
    } else {
      const n = Math.floor(Number(trimmed));
      if (!Number.isFinite(n) || n < 0) {
        delete next[prId];
      } else {
        next[prId] = n;
      }
    }
    this.patchSelected({ prTicketLimits: next });
  }

  prTicketLimitInputValue(gl: GuestlistConfig, prId: string): string {
    const v = gl.prTicketLimits[prId];
    return v === undefined ? '' : String(v);
  }

  saveConfiguration(): void {
    this.flash('Saved locally (prototype only — not sent to Fever).');
  }

  coercePrice(value: unknown): number {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }

  coerceOptionalMinAge(value: unknown): number | null {
    const s = String(value ?? '').trim();
    if (s === '') {
      return null;
    }
    const n = Math.floor(Number(s));
    if (!Number.isFinite(n) || n < 0) {
      return null;
    }
    return n;
  }

  setConditionGender(value: string): void {
    const v: GenderRestriction = value === 'women' || value === 'men' ? value : 'none';
    this.updateCondition({ genderRestriction: v });
  }

  navEntryWindowSummary(g: GuestlistConfig): string {
    const c = g.condition;
    return `${c.windowStart}–${c.windowEnd}`;
  }

  navGenderSummary(g: GuestlistConfig): string {
    switch (g.condition.genderRestriction) {
      case 'women':
        return 'Women only';
      case 'men':
        return 'Men only';
      default:
        return 'Any gender';
    }
  }

  navMinAgeSummary(g: GuestlistConfig): string {
    const m = g.condition.minAge;
    if (m === null) {
      return 'No min age';
    }
    return `${m}+`;
  }

  /** Sidebar: global guestlist capacity (from Max capacity). */
  navTotalCapacitySummary(g: GuestlistConfig): string {
    const cap = g.maxCapacity;
    if (cap === null) {
      return 'Total capacity: unlimited';
    }
    return `Total capacity: ${cap}`;
  }

  private flash(msg: string): void {
    this.persistMessage.set(msg);
    window.setTimeout(() => this.persistMessage.set(null), 3200);
  }
}
