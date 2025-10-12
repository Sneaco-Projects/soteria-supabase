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
        throw error;
      }
      // Clear any cached data and redirect
      window.location.href = "/"; // Hard redirect to ensure complete cleanup
    } catch (error) {
      console.error("Sign out failed:", error);
      // Still redirect even if there's an error to prevent stuck state
      window.location.href = "/";
    } finally {
      setLoading(false);
    }
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
