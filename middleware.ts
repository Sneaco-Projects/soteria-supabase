import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const { data: { session } } = await supabase.auth.getSession();
  const path = req.nextUrl.pathname;

  // Public paths that don't need auth
  const publicPaths = ["/", "/auth", "/api"];
  if (publicPaths.some((p) => path === p || path.startsWith(p))) {
    return res;
  }

  if (!session) {
    const login = new URL("/login", req.url);
    login.searchParams.set("redirect", path);
    return NextResponse.redirect(login);
  }

  // Look up user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  const role = profile?.role; // "warden" | "provider" | "architect"

  // Redirect /dashboard to the user's role-specific dashboard
  if (path === "/dashboard") {
    return NextResponse.redirect(new URL(`/dashboard/${role ?? "warden"}`, req.url));
  }

  // Hard blocks by namespace - prevent role access to wrong dashboards
  if (path.startsWith("/dashboard/architect") && role !== "architect") {
    return NextResponse.redirect(new URL(`/dashboard/${role ?? "warden"}`, req.url));
  }
  if (path.startsWith("/dashboard/warden") && role !== "warden") {
    return NextResponse.redirect(new URL(`/dashboard/${role ?? "warden"}`, req.url));
  }
  if (path.startsWith("/dashboard/provider") && role !== "provider") {
    return NextResponse.redirect(new URL(`/dashboard/${role ?? "warden"}`, req.url));
  }

  return res;
}

export const config = {
  // protect everything except Next assets
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
