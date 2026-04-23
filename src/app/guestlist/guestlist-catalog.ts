/**
 * Stable guestlist ids/names for the prototype. Used by Configuration seed data and the Guests tab.
 * When adding demo lists in config, extend this catalog and seed together.
 */
export const GUESTLIST_CATALOG: ReadonlyArray<{ readonly id: string; readonly name: string }> = [
  { id: 'gl-vip', name: 'VIP backstage list' },
  { id: 'gl-industry', name: 'Industry night' },
];
