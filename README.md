# TERESA — website and TERESA Connect

TERESA (Autonomous Urine Collector with Self-Disposal and UV-C Treatment) is an assistive
healthcare robotics **research prototype concept**. It is not a medical device and is not
approved for patient use.

This repository contains:

- **Landing page** (`/`) with a real-time 3D model of the mobile unit.
- **Explore** (`/explore`): the problem, overview, invention, interactive workflow,
  engineering modules and research, each statement labelled *Published*, *Proposed* or *Not yet tested*.
- **TERESA Connect** (`/connect`): a monitoring dashboard driven by a deterministic
  simulation of five units (TERESA 1–5) in one hospital ward, with a React Three Fiber 3D view.

All dashboard values are **simulated**. No hardware telemetry is connected.

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server, public content |
| `npm run build` | Production build, public content (used by Vercel) |
| `npm run preview` | Serve the production build |
| `npm test` | Simulation engine tests (Vitest) |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm run check` | All of the above |
| `npm run dev:full` / `build:full` | Private build (needs a local `src/private/`, which is not in this repo) |

## Structure

```
src/
  teresa/        simulation engine (pure TS), types, model config, store, text
  three/         React Three Fiber scene: ward, beds, docks, robots, camera
  connect/       TERESA Connect layout, pages and panels
  pages/         Landing, Explore, About
  components/    shared UI (wordmark, header, footer, diagrams)
  content/       public page content
  private-stub/  public stand-ins for src/private (see its README)
  styles/        design tokens and CSS
```

- One source of truth: `src/teresa/store.ts` runs one engine and one animation loop.
  React panels subscribe via `useSyncExternalStore` (~6 updates/s); the 3D scene reads
  the live state inside `useFrame`, so there are no per-frame React updates.
- The selected unit lives in the URL (`/connect/simulation?unit=teresa-3`), so the 3D view
  and every panel always show the same unit.
- All dimensions and simulation parameters are in `src/teresa/model-config.ts`. They are
  conceptual values, not verified specifications.
- `TelemetrySource` in `store.ts` is the interface a real hardware source must implement.

## Deployment

Vercel builds with `npm run build`. `vercel.json` rewrites client routes to `index.html`
so deep links such as `/connect/alerts` work after a refresh.
