"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils"; // helper for conditional classNames
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";

type Role = "architect" | "warden" | "provider";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (data?.role) setRole(data.role as Role);
    })();
  }, []);

  const baseLinks = [{ name: "Overview", href: "/dashboard" }];

  const roleLinks: Record<Role, { name: string; href: string }[]> = {
    architect: [
      { name: "Providers", href: "/dashboard/architect" },
      { name: "Assignments", href: "/dashboard/architect?tab=assignments" },
      { name: "Devices", href: "/dashboard/architect?tab=devices" },
    ],
    warden: [
      { name: "Sentinels", href: "/dashboard/warden" },
    ],
    provider: [
      { name: "My Sentinels", href: "/dashboard/provider" },
    ],
  };

  const links = role ? [...baseLinks, ...(roleLinks[role] ?? [])] : baseLinks;

  return (
    <aside className="w-64 bg-white/80 backdrop-blur border-r border-emerald-100 min-h-screen p-4">
      <h2 className="text-lg font-semibold mb-4">Dashboard</h2>
      <nav className="space-y-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "block px-3 py-2 rounded-md text-gray-700 hover:bg-emerald-100",
              pathname === l.href && "bg-emerald-200 text-gray-900 font-medium"
            )}
          >
            {l.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
