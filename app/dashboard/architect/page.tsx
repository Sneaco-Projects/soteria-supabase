"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

import { CheckCircle, AlertTriangle, Link2 } from "lucide-react";

type ProviderRow = { user_id: string; display_name: string | null; active: boolean; created_at: string };
type ProfileRow  = { id: string; email: string; display_name: string | null };
type SentinelRow = { id: string; full_name: string };
type DeviceRow   = { id: string; model: string | null; sentinel_id: string | null };
type DeviceOverview = { device_id: string; hw_uid: string; model: string | null; sentinel_name: string | null; last_seen_at: string | null; latest_event_type: string | null };

export default function ArchitectDashboard() {
  const router = useRouter();

  // ----- CLIENT GUARD (static-export friendly) -----
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (prof?.role !== "architect") {
        router.replace(`/dashboard/${prof?.role ?? "warden"}`);
      }
    })();
  }, [router]);

  // modals
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // tabs
  const [tab, setTab] = useState<"providers" | "assignments" | "devices">("providers");

  // Providers tab
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, ProfileRow>>({});
  const [promoteEmail, setPromoteEmail] = useState("");

  // Assignments tab
  const [activeProviders, setActiveProviders] = useState<ProviderRow[]>([]);
  const [sentinels, setSentinels] = useState<SentinelRow[]>([]);
  const [assignProviderId, setAssignProviderId] = useState("");
  const [assignSentinelId, setAssignSentinelId] = useState("");
  const [assignments, setAssignments] = useState<{ provider_id: string; sentinel_id: string }[]>([]);
  const [devicesForAssign, setDevicesForAssign] = useState<DeviceRow[]>([]);
  const [assignByDeviceId, setAssignByDeviceId] = useState("");

  // Devices tab
  const [devices, setDevices] = useState<DeviceOverview[]>([]);

  // Load data
  const loadProviders = async () => {
    const { data: provs, error } = await supabase
      .from("providers")
      .select("user_id, display_name, active, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;

    setProviders(provs ?? []);
    const ids = (provs ?? []).map(p => p.user_id);
    if (ids.length) {
      const { data: profs, error: pErr } = await supabase
        .from("profiles")
        .select("id, email, display_name")
        .in("id", ids);
      if (pErr) throw pErr;
      const map: Record<string, ProfileRow> = {};
      (profs ?? []).forEach(pr => { map[pr.id] = pr; });
      setProfilesById(map);
    } else setProfilesById({});
  };

  const loadAssignments = async () => {
    const [
      { data: actProvs, error: aErr },
      { data: sens, error: sErr },
      { data: asg, error: asgErr },
      { data: devs, error: dErr },
    ] = await Promise.all([
      supabase.from("providers").select("user_id, display_name, active, created_at").eq("active", true),
      supabase.from("sentinels").select("id, full_name").order("full_name"),
      supabase.from("provider_assignments").select("provider_id, sentinel_id"),
      supabase.from("devices").select("id, model, sentinel_id").order("id", { ascending: true }),
    ]);
    if (aErr) throw aErr; if (sErr) throw sErr; if (asgErr) throw asgErr; if (dErr) throw dErr;
    setActiveProviders(actProvs ?? []);
    setSentinels(sens ?? []);
    setAssignments(asg ?? []);
    setDevicesForAssign(devs ?? []);
  };

  const loadDevices = async () => {
    const { data, error } = await supabase
      .from("v_architect_device_overview")
      .select("*")
      .order("last_seen_at", { ascending: false });
    if (error) throw error;
    setDevices(data ?? []);
  };

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([loadProviders(), loadAssignments(), loadDevices()]);
      } catch (e: any) {
        setErrorMsg(e?.message ?? "Failed to load data.");
      }
    })();
  }, []);

  // Promote provider by email
  const promote = async () => {
    try {
      const email = promoteEmail.trim().toLowerCase();
      if (!email) throw new Error("Enter the user’s email to promote.");
      const { data: prof, error: pErr } = await supabase
        .from("profiles")
        .select("id, email, display_name")
        .eq("email", email)
        .maybeSingle();
      if (pErr) throw pErr;
      if (!prof) throw new Error("No account with that email. Ask them to sign up first.");
      const { error: insErr } = await supabase.from("providers").upsert({
        user_id: prof.id,
        display_name: prof.display_name ?? null,
        active: true,
      });
      if (insErr) throw insErr;
      setPromoteEmail("");
      setSuccessMsg("Provider promoted/activated.");
      await Promise.all([loadProviders(), loadAssignments()]);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to promote provider.");
    }
  };

  const toggleProvider = async (user_id: string, current: boolean) => {
    try {
      const { error } = await supabase.from("providers").update({ active: !current }).eq("user_id", user_id);
      if (error) throw error;
      setSuccessMsg(`Provider ${!current ? "activated" : "deactivated"}.`);
      await Promise.all([loadProviders(), loadAssignments()]);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to update provider.");
    }
  };

  const assign = async () => {
    try {
      if (!assignProviderId || !assignSentinelId) throw new Error("Choose a provider and a sentinel.");
      const { error } = await supabase.from("provider_assignments").insert({
        provider_id: assignProviderId,
        sentinel_id: assignSentinelId,
      });
      if (error) throw error;
      setAssignProviderId("");
      setAssignSentinelId("");
      setSuccessMsg("Assigned provider to sentinel.");
      await loadAssignments();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to assign.");
    }
  };

  const assignByDevice = async () => {
    try {
      if (!assignProviderId || !assignByDeviceId) throw new Error("Choose a provider and a device.");
      const dev = devicesForAssign.find(d => d.id === assignByDeviceId);
      if (!dev?.sentinel_id) throw new Error("Selected device has no sentinel assigned yet.");
      const { error } = await supabase.from("provider_assignments").insert({
        provider_id: assignProviderId,
        sentinel_id: dev.sentinel_id,
      });
      if (error) throw error;
      setAssignProviderId("");
      setAssignByDeviceId("");
      setSuccessMsg("Assigned provider to device’s sentinel.");
      await loadAssignments();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to assign by device.");
    }
  };

  const unassign = async (provider_id: string, sentinel_id: string) => {
    try {
      const { error } = await supabase
        .from("provider_assignments")
        .delete()
        .eq("provider_id", provider_id)
        .eq("sentinel_id", sentinel_id);
      if (error) throw error;
      setSuccessMsg("Unassigned.");
      await loadAssignments();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to unassign.");
    }
  };

  const bySentinel = useMemo(() => {
    const map: Record<string, string[]> = {};
    assignments.forEach(a => { map[a.sentinel_id] ??= []; map[a.sentinel_id].push(a.provider_id); });
    return map;
  }, [assignments]);

  return (
    <>
      {/* Error Modal */}
      <AlertDialog open={!!errorMsg} onOpenChange={(open) => !open && setErrorMsg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" /> Something went wrong
            </AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-wrap">{errorMsg}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorMsg(null)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Modal */}
      <AlertDialog open={!!successMsg} onOpenChange={(open) => !open && setSuccessMsg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" /> Success
            </AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-wrap">{successMsg}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setSuccessMsg(null)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="p-6 relative z-10">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="space-y-6">
            <TabsList className="bg-white/80 backdrop-blur-lg border border-emerald-200">
              <TabsTrigger value="providers">Providers</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              <TabsTrigger value="devices">Devices</TabsTrigger>
            </TabsList>

            {/* Providers tab – keep your existing content here */}

            {/* Assignments tab – keep your existing content here */}

            {/* Devices tab */}
            <TabsContent value="devices">
              <Card className="bg-white/90 backdrop-blur-lg border-emerald-200 shadow-lg">
                <CardHeader>
                  <CardTitle>All Devices</CardTitle>
                  <CardDescription>Architect can view every device and open detailed logs.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {devices.map((d) => (
                    <Card key={d.device_id} className="border-emerald-100 bg-white/80">
                      <CardContent className="py-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-800">
                            {d.hw_uid} {d.model ? `(${d.model})` : ""}
                          </div>
                          <div className="text-sm text-gray-600">
                            Sentinel: {d.sentinel_name ?? "—"} • Last seen: {d.last_seen_at ? new Date(d.last_seen_at).toLocaleString() : "—"} • Last event: {d.latest_event_type ?? "—"}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/dashboard/architect/devices/view?id=${d.device_id}`)}
                        >
                          View details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  {devices.length === 0 && (
                    <Card className="border-emerald-100 bg-white/70">
                      <CardContent className="py-6 text-gray-600">No devices yet.</CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
