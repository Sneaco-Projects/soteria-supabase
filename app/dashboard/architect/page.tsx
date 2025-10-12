"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

import { AlertTriangle, CheckCircle, Pencil, Trash2 } from "lucide-react";

/* ---------- Types ---------- */
type RawOverview = {
  device_id?: string;
  id?: string;
  hw_uid: string;
  model: string | null;            // we use this as Contact #
  sentinel_name: string | null;
  last_seen_at: string | null;
  latest_event_type: string | null;
  available?: boolean;
  assigned?: boolean;
};

type DeviceRow = {
  id: string;
  hw_uid: string;
  contact: string | null;
  sentinel_name: string | null;
  last_seen_at: string | null;
  latest_event_type: string | null;
  available: boolean;
  assigned: boolean;
};

export default function ArchitectDashboard() {
  const router = useRouter();

  /* ---------- Role guard ---------- */
  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/auth/signin";
        return;
      }
      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (profile?.role !== "architect") {
        window.location.href = `/dashboard/${profile?.role ?? "warden"}`;
        return;
      }
    };
    checkAccess();
  }, []);

  /* ---------- Local state ---------- */
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [search, setSearch] = useState("");

  // Add modal
  const [openAdd, setOpenAdd] = useState(false);
  const [newHwUid, setNewHwUid] = useState("");
  const [newContact, setNewContact] = useState("");

  // Edit modal
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editHwUid, setEditHwUid] = useState("");
  const [editContact, setEditContact] = useState("");

  // Delete modal
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  /* ---------- Data loaders ---------- */
  const normalize = (rows: RawOverview[]): DeviceRow[] =>
    rows.map((r) => {
      const id = (r.device_id ?? r.id) as string;
      const assigned = "assigned" in r ? !!r.assigned : !!r.sentinel_name;
      const available =
        "available" in r && typeof r.available === "boolean"
          ? !!r.available
          : !assigned; // fallback: not assigned => available (if you store flag in table, this is ignored)
      return {
        id,
        hw_uid: r.hw_uid,
        contact: r.model ?? null,
        sentinel_name: r.sentinel_name ?? null,
        last_seen_at: r.last_seen_at ?? null,
        latest_event_type: r.latest_event_type ?? null,
        available,
        assigned,
      };
    });

  const loadDevices = async () => {
    try {
      const { data, error } = await supabase
        .from("v_architect_device_overview")
        .select("*")
        .order("last_seen_at", { ascending: false });
      if (error) throw error;
      setDevices(normalize((data ?? []) as RawOverview[]));
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to load devices.");
    }
  };

  useEffect(() => { loadDevices(); }, []);

  /* ---------- Actions ---------- */
  const addDevice = async () => {
    try {
      const hw = newHwUid.trim();
      if (!hw) throw new Error("Device ID (HW UID) is required.");
      // Duplicate check
      const { data: existing, error: chkErr } = await supabase
        .from("devices").select("id").eq("hw_uid", hw).maybeSingle();
      if (chkErr) throw chkErr;
      if (existing) throw new Error("A device with this Device ID already exists.");

      const { error } = await supabase.from("devices").insert({
        hw_uid: hw,
        model: newContact.trim() || null, // store Contact # in model column
        available: false,                 // start Unavailable
      });
      if (error) throw error;

      setSuccessMsg("Device added.");
      setOpenAdd(false);
      setNewHwUid(""); setNewContact("");
      await loadDevices();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to add device.");
    }
  };

  const openEditFor = (d: DeviceRow) => {
    setEditId(d.id);
    setEditHwUid(d.hw_uid);
    setEditContact(d.contact ?? "");
    setOpenEdit(true);
  };

  const saveEdit = async () => {
    if (!editId) return;
    try {
      const { error } = await supabase
        .from("devices")
        .update({
          hw_uid: editHwUid.trim(),
          model: editContact.trim() || null, // contact #
        })
        .eq("id", editId);
      if (error) throw error;
      setSuccessMsg("Device updated.");
      setOpenEdit(false);
      await loadDevices();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to update device.");
    }
  };

  const toggleAvailable = async (d: DeviceRow, next: boolean) => {
    try {
      const { error } = await supabase
        .from("devices")
        .update({ available: next })
        .eq("id", d.id);
      if (error) throw error;
      setDevices((prev) =>
        prev.map((x) => (x.id === d.id ? { ...x, available: next } : x))
      );
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to update availability.");
    }
  };

  const askDelete = (id: string) => { setDeleteId(id); setOpenDelete(true); };

  const performDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("devices").delete().eq("id", deleteId);
      if (error) throw error;
      setSuccessMsg("Device deleted.");
      setOpenDelete(false);
      setDeleteId(null);
      await loadDevices();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to delete device.");
    }
  };

  /* ---------- Derived ---------- */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return devices;
    return devices.filter((d) =>
      [
        d.hw_uid,
        d.contact ?? "",
        d.sentinel_name ?? "",
        d.available ? "available" : "unavailable",
        d.assigned ? "assigned" : "unassigned",
      ].some((v) => v.toLowerCase().includes(q))
    );
  }, [devices, search]);

  /* ---------- UI ---------- */
  return (
    <>
      {/* Error modal */}
      <AlertDialog open={!!errorMsg} onOpenChange={(o) => !o && setErrorMsg(null)}>
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

      {/* Success modal */}
      <AlertDialog open={!!successMsg} onOpenChange={(o) => !o && setSuccessMsg(null)}>
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

      {/* Page */}
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="relative z-10 p-6 max-w-6xl mx-auto">
          <Card className="bg-white/90 border-emerald-200 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Device Inventory</CardTitle>
                  <CardDescription>
                    Add devices and mark them <b>Available</b> so Wardens can pair them.
                  </CardDescription>
                </div>
                <Button onClick={() => setOpenAdd(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  Add Device
                </Button>
              </div>
              <div className="mt-4">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search hw_uid, contact #, available/assigned…"
                  className="bg-white/80"
                />
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {filtered.map((d) => (
                <Card key={d.id} className="border-emerald-100 bg-white/80">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between gap-4">
                      {/* Left: title + badges */}
                      <div className="min-w-0">
                        <div className="font-medium text-gray-800 truncate">
                          {d.hw_uid} {d.contact ? <span className="text-gray-500">({d.contact})</span> : null}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs ${
                              d.available
                                ? "border-emerald-300 text-emerald-800 bg-emerald-50"
                                : "border-zinc-300 text-zinc-700 bg-zinc-50"
                            }`}
                          >
                            {d.available ? "Available" : "Unavailable"}
                          </span>
                          <span className="text-gray-500">
                            Last seen: {d.last_seen_at ? new Date(d.last_seen_at).toLocaleString() : "—"}
                          </span>
                          {d.sentinel_name ? (
                            <span className="text-gray-500">• Assigned to: {d.sentinel_name}</span>
                          ) : null}
                        </div>
                      </div>

                      {/* Right: controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Toggle */}
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                          <input
                            type="checkbox"
                            className="h-4 w-7 appearance-none rounded-full bg-zinc-200 outline-none ring-1 ring-inset ring-zinc-300 transition
                                       checked:bg-emerald-500 relative before:content-[''] before:absolute before:left-0.5 before:top-1/2 before:-translate-y-1/2
                                       before:h-3 before:w-3 before:rounded-full before:bg-white before:shadow checked:before:translate-x-3"
                            checked={d.available}
                            onChange={(e) => toggleAvailable(d, e.target.checked)}
                            title="Toggle Available"
                          />
                          <span className="w-20 text-right">{d.available ? "Available" : "Unavailable"}</span>
                        </label>

                        <Button variant="outline" onClick={() => openEditFor(d)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Button>
                        <Button variant="outline" onClick={() => router.push(`/dashboard/architect/devices/view?id=${d.id}`)}>
                          Details
                        </Button>
                        <Button
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => askDelete(d.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filtered.length === 0 && (
                <Card className="border-emerald-100 bg-white/70">
                  <CardContent className="py-6 text-gray-600">No devices match your search.</CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add device */}
      <AlertDialog open={openAdd} onOpenChange={setOpenAdd}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Device</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a Device ID and optional Contact # (device SIM). The Contact # is shown to Wardens as the SMS destination for pairing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Device ID (HW UID) *</Label>
              <Input value={newHwUid} onChange={(e) => setNewHwUid(e.target.value)} placeholder="Enter device ID/IMEI…" />
            </div>
            <div>
              <Label>Contact # (device SIM)</Label>
              <Input value={newContact} onChange={(e) => setNewContact(e.target.value)} placeholder="+63 9XX XXX XXXX" />
            </div>
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => { setOpenAdd(false); setNewHwUid(""); setNewContact(""); }}>
              Cancel
            </Button>
            <AlertDialogAction onClick={addDevice}>Add Device</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit device */}
      <AlertDialog open={openEdit} onOpenChange={setOpenEdit}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Device</AlertDialogTitle>
            <AlertDialogDescription>Update Device ID and Contact #.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Device ID (HW UID)</Label>
              <Input value={editHwUid} onChange={(e) => setEditHwUid(e.target.value)} />
            </div>
            <div>
              <Label>Contact #</Label>
              <Input value={editContact} onChange={(e) => setEditContact(e.target.value)} />
            </div>
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>Cancel</Button>
            <AlertDialogAction onClick={saveEdit}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete device */}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Device?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the device. You can only delete devices that are allowed by your RLS/policies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setOpenDelete(false)}>Cancel</Button>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={performDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
