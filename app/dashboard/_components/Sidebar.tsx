"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { cn } from "@/lib/utils";
import { Heart, Home, Users, Shield, LayoutDashboard } from "lucide-react";

type Role = "architect" | "provider" | "warden" | null;

export default function Sidebar({ open }: { open: boolean }) {
  const pathname = usePathname();
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      setRole(profile?.role ?? null);
    })();
  }, []);

  const links = getLinksForRole(role);

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-screen z-50 transition-all duration-200 ease-in-out",
        "bg-white/90 backdrop-blur-lg border-r border-emerald-200 shadow-sm",
        open ? "w-64" : "w-16"
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-emerald-100">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
          <Heart className="w-4 h-4 text-white" />
        </div>
        {open && <span className="font-semibold text-gray-800">SOTERIA</span>}
      </div>

      {/* Links */}
      <nav className="mt-2 px-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-emerald-50 hover:text-emerald-700 mx-2 my-1",
              pathname === l.href ? "bg-emerald-100 text-emerald-800 font-medium" : "text-gray-700"
            )}
          >
            <span className="shrink-0">{l.icon}</span>
            {open && <span className="truncate">{l.label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

function getLinksForRole(role: Role) {
  switch (role) {
    case "architect":
      return [
        { href: "/", label: "Overview", icon: <Home className="w-4 h-4" /> },
        { href: "/dashboard/architect", label: "Architect Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
      ];
    case "provider":
      return [
        { href: "/", label: "Overview", icon: <Home className="w-4 h-4" /> },
        { href: "/dashboard/provider", label: "Provider Dashboard", icon: <Users className="w-4 h-4" /> },
      ];
    case "warden":
      return [
        { href: "/", label: "Overview", icon: <Home className="w-4 h-4" /> },
        { href: "/dashboard/warden", label: "Warden Dashboard", icon: <Shield className="w-4 h-4" /> },
      ];
    default:
      return [
        { href: "/", label: "Overview", icon: <Home className="w-4 h-4" /> },
      ];
  }
}
