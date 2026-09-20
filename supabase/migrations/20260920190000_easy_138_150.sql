begin;

-- EASY 138: Marketplace
create table if not exists public.marketplace_apps (
 id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null,
 publisher_id uuid, category text, status text not null default 'DRAFT',
 pricing_model text not null default 'FREE', metadata jsonb not null default '{}',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.marketplace_app_versions (
 id uuid primary key default gen_random_uuid(), app_id uuid not null references public.marketplace_apps(id) on delete cascade,
 version text not null, manifest jsonb not null default '{}', status text not null default 'DRAFT',
 published_at timestamptz, unique(app_id,version)
);
create table if not exists public.marketplace_installations (
 id uuid primary key default gen_random_uuid(), app_id uuid not null references public.marketplace_apps(id) on delete cascade,
 business_id uuid not null, version_id uuid references public.marketplace_app_versions(id),
 status text not null default 'ACTIVE', installed_at timestamptz not null default now(), unique(app_id,business_id)
);
create table if not exists public.marketplace_entitlements (
 id uuid primary key default gen_random_uuid(), app_id uuid not null references public.marketplace_apps(id) on delete cascade,
 business_id uuid not null, feature_key text not null, expires_at timestamptz,
 unique(app_id,business_id,feature_key)
);

-- EASY 139: AI
create table if not exists public.ai_models (
 id uuid primary key default gen_random_uuid(), provider text not null, model_key text not null,
 capabilities jsonb not null default '{}', status text not null default 'ACTIVE', unique(provider,model_key)
);
create table if not exists public.ai_agents (
 id uuid primary key default gen_random_uuid(), business_id uuid, name text not null,
 system_policy jsonb not null default '{}', status text not null default 'ACTIVE', created_at timestamptz not null default now()
);
create table if not exists public.ai_policies (
 id uuid primary key default gen_random_uuid(), scope text not null, policy_key text not null,
 rules jsonb not null default '{}', version integer not null default 1, enabled boolean not null default true,
 unique(scope,policy_key,version)
);
create table if not exists public.ai_runs (
 id uuid primary key default gen_random_uuid(), agent_id uuid references public.ai_agents(id) on delete set null,
 business_id uuid, model_id uuid references public.ai_models(id) on delete set null,
 intent jsonb not null default '{}', plan jsonb not null default '{}', status text not null default 'QUEUED',
 input_tokens integer, output_tokens integer, cost numeric(18,6), created_at timestamptz not null default now(), completed_at timestamptz
);
create table if not exists public.ai_tool_permissions (
 id uuid primary key default gen_random_uuid(), agent_id uuid references public.ai_agents(id) on delete cascade,
 tool_key text not null, allowed boolean not null default false, constraints jsonb not null default '{}', unique(agent_id,tool_key)
);

-- EASY 140: Governance
create table if not exists public.governance_policies (
 id uuid primary key default gen_random_uuid(), scope text not null, name text not null,
 version integer not null default 1, rules jsonb not null default '{}', status text not null default 'DRAFT',
 effective_at timestamptz, unique(scope,name,version)
);
create table if not exists public.governance_rules (
 id uuid primary key default gen_random_uuid(), policy_id uuid not null references public.governance_policies(id) on delete cascade,
 rule_key text not null, effect text not null check(effect in ('ALLOW','DENY','REQUIRE_APPROVAL','LOG')),
 priority integer not null default 100, config jsonb not null default '{}', unique(policy_id,rule_key)
);
create table if not exists public.governance_approvals (
 id uuid primary key default gen_random_uuid(), policy_id uuid references public.governance_policies(id) on delete set null,
 subject_type text not null, subject_id uuid, requested_by uuid, decided_by uuid,
 status text not null default 'PENDING', requested_at timestamptz not null default now(), decided_at timestamptz
);
create table if not exists public.governance_violations (
 id uuid primary key default gen_random_uuid(), business_id uuid, policy_id uuid references public.governance_policies(id) on delete set null,
 rule_key text, severity text not null default 'MEDIUM', details jsonb not null default '{}',
 created_at timestamptz not null default now(), resolved_at timestamptz
);

-- EASY 141: Identity
create table if not exists public.identity_providers (
 id uuid primary key default gen_random_uuid(), tenant_id uuid, type text not null, name text not null,
 config jsonb not null default '{}', status text not null default 'ACTIVE'
);
create table if not exists public.identity_sessions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null, tenant_id uuid,
 provider_id uuid references public.identity_providers(id), session_hash text not null unique,
 created_at timestamptz not null default now(), expires_at timestamptz not null, revoked_at timestamptz,
 ip_hash text, device_hash text
);
create table if not exists public.identity_roles (
 id uuid primary key default gen_random_uuid(), tenant_id uuid, name text not null,
 kind text not null default 'CUSTOM', permissions jsonb not null default '[]', unique(tenant_id,name)
);
create table if not exists public.identity_assignments (
 id uuid primary key default gen_random_uuid(), user_id uuid not null,
 role_id uuid not null references public.identity_roles(id) on delete cascade, business_id uuid,
 conditions jsonb not null default '{}', unique(user_id,role_id,business_id)
);
create table if not exists public.identity_access_logs (
 id uuid primary key default gen_random_uuid(), user_id uuid, business_id uuid, action text not null,
 resource text, decision text not null, reason_code text, created_at timestamptz not null default now()
);

