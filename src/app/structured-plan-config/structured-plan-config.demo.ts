import type { CategoryTranslation, PlanStructuredConfig, SessionTypeRef } from './structured-plan-config.models';

export const MOCK_SESSION_TYPES: SessionTypeRef[] = [
  { id: 'st-101', name: '3-Day General Admission' },
  { id: 'st-102', name: '3-Day VIP Pass' },
  { id: 'st-201', name: 'Standard Camping Spot' },
  { id: 'st-202', name: 'Glamping Tent' },
  { id: 'st-301', name: 'Backstage Upgrade' },
  { id: 'st-351', name: 'Drinks Package – Basic' },
  { id: 'st-352', name: 'Drinks Package – Premium' },
  { id: 'st-381', name: 'Fast Track Entry' },
  { id: 'st-401', name: '3-Day Locker' },
  { id: 'st-501', name: 'Lounge Access' },
  { id: 'st-502', name: 'Parking Add-on' },
];

function id(): string {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** PRD-shaped sample: L1 → L2 → L3 with session type ids. */
export function createDemoPlanConfig(): PlanStructuredConfig {
  const l1Entry = id();
  const l1Camp = id();
  const l2Entry = id();
  const l2Camp = id();
  const l3Ga = id();
  const l3Vip = id();
  const l3StdCamp = id();
  const l3Glam = id();

  return {
    planLabel: 'Festival Weekend 2026 (single plan mock)',
    structuredPlanViewEnabled: true,
    navigationMode: 'tabs',
    l1Categories: [
      {
        id: l1Entry,
        internalLabel: 'ENTRY_TAB',
        externalTitle: 'Entry Pass',
        position: 0,
        imageUrl: '',
        description: '',
        translations: [
          {
            id: id(),
            locale: 'es',
            externalTitle: 'Abono de entrada',
            description: '',
          } satisfies CategoryTranslation,
        ],
        children: [
          {
            id: l2Entry,
            internalLabel: 'ENTRY',
            externalTitle: 'Entry',
            position: 0,
            imageUrl: '',
            description: 'Main entry tickets for the festival.',
            translations: [],
            children: [
              {
                id: l3Ga,
                internalLabel: 'GA_3D',
                externalTitle: '3-Day General Admission',
                position: 0,
                imageUrl: '',
                description: 'Full festival access, general areas.',
                translations: [
                  {
                    id: id(),
                    locale: 'es',
                    externalTitle: 'Abono general de 3 días',
                    description: 'Acceso al festival en zonas generales.',
                  } satisfies CategoryTranslation,
                ],
                sessionTypeIds: ['st-101'],
              },
              {
                id: l3Vip,
                internalLabel: 'VIP_3D',
                externalTitle: '3-Day VIP Pass',
                position: 1,
                imageUrl: '',
                description: 'VIP areas and faster lanes where applicable.',
                translations: [],
                sessionTypeIds: ['st-102'],
              },
            ],
          },
        ],
      },
      {
        id: l1Camp,
        internalLabel: 'CAMPING_TAB',
        externalTitle: 'Camping',
        position: 1,
        imageUrl: '',
        description: '',
        translations: [],
        children: [
          {
            id: l2Camp,
            internalLabel: 'CAMPING',
            externalTitle: 'Camping',
            position: 0,
            imageUrl: '',
            description: 'Add camping to your entry.',
            translations: [],
            children: [
              {
                id: l3StdCamp,
                internalLabel: 'CAMP_STD',
                externalTitle: 'Standard Camping Spot',
                position: 0,
                imageUrl: '',
                description: '',
                translations: [],
                sessionTypeIds: ['st-201'],
              },
              {
                id: l3Glam,
                internalLabel: 'CAMP_GLAMP',
                externalTitle: 'Glamping Tent',
                position: 1,
                imageUrl: '',
                description: '',
                translations: [],
                sessionTypeIds: ['st-202'],
              },
            ],
          },
        ],
      },
    ],
  };
}
