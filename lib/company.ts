import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";

type MembershipRow = {
  company_id: number;
  role: string;
};

export async function getCompanyContext() {
  const supabase = await createClient();
  const { data: claims, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claims?.claims?.sub;
  if (claimsError || !userId) {
    return {
      supabase,
      userId: null,
      companyId: null,
      role: null,
    };
  }

  const db = getDb();
  const member = await db
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
    return {
      supabase,
      userId,
      companyId: null,
      role: null,
    };
  }

  return {
    supabase,
    userId,
    companyId: Number(member.company_id),
    role: member.role,
  };
}
