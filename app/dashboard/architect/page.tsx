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
import { Switch } from "@/components/ui/switch";

import {
  CheckCircle, AlertTriangle, Cpu, Plus, Search, CheckCircle2, CircleDashed, Pencil
} from "lucide-react";

type ProviderRow = { user_id: string; display_name: string | null; active: boolean; created_at: string };
type ProfileRow  = { id: string; email: string; display_name: string | null };
type SentinelRow = { id: string; full_name: string };

// Devices (we read directly from public.devices so we can use `available`)
type Device = {
  id: string;
  hw_uid: string;
  model: string | null;
  available: boolean;
  sentinel_id: string | null;
  last_seen_at: string | null;
  created_at: string;
};

export default function ArchitectDashboard() {
  const router = useRouter();

  // ----- CLIENT GUARD -----
  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/auth/signin";
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.role !== "architect") {
        console.log(`Access denied: ${profile?.role} cannot access architect dashboard`);
        window.location.href = `/dashboard/${profile?.role ?? "warden"}`;
        return;
      }
    };
    checkAccess();
  }, []);

  // modals
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // tabs
  const [tab, setTab] = useState<"providers" | "assignments" | "devices">("devices");

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

  // Devices tab
  const [devices, setDevices] = useState<Device[]>([]);
  const [query, setQuery] = useState("");

  // Add device modal
  const [openAddDevice, setOpenAddDevice] = useState(false);
  const [newDeviceHwUid, setNewDeviceHwUid] = useState("");
  const [newDeviceModel, setNewDeviceModel] = useState("");
  const [newDeviceAvailable, setNewDeviceAvailable] = useState(true);

  // Edit device modal
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editModel, setEditModel] = useState("");

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
    ] = await Promise.all([
      supabase.from("providers").select("user_id, display_name, active, created_at").eq("active", true),
      supabase.from("sentinels").select("id, full_name").order("full_name"),
      supabase.from("provider_assignments").select("provider_id, sentinel_id"),
    ]);
    if (aErr) throw aErr; if (sErr) throw sErr; if (asgErr) throw asgErr;
    setActiveProviders(actProvs ?? []);
    setSentinels(sens ?? []);
    setAssignments(asg ?? []);
  };

  const loadDevices = async () => {
    const { data, error } = await supabase
      .from("devices")
      .select("id, hw_uid, model, available, sentinel_id, last_seen_at, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    setDevices((data ?? []) as Device[]);
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

  // Actions
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

  const addDevice = async () => {
    try {
      const hwUid = newDeviceHwUid.trim();
      if (!hwUid) throw new Error("Please enter a device ID (HW UID).");

      // Check if device already exists
      const { data: existing, error: checkError } = await supabase
        .from("devices")
        .select("hw_uid")
        .eq("hw_uid", hwUid)
        .maybeSingle();
      if (checkError) throw checkError;
      if (existing) throw new Error("A device with this ID already exists.");

      const { error } = await supabase
        .from("devices")
        .insert({
          hw_uid: hwUid,
          model: newDeviceModel.trim() || null,
          available: newDeviceAvailable, // <— NEW
        });
      if (error) throw error;

      setSuccessMsg("Device added.");
      setOpenAddDevice(false);
      setNewDeviceHwUid("");
      setNewDeviceModel("");
      setNewDeviceAvailable(true);
      await loadDevices();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to add device.");
    }
  };

  const toggleAvailable = async (d: Device, next: boolean) => {
    if (d.sentinel_id) {
      setErrorMsg("This device is already assigned to a sentinel. Unassign first before changing availability.");
      return;
    }
    try {
      const { error } = await supabase
        .from("devices")
        .update({ available: next })
        .eq("id", d.id);
      if (error) throw error;
      setSuccessMsg(next ? "Device marked Available." : "Device set to Unavailable.");
      await loadDevices();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to toggle availability.");
    }
  };

  const openEditFor = (d: Device) => {
    setEditId(d.id);
    setEditModel(d.model ?? "");
    setOpenEdit(true);
  };

  const saveEdit = async () => {
    if (!editId) return;
    try {
      const { error } = await supabase
        .from("devices")
        .update({ model: editModel.trim() || null })
        .eq("id", editId);
      if (error) throw error;
      setOpenEdit(false);
      setEditId(null);
      setSuccessMsg("Device updated.");
      await loadDevices();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to update device.");
    }
  };

  // Filters
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return devices;
    return devices.filter(d =>
      [
        d.hw_uid,
        d.model ?? "",
        d.available ? "available" : "unavailable",
        d.sentinel_id ? "assigned" : "unassigned",
      ].some(v => v.toLowerCase().includes(q))
    );
  }, [devices, query]);

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

            {/* Providers tab – keep your existing content (not modified here) */}
            <TabsContent value="providers">
              <Card className="bg-white/90 border-emerald-200">
                <CardHeader>
                  <CardTitle>Providers</CardTitle>
                  <CardDescription>Promote or manage providers (unchanged).</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600">
                  {/* Your existing providers UI here */}
                  (No changes made to this tab in this update.)
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assignments tab – keep your existing content (not modified here) */}
            <TabsContent value="assignments">
              <Card className="bg-white/90 border-emerald-200">
                <CardHeader>
                  <CardTitle>Assignments</CardTitle>
                  <CardDescription>Assign providers to sentinels (unchanged).</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-zinc-600">
                  {/* Your existing assignments UI here */}
                  (No changes made to this tab in this update.)
                </CardContent>
              </Card>
            </TabsContent>

            {/* Devices tab */}
            <TabsContent value="devices">
              <Card className="bg-white/90 backdrop-blur-lg border-emerald-200 shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Device Inventory</CardTitle>
                      <CardDescription>
                        Add devices and mark them <b>Available</b> so Wardens can pair them.
                      </CardDescription>
                    </div>
                    <Button onClick={() => setOpenAddDevice(true)} className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="mr-2 h-4 w-4" /> Add Device
                    </Button>
                  </div>
                  <div className="mt-3 relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search hw_uid, model, available/assigned…"
                      className="w-80 bg-white/80 pl-8"
                    />
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {filtered.length === 0 ? (
                    <Card className="border-emerald-100 bg-white/70">
                      <CardContent className="py-6 text-gray-600">No devices yet.</CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {filtered.map((d) => {
                        const assigned = !!d.sentinel_id;
                        return (
                          <Card key={d.id} className="border-emerald-100 bg-white/80 hover:shadow-sm transition-shadow">
                            <CardContent className="py-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="font-medium text-gray-800 truncate">
                                    <span className="font-mono">{d.hw_uid}</span> {d.model ? `(${d.model})` : ""}
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px]">
                                    {assigned ? (
                                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-emerald-800">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Assigned
                                      </span>
                                    ) : d.available ? (
                                      <span className="inline-flex items-center gap-1 rounded-full border border-indigo-300 bg-indigo-50 px-2 py-0.5 text-indigo-800">
                                        <CircleDashed className="h-3.5 w-3.5" /> Available
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-zinc-700">
                                        <CircleDashed className="h-3.5 w-3.5" /> Unavailable
                                      </span>
                                    )}
                                    <span className="text-zinc-500">
                                      Last seen: {d.last_seen_at ? new Date(d.last_seen_at).toLocaleString() : "—"}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      disabled={assigned}
                                      checked={!!d.available}
                                      onCheckedChange={(v) => toggleAvailable(d, v)}
                                    />
                                    <span className={`text-xs ${assigned ? "text-zinc-400" : "text-zinc-700"}`}>
                                      {assigned ? "Assigned (locked)" : (d.available ? "Available" : "Unavailable")}
                                    </span>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => openEditFor(d)}>
                                      <Pencil className="mr-2 h-4 w-4" /> Edit
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => router.push(`/dashboard/architect/devices/view?id=${d.id}`)}
                                    >
                                      Details
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Add Device Modal */}
      <AlertDialog open={openAddDevice} onOpenChange={setOpenAddDevice}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Device</AlertDialogTitle>
            <AlertDialogDescription>
              Provision a device into inventory. Mark it <b>Available</b> to allow Warden pairing.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="hw-uid">Device ID (HW UID) *</Label>
              <Input
                id="hw-uid"
                value={newDeviceHwUid}
                onChange={(e) => setNewDeviceHwUid(e.target.value)}
                placeholder="Enter device ID / IMEI…"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                This must match the hardware identifier (IMEI, printed UID, etc.)
              </p>
            </div>

            <div>
              <Label htmlFor="model">Model (Optional)</Label>
              <Input
                id="model"
                value={newDeviceModel}
                onChange={(e) => setNewDeviceModel(e.target.value)}
                placeholder="e.g., ESP32 + SIMA7670"
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={newDeviceAvailable} onCheckedChange={setNewDeviceAvailable} />
              <span className="text-sm text-zinc-700">Mark as Available</span>
            </div>
          </div>

          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenAddDevice(false);
                setNewDeviceHwUid("");
                setNewDeviceModel("");
                setNewDeviceAvailable(true);
                setErrorMsg(null);
              }}
            >
              Cancel
            </Button>
            <AlertDialogAction onClick={addDevice}>
              Add Device
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Device Modal */}
      <AlertDialog open={openEdit} onOpenChange={setOpenEdit}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Device</AlertDialogTitle>
            <AlertDialogDescription>Update device details.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Model</Label>
              <Input value={editModel} onChange={(e) => setEditModel(e.target.value)} placeholder="Model" />
            </div>
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>Cancel</Button>
            <AlertDialogAction onClick={saveEdit}>Save Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
