import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ControlCenterClient from "./control-center-client";

export const dynamic = "force-dynamic";

export default async function ControlCenterPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/control-center");
  return <ControlCenterClient userEmail={user.email ?? "Super Admin"} />;
}
