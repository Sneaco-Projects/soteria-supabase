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
  X,
} from "lucide-react";

// -------- Types --------
export type Sentinel = {
  id: string;
  full_name: string;
  phone: string | null;
  notes: string | null;
};

type DeviceEvent = {
  id: string | number;
  created_at: string;
  device_id?: string;
  sentinel_id?: string | null;
  hw_uid?: string | null;          // included if you select it
  device_token?: string | null;    // included if you select it
  event_type: string;
  payload: any;                    // JSON object
};

type PublicEvent = {
  id: string | number;
  created_at: string;
  device_id: string;               // TEXT in your public.events
  type: string;
  message: string | null;
  extras: any;
};

// Helps us keep names in one place
const DEVICE_EVENTS_TABLE = "device_events";
const PUBLIC_EVENTS_TABLE = "events";

export default function WardenDashboard() {
  // ---- App State ----
  const [sentinels, setSentinels] = useState<Sentinel[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // CRUD modals
  const [openAdd, setOpenAdd] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const addDisabled = !fullName.trim();

  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Pair modal
  const [openPair, setOpenPair] = useState(false);
  const [pairSentinelId, setPairSentinelId] = useState<string | null>(null);
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [pairExpires, setPairExpires] = useState<string | null>(null);
  const [pairHwUid, setPairHwUid] = useState("");
  const [pairLoading, setPairLoading] = useState(false);

  // Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Events / feed
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsFilter, setEventsFilter] = useState<string>("");
  const [selectedPhone, setSelectedPhone] = useState<string>("");

  // Pairing watchers and device focus
  const [pairedDeviceId, setPairedDeviceId] = useState<string | null>(null);
  const [pairUsedAt, setPairUsedAt] = useState<string | null>(null);

  // Channels
  const claimChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pairOkChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pairFailChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const deviceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const mountedRef = useRef(false);

  // ---------- Load sentinels ----------
  const loadSentinels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sentinels")
        .select("id, full_name, phone, notes, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setSentinels(data ?? []);
      const firstWithPhone = (data ?? []).find((s) => s.phone);
      if (firstWithPhone?.phone) setSelectedPhone(firstWithPhone.phone);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to load sentinels.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSentinels();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sentinels;
    return sentinels.filter((s) =>
      [s.full_name, s.phone ?? "", s.notes ?? ""].some((v) => v.toLowerCase().includes(q))
    );
  }, [sentinels, query]);

  // ---------- Sentinel CRUD ----------
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
      setFullName(""); setPhone(""); setNotes("");
      setSuccessMsg("Sentinel added.");
      await loadSentinels();
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
      await loadSentinels();
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
      await loadSentinels();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to delete sentinel.");
    }
  };

  // ---------- Pair modal helpers ----------
  const openPairFor = (s: Sentinel) => {
    setPairSentinelId(s.id);
    setPairCode(null);
    setPairExpires(null);
    setPairHwUid("");
    setPairUsedAt(null);
    setPairedDeviceId(null);
    setOpenPair(true);
  };

  const clearPairCode = () => {
    // stop watchers and clear UI
    if (claimChannelRef.current) supabase.removeChannel(claimChannelRef.current);
    if (pairOkChannelRef.current) supabase.removeChannel(pairOkChannelRef.current);
    if (pairFailChannelRef.current) supabase.removeChannel(pairFailChannelRef.current);
    claimChannelRef.current = null;
    pairOkChannelRef.current = null;
    pairFailChannelRef.current = null;

    setPairCode(null);
    setPairExpires(null);
    setPairUsedAt(null);
    setPairedDeviceId(null);
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
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // gateway happy
          Authorization: `Bearer ${session.access_token}`,    // run as user (RLS)
        },
      });
      if (error) throw new Error(error.message || "Failed to create pairing code.");

      const code = (data as any).code as string;
      const expires_at = (data as any).expires_at as string;
      setPairCode(code);
      setPairExpires(expires_at);
      setSuccessMsg("Pairing code generated.");

      // kick off watchers
      startPairWatchers(code);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to create pairing code.");
    } finally {
      setPairLoading(false);
    }
  };

  // ---------- Pairing watchers ----------
  const startPairWatchers = (code: string) => {
    // 1) device_claims: watch this code until used_at fills
    if (claimChannelRef.current) supabase.removeChannel(claimChannelRef.current);
    claimChannelRef.current = supabase
      .channel(`claim-${code}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "device_claims", filter: `code=eq.${code}` },
        (payload: any) => {
          const used_at = payload?.new?.used_at as string | null;
          if (used_at) setPairUsedAt(used_at);
        }
      )
      .subscribe();

    // 2) device_events: watch for PAIR_OK with payload.code match; then we know device_id
    if (pairOkChannelRef.current) supabase.removeChannel(pairOkChannelRef.current);
    pairOkChannelRef.current = supabase
      .channel(`pairok-${code}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: DEVICE_EVENTS_TABLE, filter: "event_type=eq.PAIR_OK" },
        (payload: any) => {
          const p = payload?.new?.payload || {};
          if (p?.code === code) {
            const devId = payload.new.device_id as string;
            setPairedDeviceId(devId);
            setSuccessMsg("Device paired!");
            setOpenPair(false);
            // focus the feed on this device
            loadEventsForDevice(devId);
            // attach device-only realtime
            startDeviceStream(devId);
          }
        }
      )
      .subscribe();

    // 3) public.events: watch for PAIR_FAIL on our code → invalid/mismatch modal
    if (pairFailChannelRef.current) supabase.removeChannel(pairFailChannelRef.current);
    pairFailChannelRef.current = supabase
      .channel(`pairfail-${code}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: PUBLIC_EVENTS_TABLE, filter: "type=in.(PAIR_FAIL,PAIR_OK_UNCLAIMED)" },
        (payload: any) => {
          const extras = payload?.new?.extras || {};
          // Only react if this event is for *our* code
          if (extras?.requested_code && extras.requested_code !== code) return;

          if (payload?.new?.type === "PAIR_FAIL") {
            setErrorMsg(
              extras?.reason === "mismatch_hw"
                ? "Invalid code: This code is locked to a different device (HW UID mismatch)."
                : "Invalid or expired code. Please generate a new one."
            );
          }
        }
      )
      .subscribe();
  };

  // ---------- Events loading ----------
  const loadAllEvents = async () => {
    setEventsLoading(true);
    try {
      const { data, error } = await supabase
        .from(DEVICE_EVENTS_TABLE)
        .select("id, created_at, event_type, payload, device_id, sentinel_id")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      setEvents((data as any) ?? []);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to load device events.");
    } finally {
      setEventsLoading(false);
    }
  };

  const loadEventsForDevice = async (deviceId: string) => {
    setEventsLoading(true);
    try {
      const { data, error } = await supabase
        .from(DEVICE_EVENTS_TABLE)
        .select("id, created_at, event_type, payload, device_id, sentinel_id")
        .eq("device_id", deviceId)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      setEvents((data as any) ?? []);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to load device events.");
    } finally {
      setEventsLoading(false);
    }
  };

  // Global stream (only if we’re not focused on a device)
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    loadAllEvents();

    const channel = supabase
      .channel("warden-events")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: DEVICE_EVENTS_TABLE },
        (payload: any) => {
          // if focused on a device, ignore global stream
          if (pairedDeviceId && payload.new?.device_id !== pairedDeviceId) return;
          setEvents((prev) => [payload.new as DeviceEvent, ...prev].slice(0, 500));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      // cleanup any pairing/device channels on unmount
      if (claimChannelRef.current) supabase.removeChannel(claimChannelRef.current);
      if (pairOkChannelRef.current) supabase.removeChannel(pairOkChannelRef.current);
      if (pairFailChannelRef.current) supabase.removeChannel(pairFailChannelRef.current);
      if (deviceChannelRef.current) supabase.removeChannel(deviceChannelRef.current);
    };
  }, [pairedDeviceId]);

  // Device-only stream (switches when paired)
  const startDeviceStream = (deviceId: string) => {
    if (deviceChannelRef.current) supabase.removeChannel(deviceChannelRef.current);
    deviceChannelRef.current = supabase
      .channel(`dev-${deviceId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: DEVICE_EVENTS_TABLE, filter: `device_id=eq.${deviceId}` },
        (payload: any) => setEvents((prev) => [payload.new as any, ...prev].slice(0, 500))
      )
      .subscribe();
  };

  // Filtered view
  const visibleEvents = useMemo(() => {
    const f = eventsFilter.trim().toLowerCase();
    if (!f) return events;
    return events.filter((e) => {
      const msg = String(e?.payload?.message ?? "");
      const hw = String(e?.payload?.hw_uid ?? e?.hw_uid ?? "");
      return (
        e.event_type?.toLowerCase().includes(f) ||
        msg.toLowerCase().includes(f) ||
        hw.toLowerCase().includes(f)
      );
    });
  }, [events, eventsFilter]);

  // -------- Quick SMS helpers --------
  const smsHref = (to: string, body: string) => {
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

  // Commands (must match firmware)
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

      {/* Page */}
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply blur-xl opacity-30 animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply blur-xl opacity-30 animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply blur-xl opacity-20 animate-pulse delay-2000" />
        </div>

        <div className="relative z-10 p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
            <div className="flex items-center gap-2 text-gray-800">
              <User className="h-5 w-5 text-emerald-700" />
              <h1 className="text-xl font-semibold tracking-tight">
                Your Sentinels
                {pairedDeviceId ? (
                  <span className="ml-3 text-sm text-gray-500">• Focused on device <span className="font-mono">{pairedDeviceId.slice(0,8)}…</span></span>
                ) : (
                  <span className="ml-3 text-sm text-gray-500">• Showing all device events</span>
                )}
              </h1>
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
              <Button onClick={() => setOpenAdd(true)} className="bg-emerald-600 hover:bg-emerald-700 shadow-sm">
                <Plus className="h-4 w-4 mr-2" /> Add Sentinel
              </Button>
            </div>
          </div>

          {/* Sentinels */}
          {!loading && filtered.length === 0 ? (
            <Card className="border-emerald-200 bg-white/90">
              <CardHeader><CardTitle>No Sentinels yet</CardTitle></CardHeader>
              <CardContent className="text-gray-600">Add your first Sentinel to start managing their safety profile.</CardContent>
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
                <Card key={s.id} className="border-emerald-200 bg-white/90 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-emerald-600" /> {s.full_name}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openPairFor(s)}>
                          <LinkIcon className="h-4 w-4 mr-2" /> Pair device
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { if (s.phone) setSelectedPhone(s.phone); }}>
                          <Phone className="h-4 w-4 mr-2" /> Use this phone for quick SMS
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditFor(s)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => askDelete(s.id)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {s.phone || "—"}</div>
                    <div className="flex items-start gap-2"><StickyNote className="h-4 w-4 mt-0.5" /><span className="line-clamp-3">{s.notes || "No notes"}</span></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Actions + Live Events */}
          <div className="grid gap-4 md:grid-cols-3 mt-6">
            {/* Quick SMS */}
            <Card className="border-emerald-200 bg-white/90 md:col-span-1">
              <CardHeader><CardTitle className="flex items-center gap-2"><MessagesSquare className="h-5 w-5 text-emerald-700" /> Quick SMS Actions</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-1">
                  <Label>Send to phone</Label>
                  <Input value={selectedPhone} onChange={(e) => setSelectedPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" className="bg-white/80" />
                  <p className="text-xs text-gray-500">Your device listens for SMS commands from the guardian phone.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild className="bg-emerald-600 hover:bg-emerald-700" disabled={!selectedPhone} title="Open SMS app with 'OTW'">
                    <a href={selectedPhone ? smsHref(selectedPhone, "OTW") : "#"}><Radio className="h-4 w-4 mr-2" /> OTW</a>
                  </Button>
                  <Button variant="outline" onClick={() => copyText("OTW")} disabled={!selectedPhone}><CopyIcon className="h-4 w-4 mr-2" /> Copy OTW</Button>

                  <Button asChild className="bg-teal-600 hover:bg-teal-700" disabled={!selectedPhone} title="Open SMS app with 'AGPS 60'">
                    <a href={selectedPhone ? smsHref(selectedPhone, "AGPS 60") : "#"}><Zap className="h-4 w-4 mr-2" /> A-GPS 60s</a>
                  </Button>
                  <Button variant="outline" onClick={() => copyText("AGPS 60")} disabled={!selectedPhone}><CopyIcon className="h-4 w-4 mr-2" /> Copy A-GPS 60</Button>

                  <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white" disabled={!selectedPhone} title="Open SMS app with 'AGPS OFF'">
                    <a href={selectedPhone ? smsHref(selectedPhone, "AGPS OFF") : "#"}><Wrench className="h-4 w-4 mr-2" /> A-GPS OFF</a>
                  </Button>
                  <Button variant="outline" onClick={() => copyText("AGPS OFF")} disabled={!selectedPhone}><CopyIcon className="h-4 w-4 mr-2" /> Copy A-GPS OFF</Button>

                  <Button asChild className="bg-red-600 hover:bg-red-700" disabled={!selectedPhone} title="Open SMS app with 'UNPAIR'">
                    <a href={selectedPhone ? smsHref(selectedPhone, "UNPAIR") : "#"}><Trash2 className="h-4 w-4 mr-2" /> UNPAIR</a>
                  </Button>
                  <Button variant="outline" onClick={() => copyText("UNPAIR")} disabled={!selectedPhone}><CopyIcon className="h-4 w-4 mr-2" /> Copy UNPAIR</Button>
                </div>

                <p className="text-xs text-gray-500 pt-1">
                  Tip: On desktop, the <code>sms:</code> links may not open. Use the copy buttons instead and send from your phone.
                </p>
              </CardContent>
            </Card>

            {/* Live Events */}
            <Card className="border-emerald-200 bg-white/90 md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ActivitySquare className="h-5 w-5 text-emerald-700" />
                  {pairedDeviceId ? "Device Log (live)" : "Live Device Events (all)"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={eventsFilter}
                    onChange={(e) => setEventsFilter(e.target.value)}
                    placeholder="Filter by type/message/HW UID… (e.g. SOS, OTW, HEALTH)"
                    className="bg-white/80"
                  />
                  <Button
                    variant="outline"
                    onClick={() => (pairedDeviceId ? loadEventsForDevice(pairedDeviceId) : loadAllEvents())}
                  >
                    Refresh
                  </Button>

                  {pairedDeviceId ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPairedDeviceId(null);
                        if (deviceChannelRef.current) supabase.removeChannel(deviceChannelRef.current);
                        loadAllEvents();
                      }}
                      className="gap-2"
                      title="Show all events again"
                    >
                      <X className="h-4 w-4" /> Clear device focus
                    </Button>
                  ) : null}
                </div>

                {eventsLoading ? (
                  <div className="text-sm text-gray-600">Loading events…</div>
                ) : visibleEvents.length === 0 ? (
                  <div className="text-sm text-gray-600">No events yet.</div>
                ) : (
                  <div className="space-y-2">
                    {visibleEvents.slice(0, 200).map((e) => {
                      const payload = e.payload || {};
                      const msg = typeof payload.message === "string" ? payload.message : "";
                      const lat = typeof payload.lat === "number" ? payload.lat : undefined;
                      const lng = typeof payload.lng === "number" ? payload.lng : undefined;
                      const mapHref =
                        lat !== undefined && lng !== undefined
                          ? `https://maps.google.com/maps?q=${lat},${lng}`
                          : null;

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
                          key={String(e.id)}
                          className="rounded-md border p-3 bg-white/80 text-sm"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded border text-xs ${color}`}>
                                {e.event_type}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(e.created_at).toLocaleString()}
                              </span>
                              {e.device_id ? (
                                <span className="text-[11px] text-gray-500">
                                  • dev <span className="font-mono">{e.device_id.slice(0, 8)}…</span>
                                </span>
                              ) : null}
                            </div>

                            {mapHref && (
                              <div className="flex items-center gap-1 text-xs">
                                <MapPin className="h-3.5 w-3.5" />
                                <a href={mapHref} target="_blank" className="text-emerald-700 hover:underline">
                                  {lat?.toFixed(6)},{lng?.toFixed(6)}
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Human message */}
                          <div className="mt-1 text-gray-800">
                            {msg || <span className="text-gray-500">—</span>}
                          </div>

                          {/* Full JSON payload (append-only detailed log) */}
                          <pre className="mt-2 text-xs bg-zinc-50 border rounded p-2 overflow-auto">
{JSON.stringify(payload, null, 2)}
                          </pre>
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
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Juan Dela Cruz" />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, conditions…" />
            </div>
          </div>
          <AlertDialogFooter>
            <Button variant="ghost" onClick={() => setOpenAdd(false)}>Cancel</Button>
            <AlertDialogAction disabled={addDisabled} onClick={addSentinel}>Save</AlertDialogAction>
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
            <Button variant="ghost" onClick={() => setOpenEdit(false)}>Cancel</Button>
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
            <Button variant="ghost" onClick={() => setOpenDelete(false)}>Cancel</Button>
            <Button onClick={deleteSentinel} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pair Device Modal */}
      <AlertDialog open={openPair} onOpenChange={(o) => { setOpenPair(o); if (!o) clearPairCode(); }}>
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
              <Input value={pairHwUid} onChange={(e) => setPairHwUid(e.target.value)} placeholder="IMEI / printed UID" />
            </div>

            {!pairCode ? (
              <div className="flex items-center gap-2">
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
              </div>
            ) : (
              <div className="rounded-md border p-3 bg-white/80 space-y-2">
                <div className="text-sm text-gray-600">Code</div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-2xl font-mono tracking-wider">{pairCode}</div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={async () => {
                      await navigator.clipboard.writeText(pairCode);
                      setSuccessMsg("Code copied to clipboard.");
                    }}>
                      <CopyIcon className="h-4 w-4 mr-2" /> Copy
                    </Button>
                    <Button variant="ghost" size="icon" onClick={clearPairCode} title="Clear & make a new code">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Expires: {pairExpires ? new Date(pairExpires).toLocaleString() : ""}
                  {pairUsedAt ? <> • Used: {new Date(pairUsedAt).toLocaleString()}</> : null}
                </div>
                <div className="text-xs text-gray-500">
                  Text the device <span className="font-mono">PAIR {pairCode}</span> from the guardian phone.
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setOpenPair(false)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
