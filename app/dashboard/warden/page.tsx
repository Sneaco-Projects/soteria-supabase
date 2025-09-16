"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase-client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Plus,
  User,
  Phone,
  StickyNote,
  AlertTriangle,
  CheckCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Link as LinkIcon,
  Search,
  Loader2,
  Copy as CopyIcon,
  Radio,
  ActivitySquare,
  MapPin,
  MessagesSquare,
  Wrench,
  Zap,
} from "lucide-react";

// -------- Types --------
export type Sentinel = {
  id: string;
  full_name: string;
  phone: string | null;
  notes: string | null;
};

// The events table created by your device ingest
// Adjust TABLE_NAME or selected columns if your schema differs.
type DeviceEvent = {
  id: string;
  created_at: string;
  hw_uid: string | null;
  device_token?: string | null;
  event_type: string;
  payload: any; // JSON object { message?: string, lat?: number, lng?: number, ... }
};

// Helps us keep the table name in one place if you change it later
const EVENTS_TABLE = "device_events";

export default function WardenDashboard() {
  const [sentinels, setSentinels] = useState<Sentinel[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters / UI
  const [query, setQuery] = useState("");

  // Add modal
  const [openAdd, setOpenAdd] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const addDisabled = !fullName.trim();

  // Edit modal
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Delete confirm
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Pair Device modal
  const [openPair, setOpenPair] = useState(false);
  const [pairSentinelId, setPairSentinelId] = useState<string | null>(null);
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [pairExpires, setPairExpires] = useState<string | null>(null);
  const [pairHwUid, setPairHwUid] = useState(""); // optional lock to known device
  const [pairLoading, setPairLoading] = useState(false);

  // Modals (global)
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // -------- NEW: events feed + quick actions state --------
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsFilter, setEventsFilter] = useState<string>(""); // event_type filter text
  const [selectedPhone, setSelectedPhone] = useState<string>(""); // used by Quick SMS
  const mountedRef = useRef(false);

  // ---------- Existing: load sentinels ----------
  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sentinels")
        .select("id, full_name, phone, notes")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setSentinels(data ?? []);
      // Default the "selectedPhone" (Quick Actions) to the first sentinel with a phone
      const firstWithPhone = (data ?? []).find((s) => s.phone);
      if (firstWithPhone?.phone) setSelectedPhone(firstWithPhone.phone);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to load sentinels.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sentinels;
    return sentinels.filter((s) =>
      [s.full_name, s.phone ?? "", s.notes ?? ""].some((v) =>
        v.toLowerCase().includes(q)
      )
    );
  }, [sentinels, query]);

  // ---------- Existing: add sentinel ----------
  const addSentinel = async () => {
    if (addDisabled) return;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      const { error } = await supabase.from("sentinels").insert({
        owner_guardian_id: user.id,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        notes: notes.trim() || null,
      });
      if (error) throw error;

      setOpenAdd(false);
      setFullName("");
      setPhone("");
      setNotes("");
      setSuccessMsg("Sentinel added.");
      await load();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to add sentinel.");
    }
  };

  const openEditFor = (s: Sentinel) => {
    setEditId(s.id);
    setEditName(s.full_name);
    setEditPhone(s.phone ?? "");
    setEditNotes(s.notes ?? "");
    setOpenEdit(true);
  };

  const updateSentinel = async () => {
    if (!editId || !editName.trim()) {
      setErrorMsg(!editId ? "Nothing to update." : "Full name is required.");
      return;
    }
    try {
      const { error } = await supabase
        .from("sentinels")
        .update({
          full_name: editName.trim(),
          phone: editPhone.trim() || null,
          notes: editNotes.trim() || null,
        })
        .eq("id", editId);
      if (error) throw error;

      setOpenEdit(false);
      setEditId(null);
      setSuccessMsg("Sentinel updated.");
      await load();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to update sentinel.");
    }
  };

  const askDelete = (id: string) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const deleteSentinel = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("sentinels").delete().eq("id", deleteId);
      if (error) throw error;
      setOpenDelete(false);
      setDeleteId(null);
      setSuccessMsg("Sentinel deleted.");
      await load();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to delete sentinel.");
    }
  };

  // ---------- Existing: Pair helpers ----------
  const openPairFor = (s: Sentinel) => {
    setPairSentinelId(s.id);
    setPairCode(null);
    setPairExpires(null);
    setPairHwUid("");
    setOpenPair(true);
  };

  const requestPairCode = async () => {
    if (!pairSentinelId) return;
    setPairLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not signed in.");

      const { data, error } = await supabase.functions.invoke("create-claim", {
        body: {
          sentinel_id: pairSentinelId,
          hw_uid: pairHwUid || undefined,
        },
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // ensures gateway is happy
          Authorization: `Bearer ${session.access_token}`, // run RLS as the user
        },
      });

      if (error) throw new Error(error.message || "Failed to create pairing code.");
      setPairCode((data as any).code);
      setPairExpires((data as any).expires_at);
      setSuccessMsg("Pairing code generated.");
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to create pairing code.");
    } finally {
      setPairLoading(false);
    }
  };

  const copyPairCode = async () => {
    if (!pairCode) return;
    try {
      await navigator.clipboard.writeText(pairCode);
      setSuccessMsg("Code copied to clipboard.");
    } catch {
      setErrorMsg("Unable to copy. Please copy manually.");
    }
  };

  // -------- NEW: Load & subscribe to device events --------
  const loadEvents = async () => {
    setEventsLoading(true);
    try {
      const { data, error } = await supabase
        .from(EVENTS_TABLE)
        .select("id, created_at, hw_uid, device_token, event_type, payload")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      setEvents(data ?? []);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to load device events.");
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    loadEvents();

    // realtime subscription for new events
    const channel = supabase
      .channel("warden-events")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: EVENTS_TABLE },
        (payload: any) => {
          setEvents((prev) => [payload.new as DeviceEvent, ...prev].slice(0, 200));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filtered events (by event_type text)
  const visibleEvents = useMemo(() => {
    const f = eventsFilter.trim().toLowerCase();
    if (!f) return events;
    return events.filter((e) =>
      e.event_type?.toLowerCase().includes(f)
      || (e.payload?.message ?? "").toLowerCase().includes(f)
      || (e.hw_uid ?? "").toLowerCase().includes(f)
    );
  }, [events, eventsFilter]);

  // -------- NEW: Quick SMS helpers (opens phone SMS app or copies body) --------
  const smsHref = (to: string, body: string) => {
    // Minimal SMS deep link; on desktop some browsers ignore this (that’s okay).
    const encoded = encodeURIComponent(body);
    return `sms:${to}?&body=${encoded}`;
  };
  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccessMsg("Copied to clipboard.");
    } catch {
      setErrorMsg("Unable to copy. Please copy manually.");
    }
  };

  // Suggested command bodies (must match device firmware)
  const cmdOTW = "OTW";
  const cmdAgps60 = "AGPS 60";
  const cmdAgpsOff = "AGPS OFF";
  const cmdUnpair = "UNPAIR";

  return (
    <>
      {/* Error / Success Modals */}
      <AlertDialog open={!!errorMsg} onOpenChange={(o) => !o && setErrorMsg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" /> Something went wrong
            </AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-wrap">
              {errorMsg}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorMsg(null)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!successMsg} onOpenChange={(o) => !o && setSuccessMsg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" /> Success
            </AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-wrap">
              {successMsg}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setSuccessMsg(null)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Page backdrop */}
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        {/* Background blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply blur-xl opacity-30 animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply blur-xl opacity-30 animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply blur-xl opacity-20 animate-pulse delay-2000" />
        </div>

        <div className="relative z-10 p-6 max-w-7xl mx-auto">
          {/* Header row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
            <div className="flex items-center gap-2 text-gray-800">
              <User className="h-5 w-5 text-emerald-700" />
              <h1 className="text-xl font-semibold tracking-tight">Your Sentinels</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, phone, notes…"
                  className="pl-8 w-64 bg-white/80"
                />
              </div>
              <Button
                onClick={() => setOpenAdd(true)}
                className="bg-emerald-600 hover:bg-emerald-700 shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Sentinel
              </Button>
            </div>
          </div>

          {/* Sentinel list or skeletons */}
          {!loading && filtered.length === 0 ? (
            <Card className="border-emerald-200 bg-white/90">
              <CardHeader>
                <CardTitle>No Sentinels yet</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-600">
                Add your first Sentinel to start managing their safety profile.
              </CardContent>
            </Card>
          ) : loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-emerald-100 bg-white/70 animate-pulse h-36" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((s) => (
                <Card
                  key={s.id}
                  className="border-emerald-200 bg-white/90 shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-emerald-600" /> {s.full_name}
                    </CardTitle>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openPairFor(s)}>
                          <LinkIcon className="h-4 w-4 mr-2" /> Pair device
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            // Quick-actions use this phone as default
                            if (s.phone) setSelectedPhone(s.phone);
                          }}
                        >
                          <Phone className="h-4 w-4 mr-2" /> Use this phone for quick SMS
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditFor(s)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => askDelete(s.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>

                  <CardContent className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" /> {s.phone || "—"}
                    </div>
                    <div className="flex items-start gap-2">
                      <StickyNote className="h-4 w-4 mt-0.5" />
                      <span className="line-clamp-3">{s.notes || "No notes"}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ---------- NEW: Right below the sentinel list, we add Actions + Live Events ---------- */}
          <div className="grid gap-4 md:grid-cols-3 mt-6">
            {/* Quick SMS Actions */}
            <Card className="border-emerald-200 bg-white/90 md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessagesSquare className="h-5 w-5 text-emerald-700" />
                  Quick SMS Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-1">
                  <Label>Send to phone</Label>
                  <Input
                    value={selectedPhone}
                    onChange={(e) => setSelectedPhone(e.target.value)}
                    placeholder="+63 9XX XXX XXXX"
                    className="bg-white/80"
                  />
                  <p className="text-xs text-gray-500">
                    Your device listens for SMS commands from the guardian phone.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    asChild
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={!selectedPhone}
                    title="Open SMS app with 'OTW'"
                  >
                    <a href={selectedPhone ? smsHref(selectedPhone, cmdOTW) : "#"}>
                      <Radio className="h-4 w-4 mr-2" /> OTW
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyText(cmdOTW)}
                    disabled={!selectedPhone}
                    title="Copy 'OTW' to clipboard"
                  >
