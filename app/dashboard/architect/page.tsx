"use client";

import { useEffect, useMemo, useState } from "react";
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

import { CheckCircle, AlertTriangle, Users, Link2 } from "lucide-react";

type ProviderRow = { user_id: string; display_name: string | null; active: boolean; created_at: string };
type ProfileRow  = { id: string; email: string; display_name: string | null };
type SentinelRow = { id: string; full_name: string };
type DeviceRow   = { id: string; model: string | null; sentinel_id: string | null };

export default function ArchitectDashboard() {
  // modals
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // tabs
  const [tab, setTab] = useState<"providers" | "assignments">("providers");

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

  // NEW: assign by device
  const [devicesForAssign, setDevicesForAssign] = useState<DeviceRow[]>([]);
  const [assignByDeviceId, setAssignByDeviceId] = useState("");

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
    } else {
      setProfilesById({});
    }
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
    if (aErr) throw aErr;
    if (sErr) throw sErr;
    if (asgErr) throw asgErr;
    if (dErr) throw dErr;

    setActiveProviders(actProvs ?? []);
    setSentinels(sens ?? []);
    setAssignments(asg ?? []);
    setDevicesForAssign(devs ?? []);
  };

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([loadProviders(), loadAssignments()]);
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

  // Toggle provider active
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

  // Make assignment (provider + sentinel)
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

  // NEW: assign by device (resolve sentinel automatically)
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

  // Remove assignment
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

  // derived: assignments grouped by sentinel
  const bySentinel = useMemo(() => {
    const map: Record<string, string[]> = {};
    assignments.forEach(a => {
      map[a.sentinel_id] ??= [];
      map[a.sentinel_id].push(a.provider_id);
    });
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
        {/* BG blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
        </div>

        <div className="p-6 relative z-10">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "providers" | "assignments")} className="space-y-6">
            <TabsList className="bg-white/80 backdrop-blur-lg border border-emerald-200">
              <TabsTrigger
                value="providers"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white"
              >
                Providers
              </TabsTrigger>
              <TabsTrigger
                value="assignments"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white"
              >
                Assignments
              </TabsTrigger>
            </TabsList>

            {/* Providers tab */}
            <TabsContent value="providers">
              <Card className="bg-white/90 backdrop-blur-lg border-emerald-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-gray-800">Healthcare Providers</CardTitle>
                  <CardDescription className="text-gray-600">Promote users and manage activation.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <Label>Email to promote</Label>
                      <Input
                        placeholder="provider@example.com"
                        value={promoteEmail}
                        onChange={(e) => setPromoteEmail(e.target.value)}
                        className="bg-white/80 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                    <Button onClick={promote} className="bg-emerald-600 hover:bg-emerald-700">Promote</Button>
                  </div>

                  <div className="grid gap-3">
                    {providers.length === 0 && (
                      <Card className="border-emerald-100 bg-white/70">
                        <CardContent className="py-6 text-gray-600">No providers yet.</CardContent>
                      </Card>
                    )}
                    {providers.map((p) => {
                      const prof = profilesById[p.user_id];
                      return (
                        <Card key={p.user_id} className="border-emerald-100 bg-white/80">
                          <CardContent className="py-4 flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-800">
                                {p.display_name || prof?.display_name || prof?.email || p.user_id}
                              </div>
                              <div className="text-sm text-gray-600">{prof?.email}</div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" onClick={() => toggleProvider(p.user_id, p.active)}>
                                {p.active ? "Deactivate" : "Activate"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assignments tab */}
            <TabsContent value="assignments">
              <Card className="bg-white/90 backdrop-blur-lg border-emerald-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-gray-800">Provider ↔ Sentinel Assignments</CardTitle>
                  <CardDescription className="text-gray-600">
                    Assign active providers to specific sentinels, or pick a device to auto-resolve its sentinel.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Provider + Sentinel */}
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <Label>Provider</Label>
                      <select
                        className="w-full border rounded-md p-2 bg-white/80 border-emerald-200"
                        value={assignProviderId}
                        onChange={(e) => setAssignProviderId(e.target.value)}
                      >
                        <option value="">Select provider</option>
                        {activeProviders.map((p) => (
                          <option key={p.user_id} value={p.user_id}>
                            {p.display_name || p.user_id}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Sentinel</Label>
                      <select
                        className="w-full border rounded-md p-2 bg-white/80 border-emerald-200"
                        value={assignSentinelId}
                        onChange={(e) => setAssignSentinelId(e.target.value)}
                      >
                        <option value="">Select sentinel</option>
                        {sentinels.map((s) => (
                          <option key={s.id} value={s.id}>{s.full_name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={assign} className="w-full bg-emerald-600 hover:bg-emerald-700">
                        <Link2 className="h-4 w-4 mr-2" /> Assign
                      </Button>
                    </div>
                  </div>

                  {/* Provider + Device (auto-resolve sentinel) */}
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <Label>Provider</Label>
                      <select
                        className="w-full border rounded-md p-2 bg-white/80 border-emerald-200"
                        value={assignProviderId}
                        onChange={(e) => setAssignProviderId(e.target.value)}
                      >
                        <option value="">Select provider</option>
                        {activeProviders.map((p) => (
                          <option key={p.user_id} value={p.user_id}>
                            {p.display_name || p.user_id}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Device</Label>
                      <select
                        className="w-full border rounded-md p-2 bg-white/80 border-emerald-200"
                        value={assignByDeviceId}
                        onChange={(e) => setAssignByDeviceId(e.target.value)}
                      >
                        <option value="">Select device (resolves sentinel)</option>
                        {devicesForAssign.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.id.slice(0, 8)}… {d.model ? `(${d.model})` : ""} {d.sentinel_id ? "" : "• no sentinel!"}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={assignByDevice} className="w-full bg-emerald-600 hover:bg-emerald-700">
                        Assign by Device
                      </Button>
                    </div>
                  </div>

                  {/* List by sentinel */}
                  <div className="grid gap-3">
                    {sentinels.length === 0 && (
                      <Card className="border-emerald-100 bg-white/70">
                        <CardContent className="py-6 text-gray-600">No sentinels yet.</CardContent>
                      </Card>
                    )}
                    {sentinels.map((s) => {
                      const provIds = bySentinel[s.id] || [];
                      return (
                        <Card key={s.id} className="border-emerald-100 bg-white/80">
                          <CardHeader className="py-3">
                            <CardTitle className="text-base">{s.full_name}</CardTitle>
                          </CardHeader>
                          <CardContent className="py-3">
                            {provIds.length === 0 && <div className="text-sm text-gray-600">No providers assigned.</div>}
                            {provIds.length > 0 && (
                              <ul className="space-y-2">
                                {provIds.map((pid) => {
                                  const row = providers.find(p => p.user_id === pid);
                                  const prof = row ? profilesById[row.user_id] : undefined;
                                  const name = row?.display_name || prof?.display_name || prof?.email || pid;
                                  return (
                                    <li key={pid} className="flex items-center justify-between">
                                      <span className="text-sm text-gray-800">{name}</span>
                                      <Button variant="outline" size="sm" onClick={() => unassign(pid, s.id)}>
                                        Unassign
                                      </Button>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
