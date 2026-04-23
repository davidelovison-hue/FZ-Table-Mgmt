import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { GuestlistWorkspaceService } from './guestlist-workspace.service';

export interface GuestEntry {
  id: string;
  guestlistId: string;
  fullName: string;
  email: string;
  phone: string;
  /** Stored select value; empty = not specified. */
  gender: string;
  /** Who referred this guest (PR, promoter, partner, etc.). */
  referrer: string;
  additionalNotes: string;
  createdAt: string;
}

const LS_ENTRIES = 'fz-guestlist-entries-v1';

function normalizeGuestFromStorage(row: unknown): GuestEntry | null {
  if (row === null || typeof row !== 'object') {
    return null;
  }
  const r = row as Record<string, unknown>;
  if (
    typeof r['id'] !== 'string' ||
    typeof r['guestlistId'] !== 'string' ||
    typeof r['fullName'] !== 'string' ||
    typeof r['email'] !== 'string' ||
    typeof r['createdAt'] !== 'string'
  ) {
    return null;
  }
  return {
    id: r['id'],
    guestlistId: r['guestlistId'],
    fullName: r['fullName'],
    email: r['email'],
    phone: typeof r['phone'] === 'string' ? r['phone'] : '',
    gender: typeof r['gender'] === 'string' ? r['gender'] : '',
    referrer: typeof r['referrer'] === 'string' ? r['referrer'] : '',
    additionalNotes: typeof r['additionalNotes'] === 'string' ? r['additionalNotes'] : '',
    createdAt: r['createdAt'],
  };
}

function newEntryId(): string {
  return `ge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadEntries(): GuestEntry[] {
  try {
    const raw = localStorage.getItem(LS_ENTRIES);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map(normalizeGuestFromStorage).filter((e): e is GuestEntry => e !== null);
  } catch {
    return [];
  }
}

@Component({
  selector: 'app-guestlist-guests',
  standalone: true,
  templateUrl: './guestlist-guests.component.html',
  styleUrls: ['./guestlist-guests.component.css', '../guestlist-config/guestlist-config.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestlistGuestsComponent {
  readonly w = inject(GuestlistWorkspaceService);

  /** Optional gender values for the add form (stored on each guest). */
  readonly genderSelectOptions: ReadonlyArray<{ readonly value: string; readonly label: string }> = [
    { value: '', label: 'Not specified' },
    { value: 'female', label: 'Female' },
    { value: 'male', label: 'Male' },
    { value: 'non_binary', label: 'Non-binary' },
    { value: 'prefer_not', label: 'Prefer not to say' },
    { value: 'other', label: 'Other' },
  ];

  readonly allEntries = signal<GuestEntry[]>(loadEntries());
  readonly draftName = signal('');
  readonly draftEmail = signal('');
  readonly draftPhone = signal('');
  readonly draftGender = signal('');
  readonly draftReferrer = signal('');
  readonly draftNotes = signal('');
  readonly formMessage = signal<string | null>(null);

  /** `recent` = newest first (ops default); `queue` = signup order with # for door / PR. */
  readonly listSortMode = signal<'recent' | 'queue'>('recent');

  readonly displayedEntries = computed(() => {
    const gid = this.w.selectedId();
    const rows = this.allEntries().filter((e) => e.guestlistId === gid);
    if (this.listSortMode() === 'queue') {
      return [...rows].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
    return [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

  onSelectGuestlist(id: string): void {
    this.w.selectGuestlist(id);
    this.formMessage.set(null);
    this.listSortMode.set('recent');
  }

  toggleSeeOrder(): void {
    this.listSortMode.update((m) => (m === 'recent' ? 'queue' : 'recent'));
  }

  setDraftName(value: string): void {
    this.draftName.set(value);
  }

  setDraftEmail(value: string): void {
    this.draftEmail.set(value);
  }

  setDraftPhone(value: string): void {
    this.draftPhone.set(value);
  }

  setDraftGender(value: string): void {
    this.draftGender.set(value);
  }

  setDraftReferrer(value: string): void {
    this.draftReferrer.set(value);
  }

  setDraftNotes(value: string): void {
    this.draftNotes.set(value);
  }

  genderLabel(stored: string): string {
    if (!stored) {
      return '—';
    }
    const row = this.genderSelectOptions.find((o) => o.value === stored);
    return row?.label ?? stored;
  }

  addGuest(): void {
    const gid = this.w.selectedId();
    if (!gid) {
      this.formMessage.set('Pick a guestlist first.');
      return;
    }
    const fullName = this.draftName().trim();
    const email = this.draftEmail().trim();
    if (!fullName || !email) {
      this.formMessage.set('Full name and email are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.formMessage.set('Enter a valid email address.');
      return;
    }
    const entry: GuestEntry = {
      id: newEntryId(),
      guestlistId: gid,
      fullName,
      email,
      phone: this.draftPhone().trim(),
      gender: this.draftGender(),
      referrer: this.draftReferrer().trim(),
      additionalNotes: this.draftNotes().trim(),
      createdAt: new Date().toISOString(),
    };
    this.allEntries.update((rows) => [...rows, entry]);
    this.persistEntries();
    this.draftName.set('');
    this.draftEmail.set('');
    this.draftPhone.set('');
    this.draftGender.set('');
    this.draftReferrer.set('');
    this.draftNotes.set('');
    this.formMessage.set(`Added ${fullName} to this list.`);
    window.setTimeout(() => this.formMessage.set(null), 2800);
  }

  removeGuest(id: string): void {
    this.allEntries.update((rows) => rows.filter((e) => e.id !== id));
    this.persistEntries();
  }

  formatAddedAt(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return '—';
    }
    return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  }

  private persistEntries(): void {
    try {
      localStorage.setItem(LS_ENTRIES, JSON.stringify(this.allEntries()));
    } catch {
      /* ignore */
    }
  }
}
