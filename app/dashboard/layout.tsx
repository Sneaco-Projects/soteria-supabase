// /app/dashboard/layout.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Heart, Home, Users, ChevronLeft, ChevronRight } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const router = useRouter();

  // If someone hits /dashboard directly, send them to the homepage
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname === "/dashboard") {
      router.replace("/");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen z-50 transition-all duration-200 ease-in-out",
          "bg-white/90 backdrop-blur-lg border-r border-emerald-200 shadow-sm",
          open ? "w-64" : "w-16"
        )}
      >
        {/* Brand + toggle */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-emerald-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            {open && <span className="font-semibold text-gray-800">SOTERIA</span>}
          </Link>
          <button
            aria-label="Toggle sidebar"
            onClick={() => setOpen((v) => !v)}
            className="p-1 rounded-md hover:bg-emerald-50 text-gray-700"
          >
            {open ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="mt-2 px-1">
          {/* Overview now goes to the homepage */}
          <SideLink href="/" icon={<Home className="w-4 h-4" />} open={open} label="Overview" />
          <SideLink href="/dashboard/warden" icon={<Users className="w-4 h-4" />} open={open} label="Warden" />
        </nav>
      </aside>

      {/* Main content */}
      <main className={cn("transition-all duration-200", open ? "ml-64" : "ml-16")}>
        <div className="h-4" />
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

function SideLink({
  href,
  icon,
  label,
  open,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  open: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700",
        "mx-2 my-1"
      )}
    >
      <span className="shrink-0">{icon}</span>
      {open && <span className="truncate">{label}</span>}
    </Link>
  );
}
