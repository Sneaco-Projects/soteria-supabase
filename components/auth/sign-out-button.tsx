"use client";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";

export default function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();

  async function onSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert(error.message);
      return;
    }
    router.push("/"); // go to root (app/page.tsx)
  }

  return (
    <Button onClick={onSignOut} className={className}>
      Sign Out
    </Button>
  );
}



//import SignOutButton from "@/components/auth/sign-out-button";

//<SignOutButton className="mt-4" />