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

function EventBadge({ e }: { e: DeviceEvent }) {
  let Icon = Info;
  let color = "text-zinc-700 bg-zinc-100 border-zinc-200";
  switch (e.event_type) {
    case "BTN_SHORT":
      Icon = Bell; color = "text-amber-700 bg-amber-100 border-amber-200"; break;
    case "SOS":
      Icon = ShieldAlert; color = "text-red-700 bg-red-100 border-red-200"; break;
    case "IN_SMS":
      Icon = MessageSquareText; color = "text-sky-700 bg-sky-100 border-sky-200"; break;
    case "PAIR_OK":
      Icon = Info; color = "text-emerald-700 bg-emerald-100 border-emerald-200"; break;
    case "PAIR_FAIL":
    case "UNPAIR_DENY":
      Icon = Info; color = "text-rose-700 bg-rose-100 border-rose-200"; break;
    default:
      Icon = Info; color = "text-zinc-700 bg-zinc-100 border-zinc-200"; break;
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border ${color}`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="font-medium">{e.event_type}</span>
    </span>
  );
}

/* Status dot: green = paired AND active within 5 minutes */
function StatusDot({ green }: { green: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${green ? "bg-emerald-500" : "bg-zinc-400"}`}
      title={green ? "Online (paired & active)" : "Offline / Unpaired"}
    />
  );
}

