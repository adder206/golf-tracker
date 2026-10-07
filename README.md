# Golf Tracker

A dashboard to track golf shots at the driving range. Log each shot with
**club**, **distance**, and **direction**, and see your stats: shot count,
average and longest distance, direction dispersion, per-club performance,
and recent shot history.

## Stack

- React 19 + Tailwind CSS 4 + Recharts (client)
- Bun server actions + Drizzle ORM + SQLite (server)
- Built as a Hatch web artifact (`@hatch/space-sdk`)

## Development

```bash
bun install
bun run build
```

> Note: `@hatch/space-sdk` is a `file:` dependency pointing at the Hatch
> runtime (`/opt/hatch/skills/spaces/ts-runtime/dist/space-sdk.tgz`), so a
> full local build only works inside the Hatch environment. The client under
> `client/` is standard React + Vite-style code and can be adapted to run
> standalone.

## Project layout

- `client/src/` — React app (`App.tsx`, `api.ts`, `theme.css`)
- `server/src/` — server actions (`actions.ts`) and DB schema (`schema.ts`)
- `drizzle/` — SQL migrations
