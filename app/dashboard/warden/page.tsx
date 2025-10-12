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
    case "BTN_LONG":
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
    case "DEVICE_ONLINE":
    case "DEVICE_OFFLINE":
    case "LOCATION_UPDATE":
      return "System";
    default:
      return "All";
  }
}

function prettyLabel(e: DeviceEvent): string {
  const p = e.payload || {};
  switch (e.event_type) {
    case "PAIR_OK": return "✅ Device Successfully Connected";
    case "PAIR_FAIL": return "❌ Device Connection Failed";
    case "UNPAIR_OK": return "🔌 Device Disconnected by Guardian";
    case "UNPAIR_DENY": return "⚠️ Device Disconnection Denied";
    case "BTN_SHORT": return "🔘 Emergency Button Activated";
    case "BTN_LONG": return "🔘 Emergency Button Held (Long Press)";
    case "SOS": return "🆘 Emergency SOS Signal Sent";
    case "OTW": return "🚗 Help is On The Way";
    case "IN_SMS": return `📱 Text Message Received${p?.message ? `: "${String(p.message)}"` : ""}`;
    case "AGPS_BOOST": return "🛰️ GPS Signal Boosting Active";
    case "AGPS_STOP": return "🛰️ GPS Signal Boost Completed";
    case "HEALTH": {
      const healthMsg = p?.message || "";
      if (healthMsg.toLowerCase().includes("battery")) return `🔋 Battery Status: ${healthMsg}`;
      if (healthMsg.toLowerCase().includes("signal")) return `📶 Signal Status: ${healthMsg}`;
      return `💓 Health Check: ${healthMsg}`.trim();
    }
    case "LOCATION_UPDATE": return "📍 Location Updated";
    case "DEVICE_ONLINE": return "🟢 Device Came Online";
    case "DEVICE_OFFLINE": return "🔴 Device Went Offline";
    default: return `📊 ${e.event_type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}`;
  }
}

