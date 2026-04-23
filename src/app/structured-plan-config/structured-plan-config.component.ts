import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  effect,
  signal,
} from '@angular/core';
import {
  cloneL1Tree,
  cloneL2Tree,
  cloneL3Tree,
  insertAfterId,
  newCategoryId,
  normalizePlanConfig,
} from './structured-plan-config.clone';
import { createDemoPlanConfig, MOCK_SESSION_TYPES } from './structured-plan-config.demo';
import type {
  CategoryL1,
  CategoryL2,
  CategoryL3,
  CategoryTranslation,
  PlanStructuredConfig,
  Selection,
  SessionTypeRef,
} from './structured-plan-config.models';

const STORAGE_KEY = 'fz-table-mgmt-structured-plan-config-v1';

function loadPlanInitialState(): { plan: PlanStructuredConfig; lastSavedCanonical: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const plan = normalizePlanConfig(createDemoPlanConfig());
      return { plan, lastSavedCanonical: JSON.stringify(plan) };
    }
    const parsed = JSON.parse(raw) as PlanStructuredConfig;
    if (!parsed || !Array.isArray(parsed.l1Categories)) {
      const plan = normalizePlanConfig(createDemoPlanConfig());
      return { plan, lastSavedCanonical: JSON.stringify(plan) };
    }
    const plan = normalizePlanConfig(parsed);
    return { plan, lastSavedCanonical: JSON.stringify(plan) };
  } catch {
    const plan = normalizePlanConfig(createDemoPlanConfig());
    return { plan, lastSavedCanonical: JSON.stringify(plan) };
  }
}

const STRUCTURED_PLAN_BOOT = loadPlanInitialState();

function sortByPosition<T extends { position: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.position - b.position);
}

/**
 * Assigns `position` from the current array order. Must not resort by the old `position`
 * values — otherwise a swap is immediately undone when both rows keep their previous positions.
 */
function renumber<T extends { position: number }>(rows: T[]): T[] {
  return rows.map((row, index) => ({ ...row, position: index }));
}

function translationDuplicateWarnings(tr: CategoryTranslation[], label: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tr) {
    const key = t.locale.trim().toLowerCase();
    if (!key) {
      continue;
    }
    if (seen.has(key)) {
      out.push(`${label}: duplicate translation locale “${t.locale}”.`);
    }
    seen.add(key);
  }
  return out;
}

type EditableCategoryField = 'internalLabel' | 'externalTitle' | 'imageUrl' | 'description';

/** Mock catalogue session types linked on L3s vs mock list size. */
interface SessionLinkSummary {
  linkedFromMockCount: number;
  mockCatalogSize: number;
  hasLinkageWarning: boolean;
}

@Component({
  selector: 'app-structured-plan-config',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './structured-plan-config.component.html',
  styleUrl: './structured-plan-config.component.css',
})
export class StructuredPlanConfigComponent {
  readonly sessionTypes: SessionTypeRef[] = MOCK_SESSION_TYPES;
  readonly sessionSearch = signal('');
  readonly config = signal<PlanStructuredConfig>(STRUCTURED_PLAN_BOOT.plan);
  /** Compact JSON of the last persisted configuration (local mock storage, or loaded on startup). */
  readonly lastSavedCanonicalJson = signal<string>(STRUCTURED_PLAN_BOOT.lastSavedCanonical);
  readonly selection = signal<Selection | null>(null);
  readonly showPreview = signal(false);
  readonly previewTabIndex = signal(0);
  /** Empty string = default (top-level externalTitle / description). */
  readonly previewLocale = signal('');
  /**
   * Preview-only: chosen mock session type id per L3 card (`l3Id` → `sessionTypeId`).
   * Not persisted; kept in sync with `sessionTypeIds` when the plan config changes.
   */
  readonly previewSessionPick = signal<Record<string, string>>({});
  /** Preview-only quantity per L3 card (`l3Id` → qty). Not persisted. */
  readonly previewSessionQty = signal<Record<string, number>>({});
  readonly persistMessage = signal<string | null>(null);
  readonly localePresets = ['es', 'fr', 'de', 'it', 'pt'] as const;

  readonly filteredSessionTypes = computed(() => {
    const q = this.sessionSearch().trim().toLowerCase();
    if (!q) {
      return this.sessionTypes;
    }
    return this.sessionTypes.filter(
      (s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q),
    );
  });

