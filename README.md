# Company Expenses

This is a [Next.js](https://nextjs.org) application deployed to Cloudflare Workers.

## Runtime architecture

- **Cloudflare Workers + OpenNext** run the Next.js application.
- **Cloudflare D1** stores company and financial application data.
- **Supabase Auth** remains responsible for authentication and session cookies.
- **Supabase Storage** remains responsible for invoice images during the staged migration.
- The application resolves the authenticated user's company membership through D1 and scopes financial queries by `company_id`.

## Local development

Run the normal Next.js development server:

```bash
npm install
npm run dev
```

Cloudflare bindings are initialized for local development through OpenNext.

To validate the D1 schema locally:

```bash
npm run d1:verify:local
```

## Cloudflare Workers preview

Build and preview the app in the Workers runtime:

```bash
npm run preview
```

The production deploy command is deliberately separate:

```bash
npm run deploy
```

Do not run the production deploy until the feature branch, tests, D1 remote verification, and merge are complete.

## D1 migrations

The migration history is:

- `migrations/0001_init.sql` — original D1 baseline.
- `migrations/0002_d1_company_finance.sql` — complete company/finance schema used by the application.

List and apply locally:

```bash
npm run d1:migrations:list:local
npm run d1:migrate:local
```

Inspect remote state:

```bash
npm run d1:migrations:list:remote
```

Remote migrations are gated in GitHub Actions. The repository must contain the real D1 UUID and the Cloudflare GitHub secrets before a remote action can proceed.

## One-time Supabase → D1 data import

The application code no longer reads business data from Supabase, so existing business records must be copied to D1 before the final production cutover.

The importer is intentionally separate from schema migrations:

```bash
CONFIRM_D1_DATA_IMPORT=IMPORT-D1-DATA \
SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
CLOUDFLARE_ACCOUNT_ID=... \
CLOUDFLARE_API_TOKEN=... \
npm run d1:import:supabase
```

The importer upserts the current application tables and preserves their existing numeric IDs. It does not delete data from Supabase.

For GitHub Actions, use the dedicated manual workflow and store the credentials as encrypted repository secrets. Never commit service-role keys or generated SQL containing production data.

## Security and migration rules

- Work on a feature branch; do not modify `master` directly.
- Keep production D1 operations explicitly gated.
- Never commit Cloudflare API tokens, Supabase service-role keys, `.dev.vars`, or exported production data.
- Future schema changes must be additive numbered migrations.
- Production deployment happens only once after the feature branch is verified and merged.