function EventBadge({ e }: { e: DeviceEvent }) {
  let Icon = Info;
  let color = "text-zinc-700 bg-zinc-100 border-zinc-200";
  switch (e.event_type) {
    case "BTN_SHORT":
    case "BTN_LONG":
      Icon = Bell; color = "text-amber-800 bg-amber-50 border-amber-300 shadow-sm"; break;
    case "SOS":
      Icon = ShieldAlert; color = "text-red-800 bg-red-50 border-red-300 shadow-sm font-semibold"; break;
    case "IN_SMS":
      Icon = MessageSquareText; color = "text-blue-800 bg-blue-50 border-blue-300 shadow-sm"; break;
    case "PAIR_OK":
    case "UNPAIR_OK":
      Icon = CheckCircle; color = "text-emerald-800 bg-emerald-50 border-emerald-300 shadow-sm"; break;
    case "PAIR_FAIL":
    case "UNPAIR_DENY":
      Icon = AlertTriangle; color = "text-red-800 bg-red-50 border-red-300 shadow-sm"; break;
    case "OTW":
      Icon = CheckCircle; color = "text-green-800 bg-green-50 border-green-300 shadow-sm font-semibold"; break;
    case "HEALTH":
    case "AGPS_BOOST":
    case "AGPS_STOP":
      Icon = ActivitySquare; color = "text-purple-800 bg-purple-50 border-purple-300 shadow-sm"; break;
    case "LOCATION_UPDATE":
      Icon = MapPin; color = "text-teal-800 bg-teal-50 border-teal-300 shadow-sm"; break;
    case "DEVICE_ONLINE":
      Icon = CheckCircle; color = "text-emerald-800 bg-emerald-50 border-emerald-300 shadow-sm"; break;
    case "DEVICE_OFFLINE":
      Icon = AlertTriangle; color = "text-gray-800 bg-gray-50 border-gray-300 shadow-sm"; break;
    default:
      Icon = Info; color = "text-slate-800 bg-slate-50 border-slate-300 shadow-sm"; break;
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

export default function WardenDashboard() {
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
  const addDisabled = !fullName.trim();

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

  /* ----------------- Sentinel CRUD ----------------- */
  const addSentinel = async () => {
    if (addDisabled) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
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
      setOpenEdit(false);
      setSuccessMsg("Sentinel updated.");
      await loadSentinels();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to update sentinel.");
    }
  };
  const deleteSentinel = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("sentinels").delete().eq("id", deleteId);
      if (error) throw error;
      setOpenDelete(false);
      setSuccessMsg("Sentinel deleted.");
      await loadSentinels();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to delete sentinel.");
    }
  };

  /* ----------------- Pairing flow ----------------- */
  const openPairDialog = (sentinelId: string) => {
    setPairSentinelId(sentinelId);
    setPairCode(null);
    setPairExpires(null);
    setPairHwUid("");
    setOpenPair(true);
  };
  const generatePairCode = async () => {
    if (!pairSentinelId) return;
    setPairLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          "Authorization": `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ sentinel_id: pairSentinelId, hw_uid: pairHwUid.trim() || undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setPairCode(json.code);
      setPairExpires(json.expires_at);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to generate pairing code.");
    } finally {
      setPairLoading(false);
    }
  };

  /* ----------------- Real-time events ----------------- */
  const filterEventLogs = (events: DeviceEvent[]) => {
    if (!eventsFilter.trim()) return events;
    const lc = eventsFilter.trim().toLowerCase();
    return events.filter((e) => {
      const label = prettyLabel(e).toLowerCase();
      const payload = JSON.stringify(e.payload || {}).toLowerCase();
      return label.includes(lc) || e.event_type.toLowerCase().includes(lc) || payload.includes(lc);
    });
  };
  const categoryMatches = (e: DeviceEvent) => {
    if (tab === "All") return true;
    return categorize(e) === tab;
  };
  const displayedEvents = useMemo(() => {
    const filtered = filterEventLogs(events);
    return filtered.filter(categoryMatches).slice(0, 200);
  }, [events, eventsFilter, tab]);

  // Load events when component mounts
  useEffect(() => {
    (async () => {
      if (!sentinels.length) { setEvents([]); setEventsLoading(false); return; }
      setEventsLoading(true);
      try {
        const sentinelIds = sentinels.map(s => s.id);
        const { data, error } = await supabase
          .from(DEVICE_EVENTS_TABLE)
          .select("id, created_at, device_id, sentinel_id, event_type, payload")
          .in("sentinel_id", sentinelIds)
          .order("created_at", { ascending: false })
          .limit(500);
        if (error) throw error;
        setEvents((data ?? []) as DeviceEvent[]);
      } catch (e: any) {
        setErrorMsg(e?.message ?? "Failed to load events.");
      } finally {
        setEventsLoading(false);
      }
    })();
  }, [sentinels.length]);

  // Real-time subscriptions
  useEffect(() => {
    if (!sentinels.length) return;
    if (!mountedRef.current) { mountedRef.current = true; return; }

    const sentinelIds = sentinels.map(s => s.id);
    const IN = sentinelIds.length ? `in.(${sentinelIds.join(",")})` : "in.(00000000-0000-0000-0000-000000000000)";

    // Events channel
    const eventsChannel = supabase.channel("warden-events");
    eventsChannel.on("postgres_changes", {
      event: "INSERT", schema: "public", table: DEVICE_EVENTS_TABLE,
      filter: `sentinel_id=${IN}`
    }, (payload) => {
      const e = payload.new as DeviceEvent;
      setEvents(prev => [e, ...prev]);
      if (e.event_type === "PAIR_OK") setSuccessMsg("Device paired successfully!");
    });

    // Device activity channel
    const deviceChannel = supabase.channel("warden-device-activity");
    deviceChannel.on("postgres_changes", {
      event: "UPDATE", schema: "public", table: "devices",
      filter: `sentinel_id=${IN}`
    }, (payload) => {
      const d = payload.new as any;
      setDevices(prev => ({ ...prev, [d.id]: { id: d.id, sentinel_id: d.sentinel_id, last_seen_at: d.last_seen_at } }));
    });

    // Pairing observation
    if (pairSentinelId && pairCode) {
      const pairChannel = supabase.channel("pair-observation");
      pairChannel.on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "device_claims",
        filter: `sentinel_id=eq.${pairSentinelId}`
      }, (payload) => {
        const claim = payload.new as any;
        if (claim.used_at) {
          setPairUsedAt(claim.used_at);
          // Look up device ID
          (async () => {
            const { data } = await supabase.from("devices").select("id").eq("hw_uid", claim.hw_uid).single();
            if (data) setPairedDeviceId(data.id);
          })();
        }
      });
      pairChannel.subscribe();
      pairOkChannelRef.current = pairChannel;
    }

    eventsChannel.subscribe();
    deviceChannel.subscribe();
    deviceChannelRef.current = deviceChannel;

    return () => {
      eventsChannel.unsubscribe();
      deviceChannel.unsubscribe();
      if (pairOkChannelRef.current) pairOkChannelRef.current.unsubscribe();
    };
  }, [sentinels.length, pairSentinelId, pairCode]);

  return (
    <div className="space-y-6">
      {/* Error/Success modals */}
      <AlertDialog open={!!errorMsg} onOpenChange={(open) => !open && setErrorMsg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" /> Error
            </AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-wrap">{errorMsg}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorMsg(null)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!successMsg} onOpenChange={(open) => !open && setSuccessMsg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" /> Success
            </AlertDialogTitle>
            <AlertDialogDescription>{successMsg}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setSuccessMsg(null)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main content */}
      <div className="space-y-6">
        {/* Header with search and add */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Protected</h1>
            <p className="text-gray-600">Manage your family members and their emergency devices</p>
          </div>
          <Button onClick={() => setOpenAdd(true)} className="bg-gradient-to-r from-emerald-500 to-teal-500">
            <Plus className="w-4 h-4 mr-2" />
            Add Sentinel
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, phone, or notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sentinels grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredSentinels.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <User className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No sentinels found</h3>
              <p className="text-gray-600 mb-4">
                {query.trim() ? "No sentinels match your search." : "Add your first family member to get started."}
              </p>
              {!query.trim() && (
                <Button onClick={() => setOpenAdd(true)} className="bg-gradient-to-r from-emerald-500 to-teal-500">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Sentinel
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSentinels.map((s) => {
              const deviceList = Object.values(devices).filter(d => d.sentinel_id === s.id);
              const anyOnline = deviceList.some(d => d.last_seen_at && (Date.now() - Date.parse(d.last_seen_at)) < 5 * 60 * 1000);
              return (
                <Card key={s.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-emerald-600" />
                        <CardTitle className="text-lg">{s.full_name}</CardTitle>
                        <StatusDot green={anyOnline} />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditFor(s)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openPairDialog(s.id)}>
                            <LinkIcon className="h-4 w-4 mr-2" />
                            Pair Device
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => { setDeleteId(s.id); setOpenDelete(true); }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {s.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        {s.phone}
                      </div>
                    )}
                    {s.notes && (
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <StickyNote className="h-4 w-4 mt-0.5 shrink-0" />
                        <span className="break-words">{s.notes}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-gray-500">
                        {deviceList.length} device{deviceList.length !== 1 ? "s" : ""} paired
                      </span>
                      <Button 
                        onClick={() => openPairDialog(s.id)} 
                        size="sm" 
                        variant="outline"
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      >
                        <LinkIcon className="h-3 w-3 mr-1" />
                        Pair Device
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Events feed */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ActivitySquare className="h-5 w-5 text-emerald-600" />
                  Recent Activity
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Live feed of all device events</p>
              </div>
              {eventsLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filter tabs */}
            <div className="flex gap-1 border-b pb-2">
              {(["All", "Button", "SOS", "SMS", "System"] as LogCategory[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    tab === t
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Search filter */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Filter by type/message/HW UID… (e.g. SOS, OTW, HEALTH)"
                value={eventsFilter}
                onChange={(e) => setEventsFilter(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>

            {/* Events list */}
            {eventsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : displayedEvents.length === 0 ? (
              <div className="text-center py-8">
                <ActivitySquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No events yet</h3>
                <p className="text-gray-600">
                  {eventsFilter.trim() || tab !== "All" ? "No events match your filters." : "Events from your devices will appear here."}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {displayedEvents.map((e) => {
                  const p = e.payload || {};
                  const lat = Number(p.lat);
                  const lng = Number(p.lng);
                  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);
                  const msg = prettyLabel(e);
                  const mapHref = hasLocation
                    ? `https://maps.google.com/maps?q=${lat},${lng}` : null;

                  return (
                    <div key={e.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <EventBadge e={e} />
                            <div className="text-xs text-gray-500">
                              {new Date(e.created_at).toLocaleString()}
                            </div>
                          </div>

                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {msg}
                          </div>

                          {hasLocation && (
                            <div className="mt-2">
                              <a
                                className="inline-flex items-center gap-1 rounded-full border-2 border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 transition-colors shadow-sm"
                                href={mapHref!}
                                target="_blank"
                                rel="noreferrer"
                                title={`${lat?.toFixed(6)}, ${lng?.toFixed(6)}`}
                              >
                                <MapPin className="h-4 w-4" />
                                📍 Open in Maps
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Sentinel Dialog */}
      <AlertDialog open={openAdd} onOpenChange={setOpenAdd}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Sentinel</AlertDialogTitle>
            <AlertDialogDescription>
              Add a family member or person you want to protect with our emergency monitoring system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Medical conditions, emergency contacts, etc."
              />
            </div>
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setOpenAdd(false)}>
              Cancel
            </Button>
            <Button onClick={addSentinel} disabled={addDisabled}>
              Add Sentinel
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Sentinel Dialog */}
      <AlertDialog open={openEdit} onOpenChange={setOpenEdit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Sentinel Details</AlertDialogTitle>
            <AlertDialogDescription>
              Update the information for this protected person.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editFullName">Full Name *</Label>
              <Input
                id="editFullName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPhone">Phone Number</Label>
              <Input
                id="editPhone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editNotes">Notes</Label>
              <Input
                id="editNotes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Medical conditions, emergency contacts, etc."
              />
            </div>
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>
              Cancel
            </Button>
            <Button onClick={updateSentinel}>
              Save Changes
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Sentinel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this sentinel? This will also unpair any associated devices. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setOpenDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteSentinel}>
              Remove Sentinel
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pairing Dialog */}
      <AlertDialog open={openPair} onOpenChange={setOpenPair}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Pair Emergency Device</AlertDialogTitle>
            <AlertDialogDescription>
              Generate a pairing code to connect an emergency device to this sentinel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pairHwUid">Device Hardware ID (Optional)</Label>
              <Input
                id="pairHwUid"
                value={pairHwUid}
                onChange={(e) => setPairHwUid(e.target.value)}
                placeholder="Leave blank for any device"
              />
            </div>
            
            {pairCode ? (
              <div className="space-y-3">
                <div className="text-center p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="text-xs text-emerald-600 uppercase tracking-wide font-semibold mb-1">
                    Pairing Code
                  </div>
                  <div className="text-2xl font-mono font-bold text-emerald-800 tracking-wider">
                    {pairCode}
                  </div>
                  <div className="text-xs text-emerald-600 mt-2">
                    Expires: {pairExpires ? new Date(pairExpires).toLocaleString() : "Unknown"}
                  </div>
                </div>
                
                <Button
                  onClick={() => navigator.clipboard.writeText(pairCode)}
                  variant="outline"
                  className="w-full"
                >
                  <CopyIcon className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>

                {pairUsedAt && (
                  <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-sm font-semibold text-green-800">Successfully Paired!</div>
                    <div className="text-xs text-green-600">
                      Paired at: {new Date(pairUsedAt).toLocaleString()}
                    </div>
                    {pairedDeviceId && (
                      <div className="text-xs text-green-600">
                        Device ID: {pairedDeviceId}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Button onClick={generatePairCode} disabled={pairLoading} className="w-full">
                {pairLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Pairing Code"
                )}
              </Button>
            )}
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setOpenPair(false)}>
              Close
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
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
    case "PAIR_OK": return "Paired successfully";
    case "PAIR_FAIL": return "Pair failed";
    case "UNPAIR_OK": return "Unpaired by guardian";
    case "UNPAIR_DENY": return "Unpair denied";
    case "BTN_SHORT": return "Button pressed (short)";
    case "SOS": return "SOS sent";
    case "OTW": return "On the way";
    case "IN_SMS": return `Incoming SMS${p?.message ? `: “${String(p.message)}”` : ""}`;
    case "AGPS_BOOST": return "A-GPS boosting…";
    case "AGPS_STOP": return "A-GPS detached";
    case "HEALTH": return `Health ${p?.message ?? ""}`.trim();
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
  const addDisabled = !fullName.trim();

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

  /* ----------------- Sentinel CRUD ----------------- */
  const addSentinel = async () => {
    if (addDisabled) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
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
    setOpenPair(true);
  };
  const clearPairCode = () => {
    if (claimChannelRef.current) supabase.removeChannel(claimChannelRef.current);
    if (pairOkChannelRef.current) supabase.removeChannel(pairOkChannelRef.current);
    if (pairFailChannelRef.current) supabase.removeChannel(pairFailChannelRef.current);
    claimChannelRef.current = null; pairOkChannelRef.current = null; pairFailChannelRef.current = null;
    setPairCode(null); setPairExpires(null); setPairUsedAt(null); setPairedDeviceId(null);
  };
  const requestPairCode = async () => {
    if (!pairSentinelId) return;
    setPairLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not signed in.");
      const { data, error } = await supabase.functions.invoke("create-claim", {
        body: { sentinel_id: pairSentinelId, hw_uid: pairHwUid || undefined },
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (error) throw new Error(error.message || "Failed to create pairing code.");
      const code = (data as any).code as string;
      const expires_at = (data as any).expires_at as string;
      setPairCode(code); setPairExpires(expires_at);
      setSuccessMsg("Pairing code generated.");
      startPairWatchers(code);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to create pairing code.");
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
      // switch to TABLE if you haven't created the view v_device_event_feed yet:
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

  // Global realtime (table) + PAIR_OK toast + GPS_SEARCH filter
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
                <Plus className="mr-2 h-4 w-4" /> Add Sentinel
              </Button>
            </div>
          </div>

          {/* Sentinels */}
          {!loading && filteredSentinels.length === 0 ? (
            <Card className="bg-white/90 border-emerald-200">
              <CardHeader><CardTitle>No Sentinels yet</CardTitle></CardHeader>
              <CardContent className="text-gray-600">
                Add your first Sentinel to start managing their safety profile.
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
                    {visibleEvents.slice(0, 200).map((e) => {
                      const p = e.payload || {};
                      const msg = typeof p.message === "string" ? p.message : "";
                      const lat = typeof p.lat === "number" ? p.lat : undefined;
                      const lng = typeof p.lng === "number" ? p.lng : undefined;
                      const mapHref = (lat !== undefined && lng !== undefined)
                        ? `https://maps.google.com/maps?q=${lat},${lng}` : null;

                      return (
                        <div key={String(e.id)} className="rounded-md border bg-white/80 p-3 text-sm">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <EventBadge e={e} />
                                <div className="truncate">{prettyLabel(e)}</div>
                                <span className="text-xs text-gray-500">
                                  {new Date(e.created_at).toLocaleTimeString()}
                                </span>
                                {e.device_id ? (
                                  <span className="text-[11px] text-gray-500">
                                    • dev <span className="font-mono">{e.device_id.slice(0, 8)}…</span>
                                  </span>
                                ) : null}
                              </div>

                              {msg && <div className="mt-1 text-gray-800">{msg}</div>}

                              {mapHref && (
                                <div className="mt-1">
                                  <a
                                    className="inline-flex items-center gap-1 rounded-full border-2 border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 transition-colors shadow-sm"
                                    href={mapHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={`${lat?.toFixed(6)}, ${lng?.toFixed(6)}`}
                                  >
                                    <MapPin className="h-4 w-4" />
                                    📍 Open in Maps
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Full JSON payload (append-only detailed log) */}
                          <pre className="mt-2 max-h-48 overflow-auto rounded border bg-zinc-50 p-2 text-xs">
{JSON.stringify(p, null, 2)}
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

      {/* Add / Edit / Delete / Pair modals */}
      <AlertDialog open={openAdd} onOpenChange={setOpenAdd}>
        <AlertDialogContent className="sm:max-w-[520px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Add Sentinel</AlertDialogTitle>
            <AlertDialogDescription>Create a device user profile you can assign to a device later.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Full Name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Juan Dela Cruz" /></div>
            <div className="space-y-1"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" /></div>
            <div className="space-y-1"><Label>Notes</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, conditions…" /></div>
          </div>
          <AlertDialogFooter>
            <Button variant="ghost" onClick={() => setOpenAdd(false)}>Cancel</Button>
            <AlertDialogAction disabled={addDisabled} onClick={addSentinel}>Save</AlertDialogAction>
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
            <AlertDialogDescription>Generate a short code and enter it on the device. Optionally lock the claim to a specific HW UID (IMEI).</AlertDialogDescription>
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
                      await navigator.clipboard.writeText(pairCode);
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
