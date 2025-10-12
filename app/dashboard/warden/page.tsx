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
  ActivitySquare,
  MapPin,
  X,
  Bell,
  ShieldAlert,
  MessageSquareText,
  Info,
  CheckCircle2,
  XCircle,
} from "lucide-react";

/* ===================== Types & consts ===================== */

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
  event_type: string;
  payload: any;
};

type DeviceRow = {
  id: string;
  sentinel_id: string | null;
  last_seen_at: string | null;
};

type LogCategory = "All" | "Button" | "SOS" | "SMS" | "System";

const DEVICE_EVENTS_TABLE = "device_events";
const PUBLIC_EVENTS_TABLE = "events";

/* Category helpers (filters + labels) */
function categorize(e: DeviceEvent): LogCategory {
  switch (e.event_type) {
    case "BTN_SHORT":
      return "Button";
    case "SOS":
      return "SOS";
    case "IN_SMS":
      return "SMS";
    case "PAIR_OK":
    case "PAIR_FAIL":
    case "UNPAIR_OK":
    case "UNPAIR_DENY":
    case "OTW":
    case "AGPS_BOOST":
    case "AGPS_STOP":
    case "HEALTH":
      return "System";
    default:
      return "All";
  }
}

function prettyLabel(e: DeviceEvent): string {
  const p = e.payload || {};
  switch (e.event_type) {
    case "PAIR_OK": return "✅ Paired successfully";
    case "PAIR_FAIL": return "❌ Pair failed";
    case "UNPAIR_OK": return "🔓 Unpaired by guardian";
    case "UNPAIR_DENY": return "⛔ Unpair denied";
    case "BTN_SHORT": return "🔔 Button pressed (short)";
    case "SOS": return "🚨 SOS sent";
    case "OTW": return "🚗 On the way";
    case "IN_SMS": return `💬 Incoming SMS${p?.message ? `: "${String(p.message)}"` : ""}`;
    case "AGPS_BOOST": return "📡 A-GPS boosting…";
    case "AGPS_STOP": return "📡 A-GPS detached";
    case "HEALTH": return `💊 Health ${p?.message ?? ""}`.trim();
    default: return e.event_type;
  }
}