<CopyIcon className="h-4 w-4 mr-2" /> Copy OTW
                  </Button>

                  <Button
                    asChild
                    className="bg-teal-600 hover:bg-teal-700"
                    disabled={!selectedPhone}
                    title="Open SMS app with 'AGPS 60'"
                  >
                    <a href={selectedPhone ? smsHref(selectedPhone, cmdAgps60) : "#"}>
                      <Zap className="h-4 w-4 mr-2" /> A-GPS 60s
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyText(cmdAgps60)}
                    disabled={!selectedPhone}
                  >
                    <CopyIcon className="h-4 w-4 mr-2" /> Copy A-GPS 60
                  </Button>

                  <Button
                    asChild
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    disabled={!selectedPhone}
                    title="Open SMS app with 'AGPS OFF'"
                  >
                    <a href={selectedPhone ? smsHref(selectedPhone, cmdAgpsOff) : "#"}>
                      <Wrench className="h-4 w-4 mr-2" /> A-GPS OFF
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyText(cmdAgpsOff)}
                    disabled={!selectedPhone}
                  >
                    <CopyIcon className="h-4 w-4 mr-2" /> Copy A-GPS OFF
                  </Button>

                  <Button
                    asChild
                    className="bg-red-600 hover:bg-red-700"
                    disabled={!selectedPhone}
                    title="Open SMS app with 'UNPAIR'"
                  >
                    <a href={selectedPhone ? smsHref(selectedPhone, cmdUnpair) : "#"}>
                      <Trash2 className="h-4 w-4 mr-2" /> UNPAIR
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyText(cmdUnpair)}
                    disabled={!selectedPhone}
                  >
                    <CopyIcon className="h-4 w-4 mr-2" /> Copy UNPAIR
                  </Button>
                </div>

                <p className="text-xs text-gray-500 pt-1">
                  Tip: On desktop, the <code>sms:</code> links may not open. Use the copy buttons instead and send from your phone.
                </p>
              </CardContent>
            </Card>

            {/* Live Events Feed */}
            <Card className="border-emerald-200 bg-white/90 md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ActivitySquare className="h-5 w-5 text-emerald-700" />
                  Live Device Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={eventsFilter}
                    onChange={(e) => setEventsFilter(e.target.value)}
                    placeholder="Filter by type/message/HW UID… (e.g. SOS, OTW, HEALTH)"
                    className="bg-white/80"
                  />
                  <Button variant="outline" onClick={loadEvents}>
                    Refresh
                  </Button>
                </div>

                {eventsLoading ? (
                  <div className="text-sm text-gray-600">Loading events…</div>
                ) : visibleEvents.length === 0 ? (
                  <div className="text-sm text-gray-600">No events yet.</div>
                ) : (
                  <div className="space-y-2">
                    {visibleEvents.slice(0, 50).map((e) => {
                      const payload = e.payload || {};
                      const msg = typeof payload.message === "string" ? payload.message : "";
                      const lat = typeof payload.lat === "number" ? payload.lat : undefined;
                      const lng = typeof payload.lng === "number" ? payload.lng : undefined;
                      const mapHref =
                        lat !== undefined && lng !== undefined
                          ? `https://maps.google.com/maps?q=${lat},${lng}`
                          : null;

                      // color chip by event_type
                      const color =
                        e.event_type === "SOS"
                          ? "bg-red-100 text-red-700 border-red-200"
                          : e.event_type === "OTW"
                          ? "bg-blue-100 text-blue-700 border-blue-200"
                          : e.event_type?.startsWith("AGPS")
                          ? "bg-amber-100 text-amber-700 border-amber-200"
                          : e.event_type?.startsWith("PAIR")
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : e.event_type?.startsWith("UNPAIR")
                          ? "bg-gray-100 text-gray-700 border-gray-200"
                          : e.event_type === "HEALTH"
                          ? "bg-slate-100 text-slate-700 border-slate-200"
                          : "bg-zinc-100 text-zinc-700 border-zinc-200";

                      return (
                        <div
                          key={e.id}
                          className="rounded-md border p-3 bg-white/80 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded border text-xs ${color}`}>
                                {e.event_type}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(e.created_at).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-gray-800">
                              {msg || <span className="text-gray-500">—</span>}
                            </div>
                            <div className="text-xs text-gray-500">
                              {e.hw_uid ? <>HW: <span className="font-mono">{e.hw_uid}</span></> : null}
                            </div>
                            {mapHref && (
                              <div className="flex items-center gap-1 text-xs">
                                <MapPin className="h-3.5 w-3.5" />
                                <a
                                  href={mapHref}
                                  target="_blank"
                                  className="text-emerald-700 hover:underline"
                                >
                                  {lat?.toFixed(6)},{lng?.toFixed(6)}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Sentinel Modal */}
      <AlertDialog open={openAdd} onOpenChange={setOpenAdd}>
        <AlertDialogContent className="sm:max-w-[520px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Add Sentinel</AlertDialogTitle>
            <AlertDialogDescription>
              Create a device user profile you can assign to a device later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Juan Dela Cruz"
              />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+63 9XX XXX XXXX"
              />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Allergies, conditions…"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <Button variant="ghost" onClick={() => setOpenAdd(false)}>
              Cancel
            </Button>
            <AlertDialogAction disabled={addDisabled} onClick={addSentinel}>
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Sentinel Modal */}
      <AlertDialog open={openEdit} onOpenChange={setOpenEdit}>
        <AlertDialogContent className="sm:max-w-[520px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Edit Sentinel</AlertDialogTitle>
            <AlertDialogDescription>Update the sentinel’s info.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
            </div>
          </div>
          <AlertDialogFooter>
            <Button variant="ghost" onClick={() => setOpenEdit(false)}>
              Cancel
            </Button>
            <AlertDialogAction onClick={updateSentinel}>Save Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirm Modal */}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sentinel?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the sentinel record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="ghost" onClick={() => setOpenDelete(false)}>
              Cancel
            </Button>
            <Button
              onClick={deleteSentinel}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pair Device Modal */}
      <AlertDialog open={openPair} onOpenChange={setOpenPair}>
        <AlertDialogContent className="sm:max-w-[520px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Pair device</AlertDialogTitle>
            <AlertDialogDescription>
              Generate a short code and enter it on the device. Optionally lock the claim to a specific HW UID (IMEI).
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Lock to HW UID (optional)</Label>
              <Input
                value={pairHwUid}
                onChange={(e) => setPairHwUid(e.target.value)}
                placeholder="IMEI / printed UID"
              />
            </div>

            {!pairCode ? (
              <Button
                onClick={requestPairCode}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={pairLoading || !pairSentinelId}
              >
                {pairLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating…
                  </span>
                ) : (
                  "Generate code"
                )}
              </Button>
            ) : (
              <div className="rounded-md border p-3 bg-white/80">
                <div className="text-sm text-gray-600">Code</div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-2xl font-mono tracking-wider">{pairCode}</div>
                  <Button variant="outline" size="sm" onClick={copyPairCode}>
                    <CopyIcon className="h-4 w-4 mr-2" /> Copy
                  </Button>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Expires: {pairExpires ? new Date(pairExpires).toLocaleString() : ""}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Text the device <span className="font-mono">PAIR {pairCode}</span> from the
                  warden phone.
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setOpenPair(false)}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
