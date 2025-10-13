// components/site/navbar.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase-client";

type Role = "architect" | "provider" | "warden" | "guardian" | null;

function getDashboardPath(role: Role) {
  if (role === "architect") return "/dashboard/architect";
  if (role === "provider") return "/dashboard/provider";
  if (role === "warden" || role === "guardian") return "/dashboard/warden"; // Handle legacy guardian role
  return "/dashboard/warden"; // Default fallback
}

export default function Navbar() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const user = auth?.user ?? null;

        if (!mounted) return;

        if (!user) {
          setRole(null);
          setEmail(null);
          setLoading(false);
          return;
        }

        setEmail(user.email ?? null);

        // Read role from profiles (fallback to 'warden' if missing)
        const { data: prof } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (!mounted) return;
        
        let userRole = (prof?.role as Role) ?? "warden";
        // Handle legacy "guardian" role
        if (userRole === "guardian") {
          userRole = "warden";
        }
        setRole(userRole);
      } catch {
        // swallow — show signed-out state on error
        if (mounted) {
          setRole(null);
          setEmail(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const onSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
      }
      // Force a complete page refresh to clear all state
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out failed:", error);
      // Still redirect to ensure user isn't stuck
      window.location.href = "/";
    }
  };

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white/80 backdrop-blur-lg border border-emerald-200 rounded-full px-6 py-3 shadow-lg w-[min(100%,1100px)]">
      <div className="flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
            <Heart className="h-4 w-4 text-white" />
          </div>
          <span className="text-gray-800 font-bold">SOTERIA</span>
        </Link>

        {/* Center links (hide on small screens) */}
        <div className="hidden md:flex items-center space-x-6 text-gray-600">
          <Link href="/features" className="hover:text-emerald-600 transition-colors">
            Features
          </Link>
          <Link href="/how-it-works" className="hover:text-emerald-600 transition-colors">
            How It Works
          </Link>
          <Link href="/pricing" className="hover:text-emerald-600 transition-colors">
            Pricing
          </Link>
            <Link href="/about" className="hover:text-emerald-600 transition-colors">
            About
            </Link>
            <Link href="/contact" className="hover:text-emerald-600 transition-colors">
            Contact
            </Link>
            <Link href="/faq" className="hover:text-emerald-600 transition-colors">
            FAQ
            </Link>
            



        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Loading shimmer to avoid flicker */}
          {loading ? (
            <div className="h-9 w-40 rounded-full bg-emerald-100/60 animate-pulse" />
          ) : role ? (
            <>
              <Button
                variant="outline"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                onClick={() => router.push(getDashboardPath(role))}
              >
                Go to Dashboard
              </Button>
              <Button
                onClick={onSignOut}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
                title={email ?? undefined}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/signin">
                <Button variant="ghost" className="text-gray-600 hover:bg-emerald-50">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-0 text-white">
                  Get Protected
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
