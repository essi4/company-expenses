import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: {
      getAll(_keyHints: string[]) { return request.cookies.getAll(); },
      setAll(cookiesToSet: any[], headers: Record<string,string>) {
        cookiesToSet.forEach(({name,value}:any)=>request.cookies.set(name,value));
        response=NextResponse.next({request});
        cookiesToSet.forEach(({name,value,options}:any)=>response.cookies.set(name,value,options));
        Object.entries(headers||{}).forEach(([key,value])=>response.headers.set(key,value));
      }
    }}
  );
  const { data } = await supabase.auth.getClaims();
  const isPublic=request.nextUrl.pathname.startsWith("/login")||request.nextUrl.pathname.startsWith("/auth/")||request.nextUrl.pathname.startsWith("/_next/")||request.nextUrl.pathname==="/favicon.ico";
  if(!data?.claims&&!isPublic){const url=request.nextUrl.clone();url.pathname="/login";url.searchParams.set("next",request.nextUrl.pathname);return NextResponse.redirect(url)}
  if(data?.claims&&request.nextUrl.pathname==="/login"){const url=request.nextUrl.clone();url.pathname="/";url.search="";return NextResponse.redirect(url)}
  return response;
}