/* ========= Pretty payload renderer (event-agnostic) ========= */
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
      {/* Primary message */}
      {message && (
        <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[13px] font-medium text-emerald-900">
          <span>📝</span>
          <span className="whitespace-pre-wrap">{message}</span>
        </div>
      )}

      {/* Geolocation + Maps button */}
      {(lat !== undefined && lng !== undefined) && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-900"
            title={`${lat.toFixed(6)}, ${lng.toFixed(6)}`}
          >
            📍 {lat.toFixed(6)}, {lng.toFixed(6)}
          </span>

          {mapHref && (
            <a
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 shadow-sm hover:bg-emerald-100 hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
              href={mapHref}
              target="_blank"
              rel="noreferrer"
              title={`${lat.toFixed(6)}, ${lng.toFixed(6)}`}
            >
              <MapPin className="h-3.5 w-3.5" />
              Open in Maps
            </a>
          )}
        </div>
      )}

      {/* Other simple key/values */}
      {restEntries.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-2">
          {restEntries.map(([k, v]) => (
            <span
              key={k}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs"
              title={String(v)}
            >
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

      {/* Collapsible raw JSON for debugging */}
      <details className="mt-1 group">
        <summary className="cursor-pointer select-none text-xs text-zinc-500 hover:text-zinc-700">
          Raw JSON
        </summary>
        <pre className="mt-2 max-h-48 overflow-auto rounded border bg-zinc-50 p-2 text-xs">
{JSON.stringify(p, null, 2)}
        </pre>
      </details>
    </div>
  );
}

/* ========= Timeline helpers (severity-first + grouping) ========= */
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

function getEventMeta(e: DeviceEvent): { Icon: any; tone: Tone; label: string } {
  switch (e.event_type) {
    case "SOS":        return { Icon: ShieldAlert,  tone: "danger",  label: "SOS" };
    case "BTN_SHORT":  return { Icon: Bell,         tone: "warn",    label: "Button" };
    case "IN_SMS":     return { Icon: MessageSquareText, tone: "info", label: "SMS" };
    case "PAIR_OK":    return { Icon: CheckCircle2, tone: "success", label: "Paired" };
    case "PAIR_FAIL":
    case "UNPAIR_DENY":return { Icon: XCircle,      tone: "danger",  label: "Pair error" };
    case "HEALTH":     return { Icon: Info,         tone: "muted",   label: "Health" };
    default:           return { Icon: Info,         tone: "muted",   label: e.event_type };
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
    if (
      last &&
      last.event_type === "HEALTH" &&
      e.event_type === "HEALTH" &&
      Math.abs(Date.parse(e.created_at) - Date.parse(last.created_at)) < 90_000
    ) {
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
  const [devices, setDevices] = useState<Record<string, DeviceRow>>({}); // device_id → {sentinel_id,last_seen_at}
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // CRUD
  const [openAdd, setOpenAdd] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  // Removed addHwUid since Add Sentinel no longer requires device pairing

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
  const [pairHwUid, setPairHwUid] = useState(""); // REQUIRED
  const [pairContact, setPairContact] = useState<string | null>(null); // Contact # from devices.phone
  const [pairLoading, setPairLoading] = useState(false);

  // feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // events / feed
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsFilter, setEventsFilter] = useState<string>(""); // free-text
  const [tab, setTab] = useState<LogCategory>("All");            // tabs

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
        console.log(`Access denied: ${profile?.role} cannot access warden dashboard`);
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

  // recent activity for green dots: fetch devices joined to these sentinels
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

  useEffect(() => {
    loadSentinels();
  }, []);
  useEffect(() => {
    if (sentinels.length) loadDeviceActivity();
  }, [sentinels.length]);

  const filteredSentinels = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sentinels;
    return sentinels.filter((s) =>
      [s.full_name, s.phone ?? "", s.notes ?? ""].some((v) => v.toLowerCase().includes(q))
    );
  }, [sentinels, query]);

  /* ----------------- Sentinel CRUD (Add = Pair) ----------------- */
  const addSentinel = async () => {
    if (!fullName.trim()) { setErrorMsg("Full name is required."); return; }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      // Insert the new sentinel
      const { error } = await supabase
        .from("sentinels")
        .insert({
          owner_guardian_id: user.id,
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          notes: notes.trim() || null,
        });
      if (error) throw error;

      // Clear add form and reload sentinels
      setOpenAdd(false);
      setFullName(""); setPhone(""); setNotes("");
      setSuccessMsg("Sentinel added successfully. You can now pair them with a device.");
      
      // Reload the sentinels list
      await loadSentinels();
    } catch (e: any) {
      const msg = String(e?.message ?? "Failed to add sentinel.");
      setErrorMsg(msg);
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

  // Robust: supports success {code,expires_at} or error {ok:false,error_code,...}
  const requestPairCode = async (forSentinelId?: string, forHwUid?: string) => {
    const sentinelId = forSentinelId ?? pairSentinelId;
    const hwUid = (forHwUid ?? pairHwUid).trim();
    if (!sentinelId) return;
    if (!hwUid) { setErrorMsg("Device ID (HW UID) is required to generate a pairing code."); return; }

    setPairLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not signed in.");

      const { data, error } = await supabase.functions.invoke("create-claim", {
        body: { sentinel_id: sentinelId, hw_uid: hwUid },
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw new Error(error.message || "Failed to create pairing code.");

      const payload = data as any;

      // Success path 1: legacy shape {code, expires_at}
      if (payload?.code && payload?.expires_at) {
        const code = payload.code as string;
        const expires_at = payload.expires_at as string;

        // Fetch device contact number (stored in devices.phone)
        const { data: dev, error: devError } = await supabase
          .from("devices")
          .select("hw_uid, phone, model")
          .eq("hw_uid", hwUid)
          .maybeSingle();
        
        console.log("Device lookup:", { hwUid, dev, devError, phoneValue: dev?.phone, modelValue: dev?.model });
        
        // Try phone field first, fallback to model field for backwards compatibility
        const contactNumber = dev?.phone || dev?.model || null;
        setPairContact(contactNumber);
        
        if (!contactNumber) {
          console.warn("No contact number found for device:", hwUid, "Device data:", dev);
        }

        setPairSentinelId(sentinelId);
        setPairHwUid(hwUid);
        setPairCode(code);
        setPairExpires(expires_at);
        setSuccessMsg("Pairing code generated.");
        startPairWatchers(code);
        return;
      }

      // Success path 2: newer shape {ok:true, code, expires_at}
      if (payload?.ok && payload?.code && payload?.expires_at) {
        const code = payload.code as string;
        const expires_at = payload.expires_at as string;

        const { data: dev, error: devError } = await supabase
          .from("devices")
          .select("hw_uid, phone, model")
          .eq("hw_uid", hwUid)
          .maybeSingle();
        
        console.log("Device lookup (path 2):", { hwUid, dev, devError, phoneValue: dev?.phone, modelValue: dev?.model });
        
        // Try phone field first, fallback to model field for backwards compatibility
        const contactNumber = dev?.phone || dev?.model || null;
        setPairContact(contactNumber);
        
        if (!contactNumber) {
          console.warn("No contact number found for device:", hwUid, "Device data:", dev);
        }

        setPairSentinelId(sentinelId);
        setPairHwUid(hwUid);
        setPairCode(code);
        setPairExpires(expires_at);
        setSuccessMsg("Pairing code generated.");
        startPairWatchers(code);
        return;
      }

      // Error envelope from edge function
      if (payload?.ok === false) {
        const code = payload?.error_code as string | undefined;
        if (code === "no_such_device_available") {
          setErrorMsg("No such device is available. Ask your architect to add this Device ID and mark it Available.");
        } else if (code === "device_not_available") {
          setErrorMsg("That device exists but is not marked Available.");
        } else if (code === "device_already_assigned") {
          setErrorMsg("That device is already assigned to a sentinel.");
        } else if (code === "active_claim_locked_to_different_hw") {
          setErrorMsg("Active pairing code is locked to a different device (HW UID mismatch).");
        } else if (code === "sentinel_not_owned") {
          setErrorMsg("You don't own that sentinel.");
        } else if (code === "missing_hw_uid") {
          setErrorMsg("Please enter a Device ID.");
        } else {
          setErrorMsg(payload?.message ?? "Failed to create pairing code.");
        }
        return;
      }

      // Unknown payload
      setErrorMsg("Failed to create pairing code.");
    } catch (e: any) {
      const msg = String(e?.message ?? "Failed to create pairing code.");
      // Friendly downgrades for known reasons embedded in messages (if any)
      if (msg.includes("no_such_device_available")) {
        setErrorMsg("No such device is available. Ask your architect to add this Device ID and set it as Available.");
      } else if (msg.includes("device_not_available")) {
        setErrorMsg("That device exists but is not available. Ask your architect to mark it Available.");
      } else {
        setErrorMsg(msg);
      }
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
            loadDeviceActivity(); // refresh green dots
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

  // Prefer the VIEW to hide GPS search noise
  const loadAllEvents = async () => {
    setEventsLoading(true);
    try {
      const { data, error } = await supabase
        .from("v_device_event_feed") // ← change to DEVICE_EVENTS_TABLE if needed
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
        .from("v_device_event_feed") // ← change to DEVICE_EVENTS_TABLE if needed
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

  // Global realtime
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
          if ((e as any).event_type === "GPS_SEARCH") return; // defensive filter
          if (pairedDeviceId && e.device_id !== pairedDeviceId) return;
          setEvents((prev) => [e, ...prev].slice(0, 500));
          if (e.event_type === "PAIR_OK") {
            setSuccessMsg("Paired successfully");
            loadDeviceActivity(); // update status dots
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

  // Device-only realtime
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

  // Tabs + search filter
  const visibleEvents = useMemo(() => {
    const byTab =
      tab === "All" ? events : events.filter((e) => categorize(e) === tab);
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
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-gray-800">
              <User className="h-5 w-5 text-emerald-700" />
              <h1 className="text-xl font-semibold tracking-tight">
                Your Sentinels
                {pairedDeviceId ? (
                  <span className="ml-3 text-sm text-gray-500">
                    • Focused on device <span className="font-mono">{pairedDeviceId.slice(0, 8)}…</span>
                  </span>
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
                  className="w-64 bg-white/80 pl-8"
                />
              </div>
              <Button onClick={() => setOpenAdd(true)} className="bg-emerald-600 hover:bg-emerald-700 shadow-sm">
                <Plus className="mr-2 h-4 w-4" /> Add & Pair
              </Button>
            </div>
          </div>

          {/* Sentinels */}
          {!loading && filteredSentinels.length === 0 ? (
            <Card className="bg-white/90 border-emerald-200">
              <CardHeader><CardTitle>No Sentinels yet</CardTitle></CardHeader>
              <CardContent className="text-gray-600">
                Add your first Sentinel and pair an available device.
              </CardContent>
            </Card>
          ) : loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="h-36 animate-pulse bg-white/70 border-emerald-100" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredSentinels.map((s) => {
                // green dot if any device for this sentinel is paired & active in last 5min
                const anyGreen = Object.values(devices).some(
                  d => d.sentinel_id === s.id && d.last_seen_at && (Date.now() - Date.parse(d.last_seen_at)) < 5 * 60 * 1000
                );
                return (
                  <Card key={s.id} className="bg-white/90 border-emerald-200 shadow-sm transition-shadow hover:shadow-md">
                    <CardHeader className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <StatusDot green={anyGreen} />
                        <User className="h-5 w-5 text-emerald-600" /> {s.full_name}
                      </CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openPairFor(s)}>
                            <LinkIcon className="mr-2 h-4 w-4" /> Pair device
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditFor(s)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => askDelete(s.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-gray-700">
                      <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {s.phone || "—"}</div>
                      <div className="flex items-start gap-2">
                        <StickyNote className="mt-0.5 h-4 w-4" />
                        <span className="line-clamp-3">{s.notes || "No notes"}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Live Events */}
          <div className="mt-6">
            <Card className="bg-white/90 border-emerald-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ActivitySquare className="h-5 w-5 text-emerald-700" />
                  {pairedDeviceId ? "Device Log (live)" : "Live Device Events (all)"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Filter row: tabs + free-text */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex gap-2 border-b pb-2">
                    {(["All", "Button", "SOS", "SMS", "System"] as LogCategory[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`rounded-md px-2.5 py-1 text-sm ${
                          t === tab ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
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
                  <div className="flex h-48 flex-col items-center justify-center rounded-xl border bg-white/80 p-6 text-center">
                    <div className="mb-2 text-6xl">🛰️</div>
                    <div className="text-sm text-gray-600">No events yet. Events from your device will appear here in realtime.</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(() => {
                      const items = compactHealth(visibleEvents).slice(0, 200);
                      let currentDay = "";
                      return items.map((e) => {
                        const p = e.payload || {};
                        const lat = typeof p.lat === "number" ? p.lat : undefined;
                        const lng = typeof p.lng === "number" ? p.lng : undefined;
                        const mapHref = (lat !== undefined && lng !== undefined)
                          ? `https://maps.google.com/maps?q=${lat},${lng}` : null;

                        const when = new Date(e.created_at);
                        const day = dayLabel(when);
                        const { Icon, tone } = getEventMeta(e);

                        const header = (
                          <div className="flex min-w-0 items-center gap-2">
                            <div className={`h-8 w-8 shrink-0 rounded-full ring-2 ring-white flex items-center justify-center ${
                              tone === "danger" ? "bg-red-100" :
                              tone === "warn" ? "bg-amber-100" :
                              tone === "success" ? "bg-emerald-100" :
                              tone === "info" ? "bg-sky-100" : "bg-zinc-100"
                            }`}>
                              <Icon className={`h-4 w-4 ${
                                tone === "danger" ? "text-red-700" :
                                tone === "warn" ? "text-amber-700" :
                                tone === "success" ? "text-emerald-700" :
                                tone === "info" ? "text-sky-700" : "text-zinc-700"
                              }`} />
                            </div>
                            <div className="truncate">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">{prettyLabel(e)}</span>
                                {(e as any)._count ? (
                                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600">
                                    ×{(e as any)._count}
                                  </span>
                                ) : null}
                              </div>
                              <div className="text-xs text-gray-500">
                                {when.toLocaleTimeString()}
                                {e.device_id ? (
                                  <span className="ml-1 text-[11px] text-gray-500">
                                    • dev <span className="font-mono">{e.device_id.slice(0, 8)}…</span>
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );

                        const card = (
                          <div
                            key={String(e.id)}
                            className={`relative rounded-md border p-3 text-sm ${toneClasses[tone]}`}
                          >
                            <div className={`absolute left-0 top-0 h-full w-1.5 rounded-l-md ${railClasses[tone]}`} />
                            {header}
                            <PrettyPayload p={p} mapHref={mapHref} lat={lat} lng={lng} />
                          </div>
                        );

                        const daySep =
                          day !== currentDay ? (
                            (currentDay = day),
                            <div key={`sep-${day}`} className="mt-4 mb-2 flex items-center gap-2">
                              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-300 to-transparent" />
                              <span className="text-xs font-medium text-zinc-600">{day}</span>
                              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-300 to-transparent" />
                            </div>
                          ) : null;

                        return (
                          <div key={`wrap-${e.id}`} className="space-y-2">
                            {daySep}
                            {card}
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add / Edit / Delete / Pair modals */}
      <AlertDialog open={openAdd} onOpenChange={setOpenAdd}>
        <AlertDialogContent className="sm:max-w-[520px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Add Sentinel</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the sentinel and warden details. You can pair with a device later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Name of the Sentinel</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Juan Dela Cruz" />
            </div>
            <div className="space-y-1"><Label>Number of the Warden</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" />
            </div>
            <div className="space-y-1"><Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, conditions…" />
            </div>
          </div>
          <AlertDialogFooter>
            <Button variant="ghost" onClick={() => setOpenAdd(false)}>Cancel</Button>
            <AlertDialogAction disabled={!fullName.trim()} onClick={addSentinel}>Add Sentinel</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={openEdit} onOpenChange={setOpenEdit}>
        <AlertDialogContent className="sm:max-w-[520px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Edit Sentinel</AlertDialogTitle>
            <AlertDialogDescription>Update the sentinel’s info.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Full Name</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
            <div className="space-y-1"><Label>Phone</Label><Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} /></div>
            <div className="space-y-1"><Label>Notes</Label><Input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} /></div>
          </div>
          <AlertDialogFooter>
            <Button variant="ghost" onClick={() => setOpenEdit(false)}>Cancel</Button>
            <AlertDialogAction onClick={updateSentinel}>Save Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sentinel?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the sentinel record. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="ghost" onClick={() => setOpenDelete(false)}>Cancel</Button>
            <Button onClick={deleteSentinel} className="bg-red-600 text-white hover:bg-red-700">Delete</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={openPair} onOpenChange={(o) => { setOpenPair(o); if (!o) clearPairCode(); }}>
        <AlertDialogContent className="sm:max-w-[520px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Pair device</AlertDialogTitle>
            <AlertDialogDescription>Enter an <b>available</b> Device ID to generate a pairing code.</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Device ID (HW UID) <span className="text-red-600">*</span></Label>
              <Input value={pairHwUid} onChange={(e) => setPairHwUid(e.target.value)} placeholder="IMEI / printed UID" />
            </div>

            {!pairCode ? (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => requestPairCode()}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={pairLoading || !pairSentinelId || !pairHwUid.trim()}
                >
                  {pairLoading ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Generating…</span> : "Generate code"}
                </Button>
              </div>
            ) : (
              <div className="space-y-2 rounded-md border bg-white/80 p-3">
                <div className="text-sm text-gray-600">Code</div>
                <div className="flex items-center justify-between gap-3">
                  <div className="font-mono text-2xl tracking-wider">{pairCode}</div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={async () => {
                      await navigator.clipboard.writeText(pairCode!);
                      setSuccessMsg("Code copied to clipboard.");
                    }}>
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
                <div className="text-sm text-emerald-700 font-medium mt-2">
                  Send <span className="font-mono">PAIR {pairCode}</span> to{" "}
                  <span className="font-mono">{pairContact ?? "the device’s Contact #"}</span>.
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
