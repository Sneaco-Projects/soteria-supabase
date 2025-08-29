"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase-client";

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      router.push("/");     // back to site pages
      router.refresh();     // re-render navbar state
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