-- EASY 142: Global Infrastructure
create table if not exists public.global_regions (
 id uuid primary key default gen_random_uuid(), code text unique not null, name text not null,
 status text not null default 'ACTIVE', residency_tags text[] not null default '{}'
);
create table if not exists public.tenant_region_assignments (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null unique,
 primary_region_id uuid not null references public.global_regions(id),
 secondary_region_id uuid references public.global_regions(id), residency_policy jsonb not null default '{}',
 updated_at timestamptz not null default now()
);
create table if not exists public.service_regions (
 id uuid primary key default gen_random_uuid(), service_key text not null,
 region_id uuid not null references public.global_regions(id), state text not null default 'ACTIVE',
 capacity_weight integer not null default 100, unique(service_key,region_id)
);
create table if not exists public.failover_policies (
 id uuid primary key default gen_random_uuid(), service_key text unique not null, rules jsonb not null default '{}',
 auto_failover boolean not null default false, recovery_objective_seconds integer
);
create table if not exists public.routing_decisions (
 id uuid primary key default gen_random_uuid(), tenant_id uuid, service_key text not null,
 chosen_region_id uuid references public.global_regions(id), reason_code text not null, created_at timestamptz not null default now()
);

-- EASY 143: Data
create table if not exists public.data_sources (
 id uuid primary key default gen_random_uuid(), source_key text unique not null, kind text not null,
 config jsonb not null default '{}', status text not null default 'ACTIVE'
);
create table if not exists public.data_dimensions (
 id uuid primary key default gen_random_uuid(), dimension_key text not null, value text not null, unique(dimension_key,value)
);
create table if not exists public.data_facts (
 id bigserial primary key, fact_date date not null, tenant_id uuid, business_id uuid, metric_key text not null,
 dimension_json jsonb not null default '{}', value_numeric numeric(24,8), value_text text,
 source_id uuid references public.data_sources(id)
);
create table if not exists public.semantic_metrics (
 id uuid primary key default gen_random_uuid(), metric_key text unique not null, display_name text not null,
 definition_sql text not null, grain text not null, owner_scope text not null, status text not null default 'ACTIVE'
);
create table if not exists public.analytics_jobs (
 id uuid primary key default gen_random_uuid(), job_key text unique not null, schedule text,
 config jsonb not null default '{}', status text not null default 'ACTIVE', last_run_at timestamptz, next_run_at timestamptz
);

-- EASY 144: Developer Platform
create table if not exists public.developer_apps (
 id uuid primary key default gen_random_uuid(), owner_user_id uuid, business_id uuid, name text not null,
 status text not null default 'ACTIVE', redirect_uris text[] not null default '{}', scopes text[] not null default '{}'
);
create table if not exists public.api_keys (
 id uuid primary key default gen_random_uuid(), developer_app_id uuid not null references public.developer_apps(id) on delete cascade,
 key_prefix text not null, key_hash text not null unique, created_at timestamptz not null default now(),
 expires_at timestamptz, revoked_at timestamptz
);
create table if not exists public.api_versions (
 id uuid primary key default gen_random_uuid(), version text unique not null,
 status text not null default 'ACTIVE', sunset_at timestamptz, changelog text
);
create table if not exists public.api_usage_daily (
 id uuid primary key default gen_random_uuid(), usage_date date not null,
 developer_app_id uuid references public.developer_apps(id) on delete cascade,
 endpoint text not null, requests bigint not null default 0, errors bigint not null default 0,
 latency_ms_p95 numeric(12,3), unique(usage_date,developer_app_id,endpoint)
);
create table if not exists public.sdk_releases (
 id uuid primary key default gen_random_uuid(), language text not null, version text not null,
 artifact_uri text not null, checksum text, status text not null default 'PUBLISHED',
 published_at timestamptz, unique(language,version)
);

