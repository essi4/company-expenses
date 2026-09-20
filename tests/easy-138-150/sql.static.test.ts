import {readFileSync} from "node:fs";import {resolve} from "node:path";import {describe,it,expect} from "vitest";
const sql=readFileSync(resolve(process.cwd(),"supabase/migrations/20260920190000_easy_138_150.sql"),"utf8");
const tables=["marketplace_apps","ai_models","governance_policies","identity_sessions","global_regions","data_facts","developer_apps","monetization_plans","partner_accounts","slo_policies","security_findings","control_plane_actions","architecture_versions"];
describe("EASY migration",()=>{
 it("contains all 13 stage anchors",()=>tables.forEach(t=>expect(sql).toContain("create table if not exists public."+t)));
 it("contains RLS hardening for the full stage table allowlist",()=>{
   expect(sql).toContain("alter table public.%I enable row level security");
   expect(sql).toContain("select tablename from pg_tables where schemaname='public'");
   expect(sql).toContain("architecture_lock_windows");
 });
});