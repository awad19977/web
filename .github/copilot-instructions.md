# Copilot Instructions

## Architecture
- React Router v7 SSR app with the root shell in `src/app/root.tsx`; Hono (`__create/index.ts`) handles server routing, auth, and Neon DB access.
- Vite config (`vite.config.ts`) wires custom plugins for layouts, Hot Reload, env restarts, and aliases `@` to `src` plus `@auth/create/react` to the Hono adapter.
- UI entry lives in `src/app/page.jsx`, which renders the dashboard shell and expects React Query context from `src/app/layout.jsx`.
- Global fetch is patched by `src/__create/fetch.ts` so server/client code can assume standard Fetch semantics with additional sandbox messaging.

## Dev Workflow
- Run `npm install` (Bun lock exists but package scripts assume npm) and start the app with `npm run dev` (serves on http://localhost:4000).
- Schema-dependent API routes assume a Postgres connection; set `DATABASE_URL` before starting or expect the guard in `src/app/api/utils/sql.js` to throw.
- Type safety uses `npm run typecheck` (runs `react-router typegen` then `tsc --noEmit`).
- Tests run with `npx vitest` (config in `vitest.config.ts`, auto-loads `test/setupTests.ts` with Testing Library helpers).

## Routing & Layouts
- Routes are generated from `src/app/**/page.jsx` by `src/app/routes.ts`; create new folders with `page.jsx` for pages and optional `layout.jsx` for wrappers.
- Dynamic segments follow `[id]`, optional `[[id]]`, and catch-all `[...slug]`; the route builder converts these to React Router path params.
- The custom `layoutWrapperPlugin` nests every page inside the closest `layout.jsx` files; layouts must export a component to be picked up.
- A wildcard not-found boundary lives at `src/app/__create/not-found.tsx` and is appended automatically.

## Data & APIs
- Client data fetching goes through React Query hooks under `src/hooks`; mutations always invalidate relevant queries (`useExpenseManagement`, `useStockManagement`).
- API endpoints live in `src/app/api/**/route.js`; each exports HTTP verbs and is registered with Hono via `__create/route-builder.ts`, which injects `params` and supports hot reload.
- Database access uses the tagged template `sql` from `src/app/api/utils/sql.js`, backed by Neon (`@neondatabase/serverless`); wrap new calls in try/catch and surface helpful JSON errors.
- Shared API helpers (file upload proxy, generic `create.db`) exist under `src/app/api/utils`; prefer these over rolling external calls.
- `src/app/api/utils/sql.js` also exports `logStockTransaction`, which inserts into the `stock_transactions` ledger. Call it for any server-side flow that changes stock quantities (e.g., purchases, future adjustments).

- Components live in `src/components` with feature subfolders (e.g., `Dashboard/*`); most files start with `'use client'` to stay on the client graph.
- Tailwind utility classes provide layout/styling; global tokens live in `src/app/global.css` and `src/index.css`.
- Dashboard flow (`Dashboard.jsx`) orchestrates tabs, consuming React Query hooks for reports/stock/expenses; mirror that pattern for new dashboard areas.
- Third-party integrations are wrapped in `src/client-integrations/*` to stabilize their APIs; import from these wrappers instead of raw packages.
- `PurchaseStockForm` keeps prices in sync across units; a visible change in unit automatically adjusts the displayed unit cost while maintaining an internal base-unit price for storage.

## Auth & Env
- Auth context comes from `SessionProvider` (`@auth/create/react` alias) in `root.tsx`; client hooks (`src/utils/useAuth.js`) call `signIn`/`signOut` helpers.
- Do not edit `src/auth.js`; it bootstraps Create's internal auth and is treated as read-only glue.
- Required env: `AUTH_SECRET` (JWT), `AUTH_URL`, `DATABASE_URL`, optional `CORS_ORIGINS`; expose client-safe values via `NEXT_PUBLIC_*` (Vite forwards them).
- Server middleware in `__create/index.ts` adds CORS, request tracing, and proxies `/integrations/*`; align new routes with that infrastructure.

## Testing & QA
- Prefer render-level tests with `@testing-library/react`; setup already pulls in `jest-dom` assertions via `test/setupTests.ts`.
- When testing hooks that hit Fetch or Neon, mock `global.fetch` or the `sql` tag to avoid network/DB calls.
- Ensure new API handlers return `Response.json(...)` with meaningful status codes, mirroring existing handlers for consistency.
- For client features relying on React Query, cover loading/error states to match how `Dashboard` panes handle skeletons and toast notifications.
