# Production Manager Dashboard

This project is a React Router v7 + Hono SSR application that delivers a production management dashboard backed by a PostgreSQL database.

## Prerequisites

- Node.js 18+
- PostgreSQL database (connection string exported as `DATABASE_URL`)
- Environment variables defined in `.env.development` or your shell (`AUTH_SECRET`, `AUTH_URL`, optional `CORS_ORIGINS`, etc.)

## Getting Started

1. **Install dependencies**
   ```powershell
   npm install
   ```

2. **Apply database migrations**
   ```powershell
   npm run migrate
   ```
   The migration set creates the authentication tables (`auth_users`, `auth_accounts`, `auth_sessions`, `auth_verification_token`), the `user_feature_flags` table, seed metadata used by the permission system, and the stock-unit conversion schema (`stock_units`, `stock_unit_conversions`, converted `stock`/`stock_purchases` columns).

3. **Seed an administrator account**
   ```powershell
   npm run seed
   ```
   By default this inserts an account:
   - Email: `admin@example.com`
   - Password: `ChangeMe123!`

   Override these with environment variables when running the seed:
   ```powershell
   $env:SEED_ADMIN_EMAIL="owner@yourdomain.com"; $env:SEED_ADMIN_PASSWORD="SuperSecret!"; npm run seed
   ```

4. **Start the dev server**
   ```powershell
   npm run dev
   ```
   The app serves on [http://localhost:4000](http://localhost:4000).

## Authentication & Permissions

- Credentials-based authentication is provided by `@auth/core` via `/account/signin` and `/account/logout` routes.
- Successful login establishes a JWT session that includes the user’s feature flags.
- The sidebar, dashboard tabs, reports, and quick actions all respect feature access (`user.features[featureKey] !== false`).
- Administrators (with the `users:manage` flag) can manage feature access from the **User Management** tab. Guardrails prevent removing their own admin access.

## Database Utilities

- `scripts/migrate.js` reads `db/migrations/*.sql` and tracks applied migrations in `schema_migrations`.
- `scripts/seed.js` provisions a credentials account and enables all default feature flags, ensuring the permission system works on first run.
- Runtime queries use the shared `sql` tagged helper in `src/app/api/utils/sql.js` backed by a `pg` pool.

## Frontend Notes

- `src/app/page.jsx` protects the dashboard route, redirecting unauthenticated users to `/account/signin`.
- `src/components/Sidebar.jsx` now binds to the signed-in user, filters navigation using feature flags, and performs logout with the auth client.
- `src/components/Dashboard.jsx` and related tab components consume the same `DASHBOARD_TABS` metadata to stay aligned with sidebar navigation.
- Stock management supports per-item unit conversions. `AddStockForm` now requires selecting catalogued units (e.g., boxes, crates) for both the base item and alternates, while `PurchaseStockForm` lets operators buy using any configured unit and previews the base quantity recorded.
- The Unit Catalog tab requires `units:view` for access; editing and deletion additionally need `units:manage`. Populate this catalog before adding stock so the forms can reference the shared `stock_units` entries.

## Testing & Type Safety

- Type checks: `npm run typecheck`
- Tests: `npx vitest`

## Next Steps

- Provide production-ready migrations (SQL diff) for existing environments before deploying.
- Review environment variable handling for production (secure cookies, HTTPS AUTH_URL, etc.).
- Expand the test suite to cover authentication flows and permission toggling.
