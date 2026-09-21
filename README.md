# Company Expenses

This is a [Next.js](https://nextjs.org) project.

## Getting Started

Run the development server:

```bash
npm run dev
```

Open http://localhost:3000.

## Cloudflare D1 migration workflow

The repository now contains a Wrangler D1 configuration scaffold and a versioned baseline migration.

### 1. Create the real D1 database

Authenticate Wrangler with the Cloudflare account that owns the database, then create the database:

```bash
npx wrangler@4.135.0 d1 create company-expenses
```

Keep the returned `database_id`. Do not run a remote migration before replacing the placeholder in `wrangler.jsonc`.

### 2. Enter the real UUID

Replace:

```text
__REPLACE_WITH_REAL_D1_UUID__
```

in `wrangler.jsonc` with the UUID returned by Cloudflare.

The `preview_database_id` is intentionally a local-only identifier. It is not a production database ID.

### 3. Test the migration locally

```bash
npm run d1:migrations:list:local
npm run d1:migrate:local
npm run d1:tables:local
```

The baseline schema is in `migrations/0001_init.sql`. It is derived from the current SQLite schema in `lib/db.ts` and includes the current `purchases` and `payments` columns.

### 4. Inspect remote state before applying

After authentication and after the real UUID is present:

```bash
npm run d1:migrations:list:remote
```

Review the output before applying anything remotely.

### 5. Apply to the remote D1 database

Only after local migration/testing is clean:

```bash
npm run d1:migrate:remote
```

Do not add ad-hoc production SQL; future schema changes should be new numbered migrations.

## Safety rules

- `main` is not used for D1 changes until the feature branch has been tested.
- Never commit Cloudflare API tokens or `.dev.vars` secrets.
- Never replace the UUID placeholder with a guessed or unrelated database ID.
- Remote migrations are an explicit final step after local verification.
