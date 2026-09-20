# Integration Harness

## Scope
1. Migration static integrity: stage tables and RLS anchors.
2. Pipeline integration: 138→150 order and execution.
3. Auth/API contract: Control Center requires Supabase user and health endpoint exists.
4. Live Supabase integration: run only when EASY staging credentials are available.

## Required staging variables
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SERVICE_ROLE_KEY (CI secret only; never expose to browser)
- EASY_STAGING_DATABASE_URL (CI secret only)

The harness intentionally refuses to target production URLs in CI.