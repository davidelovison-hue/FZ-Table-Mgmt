import { Injectable, signal } from '@angular/core';
import { GUESTLIST_CATALOG } from './guestlist-catalog';

const LS_KEY = 'fz-guestlist-summaries-v1';

export interface GuestlistSummary {
  id: string;
  name: string;
  /** Hex #rrggbb for sidebar / chips. */
  listColor: string;
}

const DEFAULT_LIST_COLOR = '#8a1343';

const CATALOG_DEFAULT_COLORS = ['#8a1343', '#0079ca'] as const;

function catalogAsSummaries(): GuestlistSummary[] {
  return GUESTLIST_CATALOG.map((g, i) => ({
    id: g.id,
    name: g.name,
    listColor: CATALOG_DEFAULT_COLORS[i % CATALOG_DEFAULT_COLORS.length] ?? DEFAULT_LIST_COLOR,
  }));
}

function parseStored(raw: string | null): GuestlistSummary[] | null {
  if (!raw) {
    return null;
  }
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) {
      return null;
    }
    return v
      .filter((row): row is GuestlistSummary => {
        return (
          row !== null &&
          typeof row === 'object' &&
          typeof (row as GuestlistSummary).id === 'string' &&
          typeof (row as GuestlistSummary).name === 'string'
        );
      })
      .map((row) => {
        const r = row as GuestlistSummary;
        const listColor =
          typeof r['listColor'] === 'string' && /^#[0-9a-fA-F]{6}$/.test(r['listColor'])
            ? r['listColor'].toLowerCase()
            : DEFAULT_LIST_COLOR;
        return { id: r.id, name: r.name, listColor };
      });
  } catch {
    return null;
  }
}

/**
 * Keeps guestlist id/name in sync for the Guests tab. Configuration updates this on every list change.
 * Persisted so the Guests route sees the latest lists even if Configuration was not opened this session.
 */
@Injectable({ providedIn: 'root' })
export class GuestlistSummariesService {
  readonly summaries = signal<GuestlistSummary[]>(this.loadInitial());

  setSummaries(rows: GuestlistSummary[]): void {
    this.summaries.set(rows);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(rows));
    } catch {
      /* ignore quota / private mode */
    }
  }

  private loadInitial(): GuestlistSummary[] {
    try {
      const parsed = parseStored(localStorage.getItem(LS_KEY));
      if (parsed?.length) {
        return parsed;
      }
    } catch {
      /* ignore */
    }
    return catalogAsSummaries();
  }
}
