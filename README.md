# FZ Table Management (prototype)

Angular app: Fever Zone **table management** hub (floor grid, reservations, door/ops, POS mock, reporting) plus existing guestlist hubs.

## Live demo

**URL:** https://davidelovison-hue.github.io/FZ-Table-Mgmt/

Built from the `gh-pages` branch. **One-time:** in this repo on GitHub go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, branch **`gh-pages`**, folder **`/ (root)`**, then Save.

## Prerequisites

- Node 18+ (20 recommended)

## Commands

```bash
npm ci
npm start
```

Dev server: http://localhost:4200/

Serve under the same URL path as GitHub Pages (hot reload):

```bash
npm run start:gh-pages
```

Open http://127.0.0.1:4211/FZ-Table-Mgmt/

### Production build & GitHub Pages

```bash
npm run build:gh-pages
npm run deploy:gh-pages
```

`deploy:gh-pages` builds and pushes the `dist` output to the **`gh-pages`** branch of  
https://github.com/davidelovison-hue/FZ-Table-Mgmt

### Preview production build locally

```bash
npm run preview:gh-pages
```

Then open http://127.0.0.1:4211/FZ-Table-Mgmt/

GitHub Pages URLs use the **repository name exactly as shown on GitHub** (here `FZ-Table-Mgmt`, not `fz-table-mgmt`). The Angular `base-href` must match.

If this folder ever pointed at another remote (for example FeverZone guestlist), it now uses **`origin` → `FZ-Table-Mgmt`**; the old remote is kept as **`guestlist-origin`** when applicable.

## Repo layout

- Source: `src/`
- Table management UI: `src/app/table-mgmt/`
- Reference-only snapshot of marketing HTML (do not edit as source): `Content.html` if present at repo root

Generated with [Angular CLI](https://github.com/angular/angular-cli) 18.x.
