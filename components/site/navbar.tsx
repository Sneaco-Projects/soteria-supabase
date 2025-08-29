"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

type RoleState = "loading" | "none" | "warden" | "admin";

export default function Navbar() {
  const [role, setRole] = useState<RoleState>("loading");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setRole("none");

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const r = (data?.role as "admin" | "warden" | undefined) ?? "warden";
      setRole(r);
    })();
  }, []);

  const dashHref = role === "admin" ? "/dashboard/architect" : "/dashboard/warden";

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white/80 backdrop-blur-lg border border-emerald-200 rounded-full px-6 py-3 shadow-lg">
      <div className="flex items-center space-x-8">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
            <Heart className="h-4 w-4 text-white" />
          </div>
          <span className="text-gray-800 font-bold">SOTERIA</span>
        </Link>

        <div className="hidden md:flex items-center space-x-6 text-gray-600">
          <Link href="/features" className="hover:text-emerald-600 transition-colors">Features</Link>
          <Link href="/how-it-works" className="hover:text-emerald-600 transition-colors">How It Works</Link>
          <Link href="/pricing" className="hover:text-emerald-600 transition-colors">Pricing</Link>
        </div>

        <div className="flex items-center space-x-3">
          {role === "loading" && (
            <div className="h-9 w-36 rounded-full bg-emerald-100 animate-pulse" />
          )}

          {role === "none" && (
            <>
              <Link href="/auth/signin">
                <Button variant="ghost" className="text-gray-600 hover:bg-emerald-50">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-0 text-white">
                  Get Protected
                </Button>
              </Link>
            </>
          )}

          {role !== "loading" && role !== "none" && (
            <Link href={dashHref}>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-0 text-white">
                Go to Dashboard
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
