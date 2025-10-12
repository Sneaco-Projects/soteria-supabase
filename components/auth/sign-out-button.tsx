"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabaseBrowser.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
      }
      // Force a complete page refresh and redirect to clear all state
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out failed:", error);
      // Still redirect to ensure user isn't stuck in signed-in state
      window.location.href = "/";
    }
    // Note: finally block removed since window.location.href immediately navigates away
  };

  return (
    <Button
      onClick={signOut}
      variant="outline"
      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-transparent"
      disabled={loading}
    >
      {loading ? "Signing out…" : "Sign out"}
    </Button>
  );
}
