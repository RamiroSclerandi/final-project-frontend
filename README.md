# proyecto-final-frontend

Telemetry dashboard SPA (Vite + React + TypeScript + Tailwind CSS + TanStack
Query + React Router + Supabase).

## Requirements

- Node v24+
- pnpm v11+

## Setup

```bash
pnpm install
cp .env.example .env
```

Fill in `.env` with a real `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
Only the project URL and the anon key ever belong here — never a
`service_role` key.

## Running locally

```bash
pnpm dev
```

## Commands

```bash
pnpm test               # unit tests (Vitest + React Testing Library)
pnpm test:watch         # unit tests, watch mode
pnpm test:integration   # integration tests against a real local Supabase
pnpm lint               # ESLint
pnpm format             # Prettier, write
pnpm format:check       # Prettier, check only
pnpm build              # type-check + production build
pnpm gen:types          # regenerate src/lib/database.types.ts from the deployed schema
```

`pnpm gen:types` requires `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_ID`
in the environment; these are CI-only secrets and are never `VITE_*`.

## Integration tests

Integration tests run against a real local Supabase instance sourced from
the backend repository. `scripts/bootstrap-supabase.mjs` sparse-checks-out
`proyecto-final-backend`'s `supabase/` directory (pinned to the commit in
`supabase-backend.lock.json`) into the gitignored `.supabase-backend/`, then
verifies the checkout still matches the schema contract this repo depends
on before `supabase start` runs.
