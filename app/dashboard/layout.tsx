"use client";

import { useState } from "react";
import Sidebar from "./_components/Sidebar";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <Sidebar open={open} />
      <button
        aria-label="Toggle sidebar"
        onClick={() => setOpen((v) => !v)}
        className="fixed top-2 left-2 z-50 p-1 rounded-md hover:bg-emerald-50 text-gray-700 bg-white/70"
      >
        {open ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>
      <main className={cn("transition-all duration-200", open ? "ml-64" : "ml-16")}>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
