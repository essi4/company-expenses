import { createClient } from "@/lib/supabase/server";

export async function getCompanyContext() {
  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (claimsError || !userId) return { supabase, userId: null, companyId: null };

  const { data: member, error } = await supabase
    .from("company_members")
    .select("company_id, role")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !member) return { supabase, userId, companyId: null };
  return { supabase, userId, companyId: Number(member.company_id), role: member.role as string };
}
