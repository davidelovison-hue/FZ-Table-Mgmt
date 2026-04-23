export type NavigationMode = 'tabs' | 'stepper';

export type Selection =
  | { level: 'l1'; l1Id: string }
  | { level: 'l2'; l1Id: string; l2Id: string }
  | { level: 'l3'; l1Id: string; l2Id: string; l3Id: string };

export interface SessionTypeRef {
  id: string;
  name: string;
}

/** Localized copy for customer-facing strings (default language = top-level fields). */
export interface CategoryTranslation {
  id: string;
  /** BCP-47-ish code, e.g. es, fr, pt-BR */
  locale: string;
  externalTitle: string;
  /** Use empty string at L1 (PRD: no description on L1). */
  description: string;
}

export interface CategoryL3 {
  id: string;
  internalLabel: string;
  externalTitle: string;
  position: number;
  imageUrl: string;
  description: string;
  translations: CategoryTranslation[];
  sessionTypeIds: string[];
}

export interface CategoryL2 {
  id: string;
  internalLabel: string;
  externalTitle: string;
  position: number;
  imageUrl: string;
  description: string;
  translations: CategoryTranslation[];
  children: CategoryL3[];
}

export interface CategoryL1 {
  id: string;
  internalLabel: string;
  externalTitle: string;
  position: number;
  imageUrl: string;
  description: string;
  translations: CategoryTranslation[];
  children: CategoryL2[];
}

export interface PlanStructuredConfig {
  planLabel: string;
  structuredPlanViewEnabled: boolean;
  navigationMode: NavigationMode;
  l1Categories: CategoryL1[];
}