  readonly warnings = computed(() => {
    const cfg = this.config();
    const out: string[] = [];
    if (!cfg.structuredPlanViewEnabled) {
      out.push('Structured plan view is off — enabled plans would still use this config only when toggled on.');
    }
    if (cfg.l1Categories.length === 0) {
      out.push('No L1 categories — storefront tabs/stepper would be empty.');
    }
    for (const l1 of sortByPosition(cfg.l1Categories)) {
      out.push(...translationDuplicateWarnings(l1.translations, `L1 “${l1.externalTitle}”`));
      if (l1.children.length === 0) {
        out.push(`L1 “${l1.externalTitle}” (${l1.internalLabel}) has no L2 sections.`);
      }
      for (const l2 of sortByPosition(l1.children)) {
        out.push(...translationDuplicateWarnings(l2.translations, `L2 “${l2.externalTitle}”`));
        if (l2.children.length === 0) {
          out.push(`L2 “${l2.externalTitle}” under “${l1.externalTitle}” has no L3 rows.`);
        }
        for (const l3 of sortByPosition(l2.children)) {
          out.push(...translationDuplicateWarnings(l3.translations, `L3 “${l3.externalTitle}”`));
          if (l3.sessionTypeIds.length === 0) {
            out.push(`L3 “${l3.externalTitle}” is not linked to any session type.`);
          }
        }
      }
    }
    return out;
  });

  readonly activePreviewL1 = computed(() => {
    const l1List = sortByPosition(this.config().l1Categories);
    if (l1List.length === 0) {
      return null;
    }
    const i = Math.min(Math.max(0, this.previewTabIndex()), l1List.length - 1);
    return l1List[i] ?? null;
  });

  readonly exportJson = computed(() => JSON.stringify(this.config(), null, 2));

  readonly isDirty = computed(
    () => JSON.stringify(this.config()) !== this.lastSavedCanonicalJson(),
  );

  readonly sessionLinkSummary = computed((): SessionLinkSummary => {
    const cfg = this.config();
    const mockIds = new Set(this.sessionTypes.map((s) => s.id));
    const assigned = new Set<string>();
    let l3RowsMissingLink = 0;
    for (const l1 of cfg.l1Categories) {
      for (const l2 of l1.children) {
        for (const l3 of l2.children) {
          if (l3.sessionTypeIds.length === 0) {
            l3RowsMissingLink++;
          }
          for (const id of l3.sessionTypeIds) {
            assigned.add(id);
          }
        }
      }
    }
    let linkedFromMockCount = 0;
    let orphanAssignedCount = 0;
    for (const id of assigned) {
      if (mockIds.has(id)) {
        linkedFromMockCount++;
      } else {
        orphanAssignedCount++;
      }
    }
    return {
      linkedFromMockCount,
      mockCatalogSize: mockIds.size,
      hasLinkageWarning: l3RowsMissingLink > 0 || orphanAssignedCount > 0,
    };
  });

