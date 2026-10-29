# TERESA v2 redesign — notes

Branch: `redesign-v2`. Status: implementation complete; see "Verification" for what has
and has not been run.

## Decisions

| Topic | Decision | Why |
|---|---|---|
| Stack | Kept Vite + React 19. Added TypeScript, React Router 7, React Three Fiber 9 + drei 10, Vitest | Continue the existing stack; R3F requested |
| Old app | `TeresaConnect.jsx` (single 1,700-line file) replaced; Vite boilerplate removed | It used random telemetry, a "LIVE" badge, fictional patients and a hard-coded phone number |
| Units | TERESA 1–5, one per bed, in **one shared ward** | Requested hospital-ward view; one canvas shows all five |
| Collisions | One shared aisle and disposal point; only one unit away at a time (queue) | Guarantees no two units occupy the same space |
| Before leaving | Final transfer empties the dock buffer | Prevents buffer overflow while the unit is away |
| Rinse | Optional, runs at the disposal point before returning (private build only) | Rinse water goes straight to disposal |
| Wheels | Exactly four, all driven, skid-steer (asserted in dev and tested) | Matches the four-wheel decision and main board Rev A |
| Time | Simulation is time-compressed; inflow rates are accelerated and labelled | A readable demo; values are illustrative |
| Service worker | Replaced with a self-unregistering worker | The old one cached dev paths and could serve stale pages |

## Disclosure control

- `npm run build` (Vercel) is the **public** build: only content published in the paper.
- `src/private/` holds unpublished design content and is **git-ignored**. `@private/*`
  resolves to it only in `--mode full` when the folder exists; otherwise to `src/private-stub/`.
- Verified with an esbuild bundle check: the public bundle contains none of the private terms;
  the committed source contains none either.

## What is simulated

Everything on `/connect`: stages, positions, levels, battery, valves, interlocks, faults,
alerts and logs. `hardwareSource.connected` is `false`.

## Known limitations

- The abstract, full reference list, team and contact are placeholders (to be pasted from the paper).
- 3D geometry is conceptual and not to scale.
- No hardware telemetry integration yet (interface only).