-- EASY 145: Billing / Monetization
create table if not exists public.monetization_plans (
 id uuid primary key default gen_random_uuid(), plan_key text unique not null, name text not null,
 currency text not null default 'IRR', billing_interval text not null default 'MONTH',
 base_price numeric(18,2) not null default 0, included jsonb not null default '{}', status text not null default 'ACTIVE'
);
create table if not exists public.monetization_subscriptions (
 id uuid primary key default gen_random_uuid(), business_id uuid not null,
 plan_id uuid not null references public.monetization_plans(id), status text not null default 'ACTIVE',
 started_at timestamptz not null default now(), renews_at timestamptz, canceled_at timestamptz
);
create table if not exists public.monetization_meters (
 id uuid primary key default gen_random_uuid(), meter_key text unique not null, unit text not null, aggregation text not null
);
create table if not exists public.monetization_usage_events (
 id uuid primary key default gen_random_uuid(), business_id uuid not null,
 meter_id uuid not null references public.monetization_meters(id), quantity numeric(24,8) not null,
 idempotency_key text not null unique, occurred_at timestamptz not null default now()
);
create table if not exists public.monetization_invoices (
 id uuid primary key default gen_random_uuid(), business_id uuid not null,
 subscription_id uuid references public.monetization_subscriptions(id), number text unique not null,
 subtotal numeric(18,2) not null default 0, tax numeric(18,2) not null default 0, total numeric(18,2) not null default 0,
 status text not null default 'DRAFT', issued_at timestamptz, due_at timestamptz, paid_at timestamptz
);
create table if not exists public.platform_ledger_entries (
 id uuid primary key default gen_random_uuid(), business_id uuid, entry_type text not null,
 amount numeric(18,2) not null, currency text not null default 'IRR', reference_type text, reference_id uuid,
 created_at timestamptz not null default now()
);

-- EASY 146: Partner Economy
create table if not exists public.partner_accounts (
 id uuid primary key default gen_random_uuid(), name text not null, status text not null default 'ACTIVE',
 payout_profile jsonb not null default '{}'
);
create table if not exists public.partner_commissions (
 id uuid primary key default gen_random_uuid(), partner_id uuid not null references public.partner_accounts(id) on delete cascade,
 app_id uuid, business_id uuid, gross_amount numeric(18,2) not null, commission_rate numeric(8,4) not null,
 commission_amount numeric(18,2) not null, status text not null default 'PENDING', created_at timestamptz not null default now()
);
create table if not exists public.partner_settlements (
 id uuid primary key default gen_random_uuid(), partner_id uuid not null references public.partner_accounts(id) on delete cascade,
 period_start date not null, period_end date not null, gross_amount numeric(18,2) not null default 0,
 commission_amount numeric(18,2) not null default 0, payable_amount numeric(18,2) not null default 0,
 status text not null default 'OPEN', unique(partner_id,period_start,period_end)
);
create table if not exists public.partner_payouts (
 id uuid primary key default gen_random_uuid(), settlement_id uuid not null references public.partner_settlements(id) on delete cascade,
 amount numeric(18,2) not null, status text not null default 'QUEUED', provider_ref text, paid_at timestamptz
);
create table if not exists public.marketplace_revenue_shares (
 id uuid primary key default gen_random_uuid(), app_id uuid, publisher_partner_id uuid references public.partner_accounts(id),
 platform_rate numeric(8,4) not null, publisher_rate numeric(8,4) not null, effective_at timestamptz not null default now()
);

-- EASY 147: Reliability / DR
create table if not exists public.slo_policies (
 id uuid primary key default gen_random_uuid(), service_key text unique not null, availability_target numeric(8,5),
 latency_target_ms integer, error_budget_minutes numeric(18,4), enabled boolean not null default true
);
create table if not exists public.platform_incidents (
 id uuid primary key default gen_random_uuid(), service_key text, severity text not null, title text not null,
 status text not null default 'OPEN', started_at timestamptz not null default now(), resolved_at timestamptz, summary text
);
create table if not exists public.platform_backups (
 id uuid primary key default gen_random_uuid(), backup_key text unique not null, storage_uri text not null,
 created_at timestamptz not null default now(), size_bytes bigint, checksum text, status text not null default 'AVAILABLE'
);
create table if not exists public.restore_points (
 id uuid primary key default gen_random_uuid(), backup_id uuid references public.platform_backups(id),
 point_at timestamptz not null, state text not null default 'READY', metadata jsonb not null default '{}'
);
create table if not exists public.dr_runs (
 id uuid primary key default gen_random_uuid(), policy_key text not null, source_region text, target_region text,
 status text not null default 'PLANNED', started_at timestamptz, completed_at timestamptz, result jsonb not null default '{}'
);