  readonly previewLocaleOptions = computed(() => {
    const set = new Set<string>();
    const add = (rows: CategoryTranslation[]): void => {
      for (const t of rows) {
        const loc = t.locale.trim();
        if (loc) {
          set.add(loc);
        }
      }
    };
    for (const l1 of this.config().l1Categories) {
      add(l1.translations);
      for (const l2 of l1.children) {
        add(l2.translations);
        for (const l3 of l2.children) {
          add(l3.translations);
        }
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  });

  @HostListener('window:beforeunload', ['$event'])
  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.isDirty()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  constructor() {
    effect(() => {
      const n = sortByPosition(this.config().l1Categories).length;
      if (n === 0) {
        this.previewTabIndex.set(0);
        return;
      }
      if (this.previewTabIndex() > n - 1) {
        this.previewTabIndex.set(n - 1);
      }
    });
    effect(() => {
      const cfg = this.config();
      const prevPick = this.previewSessionPick();
      const prevQty = this.previewSessionQty();
      const nextPick: Record<string, string> = { ...prevPick };
      const nextQty: Record<string, number> = { ...prevQty };
      let pickChanged = false;
      let qtyChanged = false;
      const seenL3 = new Set<string>();
      const visit = (l3: CategoryL3): void => {
        seenL3.add(l3.id);
        const ids = l3.sessionTypeIds;
        if (ids.length === 0) {
          if (nextPick[l3.id] !== undefined) {
            delete nextPick[l3.id];
            pickChanged = true;
          }
          if (nextQty[l3.id] !== undefined) {
            delete nextQty[l3.id];
            qtyChanged = true;
          }
          return;
        }
        const pick = nextPick[l3.id];
        if (!pick || !ids.includes(pick)) {
          nextPick[l3.id] = ids[0];
          pickChanged = true;
        }
        const qty = nextQty[l3.id];
        if (qty === undefined || !Number.isFinite(qty)) {
          nextQty[l3.id] = 1;
          qtyChanged = true;
        }
      };
      for (const l1 of sortByPosition(cfg.l1Categories)) {
        for (const l2 of sortByPosition(l1.children)) {
          for (const l3 of sortByPosition(l2.children)) {
            visit(l3);
          }
        }
      }
      for (const k of Object.keys(nextPick)) {
        if (!seenL3.has(k)) {
          delete nextPick[k];
          pickChanged = true;
        }
      }
      for (const k of Object.keys(nextQty)) {
        if (!seenL3.has(k)) {
          delete nextQty[k];
          qtyChanged = true;
        }
      }
      if (pickChanged) {
        this.previewSessionPick.set(nextPick);
      }
      if (qtyChanged) {
        this.previewSessionQty.set(nextQty);
      }
    });
  }

  selectL1(l1Id: string): void {
    this.selection.set({ level: 'l1', l1Id });
  }

  selectL2(l1Id: string, l2Id: string): void {
    this.selection.set({ level: 'l2', l1Id, l2Id });
  }

  selectL3(l1Id: string, l2Id: string, l3Id: string): void {
    this.selection.set({ level: 'l3', l1Id, l2Id, l3Id });
  }

  isL1Selected(id: string): boolean {
    const s = this.selection();
    return s?.level === 'l1' && s.l1Id === id;
  }

  isL2Selected(l1Id: string, l2Id: string): boolean {
    const s = this.selection();
    return s?.level === 'l2' && s.l1Id === l1Id && s.l2Id === l2Id;
  }

  isL3Selected(l1Id: string, l2Id: string, l3Id: string): boolean {
    const s = this.selection();
    return s?.level === 'l3' && s.l1Id === l1Id && s.l2Id === l2Id && s.l3Id === l3Id;
  }

  setStructuredEnabled(enabled: boolean): void {
    const c = this.config();
    this.config.set({ ...c, structuredPlanViewEnabled: enabled });
  }

  setNavigationMode(mode: PlanStructuredConfig['navigationMode']): void {
    const c = this.config();
    this.config.set({ ...c, navigationMode: mode });
  }

  setSessionSearch(value: string): void {
    this.sessionSearch.set(value);
  }

  toggleShowPreview(): void {
    this.showPreview.update((v) => !v);
  }

  setPreviewTab(index: number): void {
    this.previewTabIndex.set(index);
  }

  /** Effective session type id for preview radios on this L3 (defaults to first linked id). */
  previewSessionPickFor(l3: CategoryL3): string {
    const ids = l3.sessionTypeIds;
    if (ids.length === 0) {
      return '';
    }
    const picked = this.previewSessionPick()[l3.id];
    if (picked && ids.includes(picked)) {
      return picked;
    }
    return ids[0];
  }

  setPreviewSessionPick(l3Id: string, sessionTypeId: string): void {
    this.previewSessionPick.update((m) => ({ ...m, [l3Id]: sessionTypeId }));
  }

  previewSessionQtyFor(l3: CategoryL3): number {
    return this.previewSessionQty()[l3.id] ?? 1;
  }

  decreasePreviewSessionQty(l3: CategoryL3): void {
    const curr = this.previewSessionQtyFor(l3);
    if (curr <= 1) {
      return;
    }
    this.previewSessionQty.update((m) => ({ ...m, [l3.id]: curr - 1 }));
  }

  increasePreviewSessionQty(l3: CategoryL3): void {
    const curr = this.previewSessionQtyFor(l3);
    if (curr >= 10) {
      return;
    }
    this.previewSessionQty.update((m) => ({ ...m, [l3.id]: curr + 1 }));
  }

  updateSelectedField(field: EditableCategoryField, value: string): void {
    const s = this.selection();
    if (!s) {
      return;
    }
    // PRD §4.3: media only on L3+; description / “more info” not on L1; L2 has no image.
    if (field === 'imageUrl' && s.level !== 'l3') {
      return;
    }
    if (field === 'description' && s.level === 'l1') {
      return;
    }
    const c = this.config();
    if (s.level === 'l1') {
      this.config.set({
        ...c,
        l1Categories: c.l1Categories.map((l1) =>
          l1.id === s.l1Id ? { ...l1, [field]: value } : l1,
        ),
      });
      return;
    }
    if (s.level === 'l2') {
      this.config.set({
        ...c,
        l1Categories: c.l1Categories.map((l1) =>
          l1.id !== s.l1Id
            ? l1
            : {
                ...l1,
                children: l1.children.map((l2) =>
                  l2.id === s.l2Id ? { ...l2, [field]: value } : l2,
                ),
              },
        ),
      });
      return;
    }
    this.config.set({
      ...c,
      l1Categories: c.l1Categories.map((l1) =>
        l1.id !== s.l1Id
          ? l1
          : {
              ...l1,
              children: l1.children.map((l2) =>
                l2.id !== s.l2Id
                  ? l2
                  : {
                      ...l2,
                      children: l2.children.map((l3) =>
                        l3.id === s.l3Id ? { ...l3, [field]: value } : l3,
                      ),
                    },
              ),
            },
      ),
    });
  }

  toggleSessionTypeOnSelected(sessionTypeId: string): void {
    const s = this.selection();
    if (!s || s.level !== 'l3') {
      return;
    }
    const c = this.config();
    this.config.set({
      ...c,
      l1Categories: c.l1Categories.map((l1) =>
        l1.id !== s.l1Id
          ? l1
          : {
              ...l1,
              children: l1.children.map((l2) =>
                l2.id !== s.l2Id
                  ? l2
                  : {
                      ...l2,
                      children: l2.children.map((l3) => {
                        if (l3.id !== s.l3Id) {
                          return l3;
                        }
                        const has = l3.sessionTypeIds.includes(sessionTypeId);
                        const sessionTypeIds = has
                          ? l3.sessionTypeIds.filter((x) => x !== sessionTypeId)
                          : [...l3.sessionTypeIds, sessionTypeId];
                        return { ...l3, sessionTypeIds };
                      }),
                    },
              ),
            },
      ),
    });
  }

  sessionTypeSelected(sessionTypeId: string): boolean {
    const s = this.selection();
    if (!s || s.level !== 'l3') {
      return false;
    }
    const l3 = this.findL3(s.l1Id, s.l2Id, s.l3Id);
    return l3?.sessionTypeIds.includes(sessionTypeId) ?? false;
  }

  selectedNodeFields(): CategoryL1 | CategoryL2 | CategoryL3 | null {
    const s = this.selection();
    if (!s) {
      return null;
    }
    if (s.level === 'l1') {
      return this.config().l1Categories.find((x) => x.id === s.l1Id) ?? null;
    }
    if (s.level === 'l2') {
      return this.findL2(s.l1Id, s.l2Id);
    }
    return this.findL3(s.l1Id, s.l2Id, s.l3Id);
  }

  selectedLevelLabel(): string {
    const s = this.selection();
    if (!s) {
      return '';
    }
    if (s.level === 'l1') {
      return 'Level 1 — navigation (tab / step)';
    }
    if (s.level === 'l2') {
      return 'Level 2 — grouping section';
    }
    return 'Level 3 — purchasable row (maps to session types)';
  }

  /** PRD §4.3 attribute table — which inspector inputs are shown. */
  inspectorAllowsMedia(): boolean {
    return this.selection()?.level === 'l3';
  }

  inspectorAllowsDescription(): boolean {
    const level = this.selection()?.level;
    return level === 'l2' || level === 'l3';
  }

  /** Short PRD §4.3 reminder for the inspector (shown when a node is selected). */
  prdFieldScopeHint(): string {
    const s = this.selection();
    if (!s) {
      return '';
    }
    if (s.level === 'l1') {
      return 'PRD §4.3: L1 navigation — internal label, external title, ordering. No image, description, or display metadata.';
    }
    if (s.level === 'l2') {
      return 'PRD §4.3: L2 grouping — internal label, external title, optional description / tags (tags not in this mock). No image.';
    }
    return 'PRD §4.3: L3 selection — internal label, external title, optional image, optional description; assign session types.';
  }

  setPreviewLocale(value: string): void {
    this.previewLocale.set(value);
  }

  previewExternalTitle(node: { externalTitle: string; translations: CategoryTranslation[] }): string {
    const loc = this.previewLocale().trim().toLowerCase();
    if (!loc) {
      return node.externalTitle;
    }
    const row = node.translations.find((x) => x.locale.trim().toLowerCase() === loc);
    const alt = row?.externalTitle?.trim();
    return alt ? alt : node.externalTitle;
  }

  previewDescription(node: { description: string; translations: CategoryTranslation[] }): string {
    const loc = this.previewLocale().trim().toLowerCase();
    if (!loc) {
      return node.description;
    }
    const row = node.translations.find((x) => x.locale.trim().toLowerCase() === loc);
    const alt = row?.description?.trim();
    return alt ? alt : node.description;
  }

  selectedTranslations(): CategoryTranslation[] {
    return this.selectedNodeFields()?.translations ?? [];
  }

  suggestedLocalesToAdd(): readonly string[] {
    const existing = new Set(this.selectedTranslations().map((t) => t.locale.trim().toLowerCase()));
    return this.localePresets.filter((p) => !existing.has(p));
  }

  addTranslation(locale: string): void {
    const loc = locale.trim();
    if (!loc) {
      return;
    }
    const key = loc.toLowerCase();
    if (this.selectedTranslations().some((t) => t.locale.trim().toLowerCase() === key)) {
      return;
    }
    this.patchSelectedTranslations((prev) => [
      ...prev,
      { id: newCategoryId(), locale: loc, externalTitle: '', description: '' },
    ]);
  }

  removeTranslation(translationId: string): void {
    this.patchSelectedTranslations((prev) => prev.filter((t) => t.id !== translationId));
  }

  updateTranslationField(
    translationId: string,
    field: 'locale' | 'externalTitle' | 'description',
    value: string,
  ): void {
    if (field === 'locale') {
      const newLoc = value.trim();
      if (!newLoc) {
        return;
      }
      const prev = this.selectedTranslations();
      const key = newLoc.toLowerCase();
      if (prev.some((t) => t.id !== translationId && t.locale.trim().toLowerCase() === key)) {
        return;
      }
      this.patchSelectedTranslations((p) =>
        p.map((t) => (t.id === translationId ? { ...t, locale: newLoc } : t)),
      );
      return;
    }
    this.patchSelectedTranslations((prev) =>
      prev.map((t) => (t.id === translationId ? { ...t, [field]: value } : t)),
    );
  }

  duplicateSelected(): void {
    const s = this.selection();
    if (!s) {
      return;
    }
    const c = this.config();
    if (s.level === 'l1') {
      const l1 = c.l1Categories.find((x) => x.id === s.l1Id);
      if (!l1) {
        return;
      }
      const dup = cloneL1Tree(l1);
      this.config.set({ ...c, l1Categories: renumber(insertAfterId(c.l1Categories, s.l1Id, dup)) });
      this.selectL1(dup.id);
      return;
    }
    if (s.level === 'l2') {
      const l2 = this.findL2(s.l1Id, s.l2Id);
      if (!l2) {
        return;
      }
      const dup = cloneL2Tree(l2);
      this.config.set({
        ...c,
        l1Categories: c.l1Categories.map((l1) =>
          l1.id !== s.l1Id
            ? l1
            : { ...l1, children: renumber(insertAfterId(l1.children, s.l2Id, dup)) },
        ),
      });
      this.selectL2(s.l1Id, dup.id);
      return;
    }
    const l3 = this.findL3(s.l1Id, s.l2Id, s.l3Id);
    if (!l3) {
      return;
    }
    const dup = cloneL3Tree(l3);
    this.config.set({
      ...c,
      l1Categories: c.l1Categories.map((l1) =>
        l1.id !== s.l1Id
          ? l1
          : {
              ...l1,
              children: l1.children.map((l2) =>
                l2.id !== s.l2Id
                  ? l2
                  : { ...l2, children: renumber(insertAfterId(l2.children, s.l3Id, dup)) },
              ),
            },
      ),
    });
    this.selectL3(s.l1Id, s.l2Id, dup.id);
  }

  addL1(): void {
    const c = this.config();
    const nextPos = c.l1Categories.length;
    const node: CategoryL1 = {
      id: newCategoryId(),
      internalLabel: `L1_${nextPos + 1}`,
      externalTitle: 'New category',
      position: nextPos,
      imageUrl: '',
      description: '',
      translations: [],
      children: [],
    };
    this.config.set({ ...c, l1Categories: renumber([...c.l1Categories, node]) });
    this.selectL1(node.id);
  }

  addL2(l1Id: string): void {
    const c = this.config();
    this.config.set({
      ...c,
      l1Categories: c.l1Categories.map((l1) => {
        if (l1.id !== l1Id) {
          return l1;
        }
        const nextPos = l1.children.length;
        const node: CategoryL2 = {
          id: newCategoryId(),
          internalLabel: `L2_${nextPos + 1}`,
          externalTitle: 'New section',
          position: nextPos,
          imageUrl: '',
          description: '',
          translations: [],
          children: [],
        };
        return { ...l1, children: renumber([...l1.children, node]) };
      }),
    });
    const l2 = this.config().l1Categories.find((x) => x.id === l1Id)?.children.at(-1);
    if (l2) {
      this.selectL2(l1Id, l2.id);
    }
  }

  addL3(l1Id: string, l2Id: string): void {
    const c = this.config();
    this.config.set({
      ...c,
      l1Categories: c.l1Categories.map((l1) => {
        if (l1.id !== l1Id) {
          return l1;
        }
        return {
          ...l1,
          children: l1.children.map((l2) => {
            if (l2.id !== l2Id) {
              return l2;
            }
            const nextPos = l2.children.length;
            const node: CategoryL3 = {
              id: newCategoryId(),
              internalLabel: `L3_${nextPos + 1}`,
              externalTitle: 'New ticket row',
              position: nextPos,
              imageUrl: '',
              description: '',
              translations: [],
              sessionTypeIds: [],
            };
            return { ...l2, children: renumber([...l2.children, node]) };
          }),
        };
      }),
    });
    const l2 = this.config().l1Categories.find((x) => x.id === l1Id)?.children.find((x) => x.id === l2Id);
    const l3 = l2?.children.at(-1);
    if (l3) {
      this.selectL3(l1Id, l2Id, l3.id);
    }
  }

  moveL1(l1Id: string, dir: -1 | 1): void {
    const c = this.config();
    const list = sortByPosition(c.l1Categories);
    const i = list.findIndex((x) => x.id === l1Id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) {
      return;
    }
    const swapped = [...list];
    [swapped[i], swapped[j]] = [swapped[j]!, swapped[i]!];
    this.config.set({ ...c, l1Categories: renumber(swapped) });
  }

  moveL2(l1Id: string, l2Id: string, dir: -1 | 1): void {
    const c = this.config();
    this.config.set({
      ...c,
      l1Categories: c.l1Categories.map((l1) => {
        if (l1.id !== l1Id) {
          return l1;
        }
        const list = sortByPosition(l1.children);
        const i = list.findIndex((x) => x.id === l2Id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= list.length) {
          return l1;
        }
        const swapped = [...list];
        [swapped[i], swapped[j]] = [swapped[j]!, swapped[i]!];
        return { ...l1, children: renumber(swapped) };
      }),
    });
  }

  moveL3(l1Id: string, l2Id: string, l3Id: string, dir: -1 | 1): void {
    const c = this.config();
    this.config.set({
      ...c,
      l1Categories: c.l1Categories.map((l1) => {
        if (l1.id !== l1Id) {
          return l1;
        }
        return {
          ...l1,
          children: l1.children.map((l2) => {
            if (l2.id !== l2Id) {
              return l2;
            }
            const list = sortByPosition(l2.children);
            const i = list.findIndex((x) => x.id === l3Id);
            const j = i + dir;
            if (i < 0 || j < 0 || j >= list.length) {
              return l2;
            }
            const swapped = [...list];
            [swapped[i], swapped[j]] = [swapped[j]!, swapped[i]!];
            return { ...l2, children: renumber(swapped) };
          }),
        };
      }),
    });
  }

  deleteSelected(): void {
    const s = this.selection();
    if (!s) {
      return;
    }
    const c = this.config();
    if (s.level === 'l1') {
      const next = c.l1Categories.filter((x) => x.id !== s.l1Id);
      this.config.set({ ...c, l1Categories: renumber(next) });
      this.selection.set(null);
      return;
    }
    if (s.level === 'l2') {
      this.config.set({
        ...c,
        l1Categories: c.l1Categories.map((l1) =>
          l1.id !== s.l1Id
            ? l1
            : { ...l1, children: renumber(l1.children.filter((x) => x.id !== s.l2Id)) },
        ),
      });
      this.selectL1(s.l1Id);
      return;
    }
    this.config.set({
      ...c,
      l1Categories: c.l1Categories.map((l1) =>
        l1.id !== s.l1Id
          ? l1
          : {
              ...l1,
              children: l1.children.map((l2) =>
                l2.id !== s.l2Id
                  ? l2
                  : { ...l2, children: renumber(l2.children.filter((x) => x.id !== s.l3Id)) },
              ),
            },
      ),
    });
    this.selectL2(s.l1Id, s.l2Id);
  }

  saveConfiguration(): void {
    try {
      const snapshot = JSON.stringify(this.config());
      localStorage.setItem(STORAGE_KEY, snapshot);
      this.lastSavedCanonicalJson.set(snapshot);
      this.persistMessage.set('Configuration saved locally for this prototype (this browser only).');
    } catch {
      this.persistMessage.set('Could not save configuration (storage blocked or full).');
    }
    setTimeout(() => this.persistMessage.set(null), 3500);
  }

  discardUnsavedChanges(): void {
    if (!this.isDirty()) {
      return;
    }
    try {
      const parsed = JSON.parse(this.lastSavedCanonicalJson()) as PlanStructuredConfig;
      this.config.set(normalizePlanConfig(parsed));
      this.selection.set(null);
      this.persistMessage.set('Restored the last saved configuration in memory (no persistence run).');
    } catch {
      this.persistMessage.set('Could not restore — last saved snapshot is invalid. Try Reset demo data.');
    }
    setTimeout(() => this.persistMessage.set(null), 3500);
  }

  resetDemo(): void {
    this.config.set(normalizePlanConfig(createDemoPlanConfig()));
    this.selection.set(null);
    this.persistMessage.set(
      'Demo loaded in the editor only. Use Save configuration to persist locally, or Discard to return to the last saved snapshot.',
    );
    setTimeout(() => this.persistMessage.set(null), 4500);
  }

  sessionTypeName(id: string): string {
    return this.sessionTypes.find((s) => s.id === id)?.name ?? id;
  }

  sortRows<T extends { position: number }>(rows: T[]): T[] {
    return sortByPosition(rows);
  }

  private patchSelectedTranslations(updater: (prev: CategoryTranslation[]) => CategoryTranslation[]): void {
    const s = this.selection();
    if (!s) {
      return;
    }
    const c = this.config();
    const apply = (prev: CategoryTranslation[]): CategoryTranslation[] => updater([...prev]);
    if (s.level === 'l1') {
      this.config.set({
        ...c,
        l1Categories: c.l1Categories.map((l1) =>
          l1.id === s.l1Id ? { ...l1, translations: apply(l1.translations) } : l1,
        ),
      });
      return;
    }
    if (s.level === 'l2') {
      this.config.set({
        ...c,
        l1Categories: c.l1Categories.map((l1) =>
          l1.id !== s.l1Id
            ? l1
            : {
                ...l1,
                children: l1.children.map((l2) =>
                  l2.id === s.l2Id ? { ...l2, translations: apply(l2.translations) } : l2,
                ),
              },
        ),
      });
      return;
    }
    this.config.set({
      ...c,
      l1Categories: c.l1Categories.map((l1) =>
        l1.id !== s.l1Id
          ? l1
          : {
              ...l1,
              children: l1.children.map((l2) =>
                l2.id !== s.l2Id
                  ? l2
                  : {
                      ...l2,
                      children: l2.children.map((l3) =>
                        l3.id === s.l3Id ? { ...l3, translations: apply(l3.translations) } : l3,
                      ),
                    },
              ),
            },
      ),
    });
  }

  private findL2(l1Id: string, l2Id: string): CategoryL2 | null {
    const l1 = this.config().l1Categories.find((x) => x.id === l1Id);
    return l1?.children.find((x) => x.id === l2Id) ?? null;
  }

  private findL3(l1Id: string, l2Id: string, l3Id: string): CategoryL3 | null {
    const l2 = this.findL2(l1Id, l2Id);
    return l2?.children.find((x) => x.id === l3Id) ?? null;
  }
}
