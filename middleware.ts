import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function middleware(request: NextRequest) {
  // Single-user local mode is safe only when the server binds to 127.0.0.1.
  // No remote auth calls are made in this mode.
  if (process.env.LOCAL_MODE === "true") {
    if (request.nextUrl.pathname === "/login" || request.nextUrl.pathname.startsWith("/auth/")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
