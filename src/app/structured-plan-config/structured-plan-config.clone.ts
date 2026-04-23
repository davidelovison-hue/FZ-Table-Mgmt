import type { CategoryL1, CategoryL2, CategoryL3, CategoryTranslation, PlanStructuredConfig } from './structured-plan-config.models';

export function newCategoryId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cloneTranslation(t: CategoryTranslation): CategoryTranslation {
  return {
    id: newCategoryId(),
    locale: t.locale,
    externalTitle: t.externalTitle,
    description: t.description,
  };
}

export function cloneL3Tree(source: CategoryL3): CategoryL3 {
  return {
    ...source,
    id: newCategoryId(),
    internalLabel: `${source.internalLabel}_COPY`,
    externalTitle: `${source.externalTitle} (copy)`,
    translations: source.translations.map(cloneTranslation),
    sessionTypeIds: [...source.sessionTypeIds],
  };
}

export function cloneL2Tree(source: CategoryL2): CategoryL2 {
  return {
    ...source,
    id: newCategoryId(),
    internalLabel: `${source.internalLabel}_COPY`,
    externalTitle: `${source.externalTitle} (copy)`,
    translations: source.translations.map(cloneTranslation),
    children: source.children.map(cloneL3Tree),
  };
}

export function cloneL1Tree(source: CategoryL1): CategoryL1 {
  return {
    ...source,
    id: newCategoryId(),
    internalLabel: `${source.internalLabel}_COPY`,
    externalTitle: `${source.externalTitle} (copy)`,
    translations: source.translations.map(cloneTranslation),
    children: source.children.map(cloneL2Tree),
  };
}

export function insertAfterId<T extends { id: string }>(rows: readonly T[], afterId: string, item: T): T[] {
  const list = [...rows];
  const idx = list.findIndex((r) => r.id === afterId);
  if (idx < 0) {
    list.push(item);
  } else {
    list.splice(idx + 1, 0, item);
  }
  return list;
}

function normalizeTranslationRow(t: CategoryTranslation): CategoryTranslation {
  return {
    id: t.id?.trim() ? t.id : newCategoryId(),
    locale: (t.locale ?? '').trim() || 'und',
    externalTitle: t.externalTitle ?? '',
    description: t.description ?? '',
  };
}

/** Ensures `translations` exists on every node (older saved JSON). */
export function normalizePlanConfig(cfg: PlanStructuredConfig): PlanStructuredConfig {
  return {
    ...cfg,
    l1Categories: cfg.l1Categories.map((l1) => ({
      ...l1,
      translations: (l1.translations ?? []).map(normalizeTranslationRow),
      children: l1.children.map((l2) => ({
        ...l2,
        translations: (l2.translations ?? []).map(normalizeTranslationRow),
        children: l2.children.map((l3) => ({
          ...l3,
          translations: (l3.translations ?? []).map(normalizeTranslationRow),
        })),
      })),
    })),
  };
}
