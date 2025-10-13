import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const { data: { session } } = await supabase.auth.getSession();
  const path = req.nextUrl.pathname;

  // Public paths that don't need auth
  const publicPaths = ["/", "/auth/signin", "/auth/signup", "/auth/forgot-password", "/auth/reset-password", "/api", "/about", "/contact", "/faq", "/features", "/how-it-works", "/pricing"];
  if (publicPaths.some((p) => path === p || path.startsWith(p))) {
    return res;
  }

  if (!session) {
    const signin = new URL("/auth/signin", req.url);
    signin.searchParams.set("redirect", path);
    return NextResponse.redirect(signin);
  }

  // Look up user role with error handling
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Profile lookup error:", profileError);
    // Redirect to sign-in on profile error
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  let role = profile?.role;
  
  // Debug: Log role information
  console.log(`Middleware - Raw role from database: "${role}", type: ${typeof role}, user: ${session.user.id}`);
  console.log("Middleware - Profile data:", profile);
  
  // Handle legacy "guardian" role by treating it as "warden"
  if (role === "guardian") {
    role = "warden";
    console.log(`Converting legacy guardian role to warden for user: ${session.user.id}`);
  }
  
  console.log(`Middleware - Final role after conversion: "${role}"`);
  
  // If no role found, create default profile and redirect to warden dashboard
  if (!role) {
    console.warn("No role found for user:", session.user.id);
    return NextResponse.redirect(new URL("/dashboard/warden", req.url));
  }

  // Redirect /dashboard to the user's role-specific dashboard
  if (path === "/dashboard") {
    console.log(`Middleware - Redirecting /dashboard to /dashboard/${role}`);
    return NextResponse.redirect(new URL(`/dashboard/${role ?? "warden"}`, req.url));
  }

  // Hard blocks by namespace - prevent role access to wrong dashboards
  if (path.startsWith("/dashboard/architect") && role !== "architect") {
    console.log(`Blocking ${role} from accessing architect dashboard, redirecting to /dashboard/${role}`);
    return NextResponse.redirect(new URL(`/dashboard/${role}`, req.url));
  }
  if (path.startsWith("/dashboard/provider") && role !== "provider") {
    console.log(`Blocking ${role} from accessing provider dashboard, redirecting to /dashboard/${role}`);
    return NextResponse.redirect(new URL(`/dashboard/${role}`, req.url));
  }
  if (path.startsWith("/dashboard/warden") && role !== "warden") {
    console.log(`Blocking ${role} from accessing warden dashboard, redirecting to /dashboard/${role}`);
    return NextResponse.redirect(new URL(`/dashboard/${role}`, req.url));
  }

  // Additional security: block any other dashboard paths
  if (path.startsWith("/dashboard/") && !["architect", "provider", "warden"].includes(path.split("/")[2])) {
    console.log(`Blocking access to unknown dashboard path: ${path}, redirecting to /dashboard/${role}`);
    return NextResponse.redirect(new URL(`/dashboard/${role}`, req.url));
  }

  return res;
}

export const config = {
  // protect everything except Next assets
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