-- EASY 148: Security Operations
create table if not exists public.security_findings (
 id uuid primary key default gen_random_uuid(), source text not null, finding_key text not null, severity text not null,
 asset_type text, asset_id uuid, details jsonb not null default '{}', status text not null default 'OPEN',
 first_seen_at timestamptz not null default now(), resolved_at timestamptz, unique(source,finding_key)
);
create table if not exists public.security_detections (
 id uuid primary key default gen_random_uuid(), rule_key text unique not null, severity text not null,
 enabled boolean not null default true, config jsonb not null default '{}'
);
create table if not exists public.security_incidents (
 id uuid primary key default gen_random_uuid(), severity text not null, title text not null, status text not null default 'OPEN',
 detected_at timestamptz not null default now(), resolved_at timestamptz, summary text
);
create table if not exists public.security_playbooks (
 id uuid primary key default gen_random_uuid(), playbook_key text unique not null, steps jsonb not null default '[]', enabled boolean not null default true
);
create table if not exists public.security_evidence (
 id uuid primary key default gen_random_uuid(), incident_id uuid references public.security_incidents(id) on delete cascade,
 evidence_type text not null, storage_uri text, content_hash text, collected_at timestamptz not null default now()
);

-- EASY 149: Control Plane
create table if not exists public.control_plane_actions (
 id uuid primary key default gen_random_uuid(), action_key text not null, target_type text not null, target_id uuid,
 actor_id uuid, request_id text not null unique, status text not null default 'QUEUED',
 payload jsonb not null default '{}', created_at timestamptz not null default now(), completed_at timestamptz
);
create table if not exists public.feature_rollouts (
 id uuid primary key default gen_random_uuid(), feature_key text unique not null, strategy text not null default 'ALL',
 percentage integer not null default 100 check(percentage between 0 and 100), allowlist jsonb not null default '[]', status text not null default 'ACTIVE'
);
create table if not exists public.tenant_flags (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, flag_key text not null, enabled boolean not null,
 reason text, updated_at timestamptz not null default now(), unique(tenant_id,flag_key)
);
create table if not exists public.admin_sessions (
 id uuid primary key default gen_random_uuid(), admin_user_id uuid not null, session_hash text not null unique,
 created_at timestamptz not null default now(), expires_at timestamptz not null, revoked_at timestamptz
);
create table if not exists public.admin_audit_events (
 id uuid primary key default gen_random_uuid(), admin_user_id uuid, action_key text not null, target_type text,
 target_id uuid, metadata jsonb not null default '{}', created_at timestamptz not null default now()
);

-- EASY 150: Architecture Lock
create table if not exists public.architecture_versions (
 id uuid primary key default gen_random_uuid(), version text unique not null, status text not null default 'LOCKED',
 released_at timestamptz, checksum text, manifest jsonb not null default '{}'
);
create table if not exists public.architecture_decisions (
 id uuid primary key default gen_random_uuid(), decision_key text unique not null, title text not null,
 decision text not null, rationale text, status text not null default 'ACCEPTED', created_at timestamptz not null default now()
);
create table if not exists public.architecture_change_requests (
 id uuid primary key default gen_random_uuid(), requested_by uuid, change_type text not null, summary text not null,
 impact jsonb not null default '{}', status text not null default 'DRAFT', approved_by uuid, approved_at timestamptz
);
create table if not exists public.architecture_lock_windows (
 id uuid primary key default gen_random_uuid(), starts_at timestamptz not null, ends_at timestamptz,
 mode text not null default 'LOCKED', reason text
);

-- RLS hardening: no public/anon policies are granted here.
do $$
declare r record;
begin
 for r in select tablename from pg_tables where schemaname='public' and tablename in (
 'marketplace_apps','marketplace_app_versions','marketplace_installations','marketplace_entitlements',
 'ai_models','ai_agents','ai_policies','ai_runs','ai_tool_permissions',
 'governance_policies','governance_rules','governance_approvals','governance_violations',
 'identity_providers','identity_sessions','identity_roles','identity_assignments','identity_access_logs',
 'global_regions','tenant_region_assignments','service_regions','failover_policies','routing_decisions',
 'data_sources','data_dimensions','data_facts','semantic_metrics','analytics_jobs',
 'developer_apps','api_keys','api_versions','api_usage_daily','sdk_releases',
 'monetization_plans','monetization_subscriptions','monetization_meters','monetization_usage_events','monetization_invoices','platform_ledger_entries',
 'partner_accounts','partner_commissions','partner_settlements','partner_payouts','marketplace_revenue_shares',
 'slo_policies','platform_incidents','platform_backups','restore_points','dr_runs',
 'security_findings','security_detections','security_incidents','security_playbooks','security_evidence',
 'control_plane_actions','feature_rollouts','tenant_flags','admin_sessions','admin_audit_events',
 'architecture_versions','architecture_decisions','architecture_change_requests','architecture_lock_windows'
 ) loop execute format('alter table public.%I enable row level security',r.tablename); end loop;
end $$;

commit;