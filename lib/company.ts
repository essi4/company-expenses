import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";

type MembershipRow = {
  company_id: number;
  role: string;
};

export async function getCompanyContext() {
  // Local mode is intended for a single-user app bound to 127.0.0.1 in Termux.
  // It avoids network authentication and never contacts Supabase.
  if (process.env.LOCAL_MODE === "true") {
    const db = getDb();
    const company = await db
      .prepare("SELECT id FROM companies WHERE id = 1 LIMIT 1")
      .first<{ id: number }>();

    return {
      supabase: null as any,
      userId: "local-user",
      companyId: company ? Number(company.id) : null,
      role: "owner",
    };
  }

  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;

  if (claimsError || !userId) {
    return { supabase, userId: null, companyId: null, role: null };
  }

  const member = await getDb()
    .prepare(
      `SELECT company_id, role
       FROM company_members
       WHERE user_id = ?
       ORDER BY created_at ASC
       LIMIT 1`
    )
    .bind(userId)
    .first<MembershipRow>();

  if (!member) {
    return { supabase, userId, companyId: null, role: null };
  }

  return {
    supabase,
    userId,
    companyId: Number(member.company_id),
    role: member.role,
  };
}
