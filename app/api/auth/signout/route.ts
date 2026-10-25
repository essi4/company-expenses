import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSameOrigin } from "@/lib/security";

export async function POST(request: Request) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;

  if (process.env.LOCAL_MODE === "true") {
    return NextResponse.redirect(new URL("/", request.url), 303);
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url), 302);
}
