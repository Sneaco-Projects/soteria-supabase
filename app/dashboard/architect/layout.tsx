import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export default async function ArchitectLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profile?.role !== "architect") {
    redirect(`/dashboard/${profile?.role ?? "warden"}`);
  }

  return <>{children}</>;
}