/* Status dot: green = paired AND active within 5 minutes */
function StatusDot({ green }: { green: boolean }) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${green ? "bg-emerald-500" : "bg-zinc-400"}`} />;
}

/* ========= Pretty payload renderer ========= */
function PrettyPayload({
  p,
  mapHref,
  lat,
  lng,
}: {
  p: any;
  mapHref: string | null;
  lat?: number;
  lng?: number;
}) {
  if (!p || typeof p !== "object") return null;

  const message =
    typeof p.message === "string" && p.message.trim() ? p.message.trim() : null;

  const special = new Set(["message", "lat", "lng"]);
  const restEntries = Object.entries(p).filter(([k]) => !special.has(k));

  return (
    <div className="mt-2 rounded-lg border bg-white/90 p-3">
      {message && (
        <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[13px] font-medium text-emerald-900">
          <span>📝</span>
          <span className="whitespace-pre-wrap">{message}</span>
        </div>
      )}
      {(lat !== undefined && lng !== undefined) && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-900">
            📍 {lat.toFixed(6)}, {lng.toFixed(6)}
          </span>
          {mapHref && (
            <a
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 shadow-sm hover:bg-emerald-100 hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
              href={mapHref}
              target="_blank"
              rel="noreferrer"
            >
              <MapPin className="h-3.5 w-3.5" />
              Open in Maps
            </a>
          )}
        </div>
      )}
      {restEntries.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-2">
          {restEntries.map(([k, v]) => (
            <span key={k} className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs">
              <span className="font-medium text-zinc-700">{k}:</span>
              <span className="text-zinc-700">
                {typeof v === "string" || typeof v === "number" || typeof v === "boolean"
                  ? String(v)
                  : Array.isArray(v)
                  ? `Array(${v.length})`
                  : "Object"}
              </span>
            </span>
          ))}
        </div>
      )}
      <details className="mt-1 group">
        <summary className="cursor-pointer select-none text-xs text-zinc-500 hover:text-zinc-700">Raw JSON</summary>
        <pre className="mt-2 max-h-48 overflow-auto rounded border bg-zinc-50 p-2 text-xs">
{JSON.stringify(p, null, 2)}
        </pre>
      </details>
    </div>
  );
}

/* ========= Timeline helpers ========= */
type Tone = "danger" | "warn" | "success" | "info" | "muted";
const toneClasses: Record<Tone, string> = {
  danger: "border-red-300 bg-red-50/70",
  warn: "border-amber-300 bg-amber-50/70",
  success: "border-emerald-300 bg-emerald-50/70",
  info: "border-sky-300 bg-sky-50/70",
  muted: "border-zinc-200 bg-white/80",
};
const railClasses: Record<Tone, string> = {
  danger: "bg-red-400",
  warn: "bg-amber-400",
  success: "bg-emerald-500",
  info: "bg-sky-500",
  muted: "bg-zinc-300",
};
function getEventMeta(e: DeviceEvent): { Icon: any; tone: Tone } {
  switch (e.event_type) {
    case "SOS":        return { Icon: ShieldAlert,  tone: "danger" };
    case "BTN_SHORT":  return { Icon: Bell,         tone: "warn" };
    case "IN_SMS":     return { Icon: MessageSquareText, tone: "info" };
    case "PAIR_OK":    return { Icon: CheckCircle2, tone: "success" };
    case "PAIR_FAIL":
    case "UNPAIR_DENY":return { Icon: XCircle,      tone: "danger" };
    case "HEALTH":     return { Icon: Info,         tone: "muted" };
    default:           return { Icon: Info,         tone: "muted" };
  }
}
function dayLabel(d: Date) {
  const now = new Date();
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (a.getTime() - b.getTime()) / 86400000;
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString();
}
function compactHealth(events: DeviceEvent[]) {
  const out: (DeviceEvent & { _count?: number })[] = [];
  for (const e of events) {
    const last = out[out.length - 1];
    if (last && last.event_type === "HEALTH" && e.event_type === "HEALTH" &&
        Math.abs(Date.parse(e.created_at) - Date.parse(last.created_at)) < 90_000) {
      last._count = (last._count ?? 1) + 1;
    } else {
      out.push({ ...e });
    }
  }
  return out;
}

export default function WardenDashboard() {
  /* ----------------- App State ----------------- */
  const [sentinels, setSentinels] = useState<Sentinel[]>([]);
  const [devices, setDevices] = useState<Record<string, DeviceRow>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // CRUD
  const [openAdd, setOpenAdd] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [addHwUid, setAddHwUid] = useState("");
  const addDisabled = !fullName.trim() || !addHwUid.trim();

  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Pair flow
  const [openPair, setOpenPair] = useState(false);
  const [pairSentinelId, setPairSentinelId] = useState<string | null>(null);
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [pairExpires, setPairExpires] = useState<string | null>(null);
  const [pairHwUid, setPairHwUid] = useState("");
  const [pairLoading, setPairLoading] = useState(false);
  const [pairContact, setPairContact] = useState<string | null>(null);

  // feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // events / feed
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsFilter, setEventsFilter] = useState<string>("");
  const [tab, setTab] = useState<LogCategory>("All");

  // pairing observers
  const [pairedDeviceId, setPairedDeviceId] = useState<string | null>(null);
  const [pairUsedAt, setPairUsedAt] = useState<string | null>(null);

  // channels
  const claimChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pairOkChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pairFailChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const deviceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const mountedRef = useRef(false);

  /* ----------------- Role Protection ----------------- */
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
      if (profile?.role !== "warden") {
        window.location.href = `/dashboard/${profile?.role ?? "warden"}`;
        return;
      }
    };
    checkAccess();
  }, []);

  /* ----------------- Load sentinels + device activity ----------------- */
  const loadSentinels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sentinels")
        .select("id, full_name, phone, notes, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setSentinels(data ?? []);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to load sentinels.");
    } finally {
      setLoading(false);
    }
  };

  const loadDeviceActivity = async () => {
    if (!sentinels.length) { setDevices({}); return; }
    const { data, error } = await supabase
      .from("devices")
      .select("id, sentinel_id, last_seen_at")
      .in("sentinel_id", sentinels.map(s => s.id));
    if (!error && data) {
      const map: Record<string, DeviceRow> = {};
      for (const d of data as any[]) map[d.id] = d as DeviceRow;
      setDevices(map);
    }
  };

  useEffect(() => { loadSentinels(); }, []);
  useEffect(() => { if (sentinels.length) loadDeviceActivity(); }, [sentinels.length]);

  const filteredSentinels = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sentinels;
    return sentinels.filter((s) =>
      [s.full_name, s.phone ?? "", s.notes ?? ""].some((v) => v.toLowerCase().includes(q))
    );
  }, [sentinels, query]);

  /* ----------------- Helper: fetch contact by HW UID ----------------- */
  const fetchPairContact = async (hwUid: string) => {
    try {
      const { data } = await supabase
        .from("devices")
        .select("model")
        .eq("hw_uid", hwUid)
        .maybeSingle();
      setPairContact((data as any)?.model ?? null);
    } catch {
      setPairContact(null);
    }
  };

  /* ----------------- Sentinel CRUD (Add = Pair) ----------------- */
  const addSentinel = async () => {
    if (addDisabled) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      const { data: ins, error } = await supabase
        .from("sentinels")
        .insert({
          owner_guardian_id: user.id,
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          notes: notes.trim() || null,
        })
        .select("id")
        .single();
      if (error) throw error;

      setOpenAdd(false);
      setFullName(""); setPhone(""); setNotes("");

      setPairSentinelId(ins.id);
      setPairHwUid(addHwUid.trim());
      setOpenPair(true);
      await fetchPairContact(addHwUid.trim());
      setAddHwUid("");

      await requestPairCode(ins.id, addHwUid.trim());
    } catch (e: any) {
      setErrorMsg(String(e?.message ?? "Failed to add & pair sentinel."));
    }
  };

  const openEditFor = (s: Sentinel) => {
    setEditId(s.id); setEditName(s.full_name); setEditPhone(s.phone ?? ""); setEditNotes(s.notes ?? "");
    setOpenEdit(true);
  };
  const updateSentinel = async () => {
    if (!editId || !editName.trim()) { setErrorMsg(!editId ? "Nothing to update." : "Full name is required."); return; }
    try {
      const { error } = await supabase.from("sentinels").update({
        full_name: editName.trim(),
        phone: editPhone.trim() || null,
        notes: editNotes.trim() || null,
      }).eq("id", editId);
      if (error) throw error;
      setOpenEdit(false); setEditId(null);
      setSuccessMsg("Sentinel updated.");
      await loadSentinels();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to update sentinel.");
    }
  };

  const askDelete = (id: string) => { setDeleteId(id); setOpenDelete(true); };
  const deleteSentinel = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("sentinels").delete().eq("id", deleteId);
      if (error) throw error;
      setOpenDelete(false); setDeleteId(null);
      setSuccessMsg("Sentinel deleted.");
      await loadSentinels();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to delete sentinel.");
    }
  };

  /* ----------------- Pairing ----------------- */
  const openPairFor = (s: Sentinel) => {
    setPairSentinelId(s.id);
    setPairCode(null); setPairExpires(null);
    setPairHwUid(""); setPairUsedAt(null); setPairedDeviceId(null);
    setPairContact(null);
    setOpenPair(true);
  };

  const clearPairCode = () => {
    if (claimChannelRef.current) supabase.removeChannel(claimChannelRef.current);
    if (pairOkChannelRef.current) supabase.removeChannel(pairOkChannelRef.current);
    if (pairFailChannelRef.current) supabase.removeChannel(pairFailChannelRef.current);
    claimChannelRef.current = null; pairOkChannelRef.current = null; pairFailChannelRef.current = null;
    setPairCode(null); setPairExpires(null); setPairUsedAt(null); setPairedDeviceId(null);
    setPairContact(null);
  };

  // Robust + header-free invoke + defensive parsing
  const requestPairCode = async (forSentinelId?: string, forHwUid?: string) => {
    const sentinelId = forSentinelId ?? pairSentinelId;
    const hwUid = (forHwUid ?? pairHwUid).trim();
    if (!sentinelId) return;
    if (!hwUid) { setErrorMsg("HW UID is required to generate a pairing code."); return; }

    setPairLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not signed in.");

      await fetchPairContact(hwUid);

      // Do NOT override headers; supabase-js sets them correctly.
      const { data: resp, error } = await supabase.functions.invoke("create-claim", {
        body: { sentinel_id: sentinelId, hw_uid: hwUid },
      });
      if (error) throw new Error(error.message || "Failed to create pairing code.");

      // Accept string or object, envelope or flat
      const payload = typeof resp === "string" ? JSON.parse(resp) : (resp as any) ?? {};
      const ok = payload.ok !== undefined ? !!payload.ok : true;
      if (!ok) {
        const code = payload?.error_code as string | undefined;
        if (code === "no_such_device_available") {
          throw new Error("No such device is available. Ask your architect to add this HW UID and set it as Available.");
        }
        if (code === "device_not_available") {
          throw new Error("That device exists but is not available. Ask your architect to mark it Available.");
        }
        if (code === "device_already_assigned") {
          throw new Error("That device is already assigned to a sentinel.");
        }
        if (code === "active_claim_locked_to_different_hw") {
          throw new Error("Active pairing code is locked to a different device (HW UID mismatch).");
        }
        if (code === "sentinel_not_owned") {
          throw new Error("You don't own that sentinel.");
        }
        if (code === "missing_hw_uid") {
          throw new Error("Please enter a device HW UID.");
        }
        throw new Error(payload?.message ?? "Failed to create pairing code.");
      }

      const code = payload?.code ?? payload?.data?.code;
      const expires_at = payload?.expires_at ?? payload?.data?.expires_at;
      if (!code) throw new Error("Pairing code was not returned by the server.");

      setPairSentinelId(sentinelId);
      setPairHwUid(hwUid);
      setPairCode(String(code));
      setPairExpires(expires_at ? String(expires_at) : null);
      setSuccessMsg("Pairing code generated.");
      startPairWatchers(String(code));
    } catch (e: any) {
      setPairCode(null);
      setPairExpires(null);
      setErrorMsg(String(e?.message ?? "Failed to create pairing code."));
    } finally {
      setPairLoading(false);
    }
  };

  const startPairWatchers = (code: string) => {
    if (claimChannelRef.current) supabase.removeChannel(claimChannelRef.current);
    claimChannelRef.current = supabase
      .channel(`claim-${code}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "device_claims", filter: `code=eq.${code}` },
        (payload: any) => {
          const used_at = payload?.new?.used_at as string | null;
          if (used_at) setPairUsedAt(used_at);
        }
      ).subscribe();

    if (pairOkChannelRef.current) supabase.removeChannel(pairOkChannelRef.current);
    pairOkChannelRef.current = supabase
      .channel(`pairok-${code}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: DEVICE_EVENTS_TABLE, filter: "event_type=eq.PAIR_OK" },
        (payload: any) => {
          const p = payload?.new?.payload || {};
          if (p?.code === code) {
            const devId = String(payload.new.device_id);
            setPairedDeviceId(devId);
            setSuccessMsg("Paired successfully");
            setOpenPair(false);
            loadEventsForDevice(devId);
            startDeviceStream(devId);
            loadDeviceActivity();
          }
        }
      ).subscribe();

    if (pairFailChannelRef.current) supabase.removeChannel(pairFailChannelRef.current);
    pairFailChannelRef.current = supabase
      .channel(`pairfail-${code}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: PUBLIC_EVENTS_TABLE, filter: "type=in.(PAIR_FAIL,PAIR_OK_UNCLAIMED)" },
        (payload: any) => {
          const extras = payload?.new?.extras || {};
          if (extras?.requested_code && extras.requested_code !== code) return;
          if (payload?.new?.type === "PAIR_FAIL") {
            setErrorMsg(
              extras?.reason === "mismatch_hw"
                ? "Invalid code: This code is locked to a different device (HW UID mismatch)."
                : "Invalid or expired code. Please generate a new one."
            );
          }
        }
      ).subscribe();
  };

  /* ----------------- Events ----------------- */

  const loadAllEvents = async () => {
    setEventsLoading(true);
    try {
      const { data, error } = await supabase
        .from("v_device_event_feed")
        .select("id, created_at, event_type, payload, device_id, sentinel_id")
        .order("created_at", { ascending: false })
        .limit(200);
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
        .from("v_device_event_feed")
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
          const e = payload.new as DeviceEvent;
          if ((e as any).event_type === "GPS_SEARCH") return;
          if (pairedDeviceId && e.device_id !== pairedDeviceId) return;
          setEvents((prev) => [e, ...prev].slice(0, 500));
          if (e.event_type === "PAIR_OK") {
            setSuccessMsg("Paired successfully");
            loadDeviceActivity();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (claimChannelRef.current) supabase.removeChannel(claimChannelRef.current);
      if (pairOkChannelRef.current) supabase.removeChannel(pairOkChannelRef.current);
      if (pairFailChannelRef.current) supabase.removeChannel(pairFailChannelRef.current);
      if (deviceChannelRef.current) supabase.removeChannel(deviceChannelRef.current);
    };
  }, [pairedDeviceId]);

  const startDeviceStream = (deviceId: string) => {
    if (deviceChannelRef.current) supabase.removeChannel(deviceChannelRef.current);
    deviceChannelRef.current = supabase
      .channel(`dev-${deviceId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: DEVICE_EVENTS_TABLE, filter: `device_id=eq.${deviceId}` },
        (payload: any) => {
          const e = payload.new as DeviceEvent;
          if ((e as any).event_type === "GPS_SEARCH") return;
          setEvents((prev) => [e, ...prev].slice(0, 500));
        }
      )
      .subscribe();
  };

  const visibleEvents = useMemo(() => {
    const byTab = tab === "All" ? events : events.filter((e) => categorize(e) === tab);
    const f = eventsFilter.trim().toLowerCase();
    if (!f) return byTab;
    return byTab.filter((e) => {
      const msg = String(e?.payload?.message ?? "");
      const hw = String(e?.payload?.hw_uid ?? "");
      return (
        e.event_type?.toLowerCase().includes(f) ||
        msg.toLowerCase().includes(f) ||
        hw.toLowerCase().includes(f)
      );
    });
  }, [events, tab, eventsFilter]);

  /* ----------------- UI ----------------- */

  return (
    <>
      {/* Error / Success */}
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

      {/* Page header / list left out for brevity from previous version */}
      {/* ... keep the same Sentinels list and Events feed UI you already have ... */}

      {/* Pair modal */}
      <AlertDialog open={openPair} onOpenChange={(o) => { setOpenPair(o); if (!o) clearPairCode(); }}>
        <AlertDialogContent className="sm:max-w-[520px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Pair device</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the HW UID of an <b>available</b> device to generate a pairing code.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Lock to HW UID <span className="text-red-600">*</span></Label>
              <Input
                value={pairHwUid}
                onChange={(e) => {
                  setPairHwUid(e.target.value);
                  setPairContact(null);
                }}
                onBlur={(e) => e.target.value.trim() && fetchPairContact(e.target.value.trim())}
                placeholder="IMEI / printed UID"
              />
              {pairContact && (
                <div className="text-xs text-gray-600">
                  Device Contact #: <b>{pairContact}</b>
                </div>
              )}
            </div>

            {!pairCode ? (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => requestPairCode()}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={pairLoading || !pairSentinelId || !pairHwUid.trim()}
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
              <div className="space-y-2 rounded-md border bg-white/80 p-3">
                <div className="text-sm text-gray-600">Code</div>
                <div className="flex items-center justify-between gap-3">
                  <div className="font-mono text-2xl tracking-wider">{pairCode}</div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(pairCode!);
                        setSuccessMsg("Code copied to clipboard.");
                      }}
                    >
                      <CopyIcon className="mr-2 h-4 w-4" /> Copy
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
                <div className="text-xs rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-emerald-900">
                  Send <span className="font-mono">PAIR {pairCode}</span> to the device’s <b>Contact #</b>{" "}
                  {pairContact ? <b>{pairContact}</b> : <i>(unknown)</i>} via SMS.
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
