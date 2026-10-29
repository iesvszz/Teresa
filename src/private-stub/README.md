# private-stub

Public stand-ins for `src/private/`. The real `src/private/` folder holds
unpublished design details and is **not committed** to this
repository (see `.gitignore`).

- `npm run build` (public) always resolves `@private/*` here.
- `npm run dev:full` / `build:full` resolves `@private/*` to `src/private/` if it
  exists on your machine, otherwise falls back here with a warning.
