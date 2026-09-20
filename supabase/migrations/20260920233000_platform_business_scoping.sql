begin;

-- Business-aware RLS for platform subsystems that carry business_id.
drop policy if exists marketplace_installations_auth on public.marketplace_installations;
create policy marketplace_installations_business_select on public.marketplace_installations
for select to authenticated using (private.is_super_admin() or private.has_business_access(business_id));
create policy marketplace_installations_business_write on public.marketplace_installations
for all to authenticated using (private.is_super_admin() or private.has_business_write(business_id))
with check (private.is_super_admin() or private.has_business_write(business_id));

drop policy if exists marketplace_entitlements_auth on public.marketplace_entitlements;
create policy marketplace_entitlements_business_select on public.marketplace_entitlements
for select to authenticated using (private.is_super_admin() or private.has_business_access(business_id));
create policy marketplace_entitlements_business_write on public.marketplace_entitlements
for all to authenticated using (private.is_super_admin()) with check (private.is_super_admin());

drop policy if exists ai_agents_auth on public.ai_agents;
create policy ai_agents_business_select on public.ai_agents
for select to authenticated using (private.is_super_admin() or (business_id is not null and private.has_business_access(business_id)));
create policy ai_agents_business_write on public.ai_agents
for all to authenticated using (private.is_super_admin() or (business_id is not null and private.has_business_write(business_id)))
with check (private.is_super_admin() or (business_id is not null and private.has_business_write(business_id)));

drop policy if exists ai_runs_auth on public.ai_runs;
create policy ai_runs_business_select on public.ai_runs
for select to authenticated using (private.is_super_admin() or (business_id is not null and private.has_business_access(business_id)));
create policy ai_runs_business_write on public.ai_runs
for insert to authenticated with check (private.is_super_admin() or (business_id is not null and private.has_business_write(business_id)));

drop policy if exists developer_apps_auth on public.developer_apps;
create policy developer_apps_business_select on public.developer_apps
for select to authenticated using (private.is_super_admin() or (business_id is not null and private.has_business_access(business_id)) or owner_user_id = auth.uid());
create policy developer_apps_business_insert on public.developer_apps
for insert to authenticated with check (
  private.is_super_admin()
  or owner_user_id = auth.uid()
  or (business_id is not null and private.has_business_write(business_id))
);
create policy developer_apps_business_update on public.developer_apps
for update to authenticated
using (private.is_super_admin() or owner_user_id = auth.uid() or (business_id is not null and private.has_business_write(business_id)))
with check (private.is_super_admin() or owner_user_id = auth.uid() or (business_id is not null and private.has_business_write(business_id)));
create policy developer_apps_business_delete on public.developer_apps
for delete to authenticated
using (private.is_super_admin() or owner_user_id = auth.uid() or (business_id is not null and private.has_business_write(business_id)));

drop policy if exists monetization_subscriptions_auth on public.monetization_subscriptions;
create policy monetization_subscriptions_select on public.monetization_subscriptions
for select to authenticated using (private.is_super_admin() or private.has_business_access(business_id));
create policy monetization_subscriptions_write on public.monetization_subscriptions
for all to authenticated using (private.is_super_admin()) with check (private.is_super_admin());

drop policy if exists monetization_usage_events_auth on public.monetization_usage_events;
create policy monetization_usage_events_select on public.monetization_usage_events
for select to authenticated using (private.is_super_admin() or private.has_business_access(business_id));
create policy monetization_usage_events_insert on public.monetization_usage_events
for insert to authenticated with check (private.is_super_admin() or private.has_business_write(business_id));

drop policy if exists monetization_invoices_auth on public.monetization_invoices;
create policy monetization_invoices_select on public.monetization_invoices
for select to authenticated using (private.is_super_admin() or private.has_business_access(business_id));
create policy monetization_invoices_write on public.monetization_invoices
for all to authenticated using (private.is_super_admin()) with check (private.is_super_admin());

drop policy if exists platform_ledger_entries_auth on public.platform_ledger_entries;
create policy platform_ledger_entries_business_select on public.platform_ledger_entries
for select to authenticated using (private.is_super_admin() or (business_id is not null and private.has_business_access(business_id)));
create policy platform_ledger_entries_business_write on public.platform_ledger_entries
for insert to authenticated with check (private.is_super_admin());

drop policy if exists partner_commissions_auth on public.partner_commissions;
create policy partner_commissions_business_select on public.partner_commissions
for select to authenticated using (private.is_super_admin() or (business_id is not null and private.has_business_access(business_id)));
create policy partner_commissions_business_write on public.partner_commissions
for all to authenticated using (private.is_super_admin()) with check (private.is_super_admin());

drop policy if exists data_facts_auth on public.data_facts;
create policy data_facts_business_select on public.data_facts
for select to authenticated using (private.is_super_admin() or (business_id is not null and private.has_business_access(business_id)));
create policy data_facts_business_insert on public.data_facts
for insert to authenticated with check (private.is_super_admin() or (business_id is not null and private.has_business_write(business_id)));

drop policy if exists identity_assignments_auth on public.identity_assignments;
create policy identity_assignments_business_select on public.identity_assignments
for select to authenticated using (private.is_super_admin() or (business_id is not null and private.has_business_access(business_id)));
create policy identity_assignments_business_write on public.identity_assignments
for all to authenticated using (private.is_super_admin() or (business_id is not null and private.has_business_write(business_id)))
with check (private.is_super_admin() or (business_id is not null and private.has_business_write(business_id)));

drop policy if exists identity_access_logs_auth on public.identity_access_logs;
create policy identity_access_logs_business_select on public.identity_access_logs
for select to authenticated using (private.is_super_admin() or (business_id is not null and private.has_business_access(business_id)));
create policy identity_access_logs_business_insert on public.identity_access_logs
for insert to authenticated with check (private.is_super_admin() or (business_id is not null and private.has_business_access(business_id)));

-- Service-generated/global platform data remains Super Admin-only until it receives an explicit business boundary.
drop policy if exists security_findings_auth on public.security_findings;
create policy security_findings_super_admin on public.security_findings for all to authenticated
using (private.is_super_admin()) with check (private.is_super_admin());

drop policy if exists security_detections_auth on public.security_detections;
create policy security_detections_super_admin on public.security_detections for all to authenticated
using (private.is_super_admin()) with check (private.is_super_admin());

commit;
