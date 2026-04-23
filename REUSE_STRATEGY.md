# Reuse Strategy for Multiple Projects

This repository now uses `src/app/shared` as the source of truth for reusable UI, icons, and utilities.

## Directory ownership

- `src/app/shared/`: reusable code across frontend and backoffice screens
- `src/app/**`: feature and page composition (project-specific behavior)

## Import conventions

Use path aliases instead of deep relative imports:

- `@shared` for exports from `src/app/shared/index.ts`
- `@shared/*` for direct access when needed
- `@app/*` for app-level modules

Examples:

```ts
import { PageTitleComponent, trackBy } from '@shared';
import { SomeFeatureComponent } from '@app/some-feature/some-feature.component';
```

## What goes into shared

Move code to `shared` when at least one is true:

- Used by two or more features/projects
- Pure presentational component (no feature-specific API calls)
- Generic utility/type that does not depend on one domain

Keep code local when it is specific to one flow, route, or business rule.

## Suggested scaling model

When new frontend/backoffice modules are added:

1. Build feature locally first
2. Promote repeated UI or helpers into `shared`
3. Re-export from `shared/index.ts`
4. Replace relative imports with `@shared`

This keeps implementation fast while preventing duplication drift.
