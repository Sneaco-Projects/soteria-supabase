"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase-client";

import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ActivitySquare, AlertTriangle, CheckCircle, HeartPulse, ListFilter, MapPin,
  Search, Shield, Siren, User, Users, Smartphone, Stethoscope, Clock, X,
  ShieldAlert, Bell, MessageSquareText, CheckCircle2, XCircle, Info
} from "lucide-react";

/** Tables:
 * - provider_assignments(provider_id, sentinel_id)
 * - sentinels(id, full_name, phone, notes, owner_guardian_id)
 * - profiles(id, email, display_name)
 * - devices(id, hw_uid, model, sentinel_id, last_seen_at)
 * - device_events(id, created_at, event_type, payload, device_id, sentinel_id)
 */

type Profile = { id: string; email: string; display_name: string | null };
type Sentinel = { id: string; full_name: string; phone: string | null; notes: string | null; owner_guardian_id: string };
type Device = { id: string; hw_uid: string | null; model: string | null; sentinel_id: string | null; last_seen_at: string | null };
type Assignment = { provider_id: string; sentinel_id: string };
type DeviceEvent = {
  id: string | number;
  created_at: string;
  device_id: string;
  sentinel_id: string | null;
  event_type: string;
  payload: any;
};

type WardenDetails = {
  id: string;
  email: string;
  display_name: string | null;
  registered_at: string;
  sentinel_count: number;
  device_count: number;
  latest_activity: string | null;
  sentinels: Array<{
    id: string;
    full_name: string;
    phone: string | null;
    notes: string | null;
    created_at: string;
    device_count: number;
    latest_event: string | null;
  }>;
};

export default function ProviderDashboard() {
  // Role protection
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

      if (profile?.role !== "provider") {
        console.log(`Access denied: ${profile?.role} cannot access provider dashboard`);
        window.location.href = `/dashboard/${profile?.role ?? "warden"}`;
        return;
      }
    };

    checkAccess();
  }, []);

  // UX
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tabs
  const [tab, setTab] = useState<"my-sentinels" | "incidents" | "directory">("my-sentinels");

  // Core data
  const [me, setMe] = useState<Profile | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [sentinels, setSentinels] = useState<Sentinel[]>([]);
  const [wardenProfiles, setWardenProfiles] = useState<Record<string, Profile>>({});  // guardian = warden
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  // Events
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [focusedDeviceId, setFocusedDeviceId] = useState<string | null>(null);

  // Warden details modal
  const [selectedWardenDetails, setSelectedWardenDetails] = useState<WardenDetails | null>(null);
  const [showWardenModal, setShowWardenModal] = useState(false);
  const deviceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const mountedRef = useRef(false);

  // ---------- Load profile & assignments ----------
  const loadMe = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in.");
    const { data: prof, error } = await supabase
      .from("profiles")
      .select("id, email, display_name")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (!prof) throw new Error("Profile missing.");
    setMe(prof);
  };

  const loadAssignmentsBundle = async () => {
    setLoading(true);
    try {
      // 1) Get my warden assignments using the new system
      const { data: wardenAssignments, error: waErr } = await supabase
        .from("v_provider_assigned_wardens")
        .select("*");
      
      if (waErr) {
        console.log("New warden assignments not available, falling back to old system");
        // Fallback to old provider_assignments system - FILTER BY CURRENT PROVIDER
        const { data: asg, error: aErr } = await supabase
          .from("provider_assignments")
          .select("provider_id, sentinel_id")
          .eq("provider_id", (await supabase.auth.getUser()).data.user?.id);
        if (aErr) throw aErr;
        setAssignments(asg ?? []);

        const sentinelIds = Array.from(new Set((asg ?? []).map(a => a.sentinel_id)));
        if (sentinelIds.length === 0) {
          setSentinels([]); setDevices([]); setWardenProfiles({});
          return;
        }

        // Load sentinels and devices using old method
        const { data: sens, error: sErr } = await supabase
          .from("sentinels")
          .select("id, full_name, phone, notes, owner_guardian_id")
          .in("id", sentinelIds);
        if (sErr) throw sErr;
        setSentinels(sens ?? []);

        const guardianIds = Array.from(new Set((sens ?? []).map(s => s.owner_guardian_id)));
        const guardianMap: Record<string, Profile> = {};
        if (guardianIds.length) {
          const { data: gps, error: gErr } = await supabase
            .from("profiles")
            .select("id, email, display_name")
            .in("id", guardianIds);
          if (gErr) throw gErr;
          (gps ?? []).forEach(g => guardianMap[g.id] = g);
        }
        setWardenProfiles(guardianMap);

        const { data: devs, error: dErr } = await supabase
          .from("devices")
          .select("id, hw_uid, model, sentinel_id, last_seen_at")
          .in("sentinel_id", sentinelIds);
        if (dErr) throw dErr;
        setDevices(devs ?? []);
        
        return;
      }

      // New system: Get all sentinels owned by assigned wardens
      const wardenIds = Array.from(new Set((wardenAssignments ?? []).map(w => w.warden_id)));
      if (wardenIds.length === 0) {
        setSentinels([]); setDevices([]); setWardenProfiles({});
        setAssignments([]);
        return;
      }

      // Store warden info for display
      const guardianMap: Record<string, Profile> = {};
      (wardenAssignments ?? []).forEach(w => {
        guardianMap[w.warden_id] = {
          id: w.warden_id,
          email: w.warden_email,
          display_name: w.warden_display_name
        };
      });
      setWardenProfiles(guardianMap);

      // Get all sentinels owned by these wardens
      const { data: sens, error: sErr } = await supabase
        .from("sentinels")
        .select("id, full_name, phone, notes, owner_guardian_id")
        .in("owner_guardian_id", wardenIds);
      if (sErr) throw sErr;
      setSentinels(sens ?? []);

      // Convert to old assignment format for compatibility
      const assignments = (sens ?? []).map(s => ({
        provider_id: (wardenAssignments ?? [])[0]?.provider_id || '',
        sentinel_id: s.id
      }));
      setAssignments(assignments);

      // Get devices for these sentinels
      const sentinelIds = (sens ?? []).map(s => s.id);
      if (sentinelIds.length > 0) {
        const { data: devs, error: dErr } = await supabase
          .from("devices")
          .select("id, hw_uid, model, sentinel_id, last_seen_at")
          .in("sentinel_id", sentinelIds);
        if (dErr) throw dErr;
        setDevices(devs ?? []);
      } else {
        setDevices([]);
      }

    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to load assignments.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Events ----------
const loadEvents = async (sentinelIds?: string[], deviceId?: string) => {
  setEventsLoading(true);
  try {
    // use the view so GPS_SEARCH is already excluded
    let query = supabase
      .from("v_device_event_feed")
      .select("id, created_at, event_type, payload, device_id, sentinel_id")
      .order("created_at", { ascending: false });

    if (deviceId) {
      query = query.eq("device_id", deviceId).limit(500);
    } else if (sentinelIds && sentinelIds.length) {
      query = query.in("sentinel_id", sentinelIds).limit(400);
    } else {
      query = query.limit(200);
    }

    const { data, error } = await query;
    if (error) throw error;
    setEvents((data ?? []) as DeviceEvent[]);
  } catch (e: any) {
    setErrorMsg(e?.message ?? "Failed to load events.");
  } finally {
    setEventsLoading(false);
  }
};

const loadWardenDetails = async (wardenId: string) => {
  try {
    console.log("Loading warden details for:", wardenId);
    
    // Get warden profile (basic user info)
    console.log("Step 1: Loading warden profile...");
    const { data: profileArray, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, display_name, created_at")
      .eq("id", wardenId);
    
    console.log("Profile query result:", { profileArray, profileError });
    if (profileError) throw profileError;
    
    // Use the warden info we have from the assignments if profile not found
    let profile = profileArray?.[0];
    
    if (!profile) {
      console.log("Warden profile not found in profiles table, using assignment data");
      // Get warden info from our existing wardenProfiles data
      const wardenFromAssignment = wardenProfiles[wardenId];
      if (wardenFromAssignment) {
        // Use display_name from assignment, or create one from email
        let displayName = wardenFromAssignment.display_name;
        if (!displayName || displayName.trim() === '') {
          // Create display name from email if not available
          const email = wardenFromAssignment.email || '';
          displayName = email.split('@')[0] || 'Warden';
          // Capitalize first letter
          displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
        }
        
        profile = {
          id: wardenId,
          email: wardenFromAssignment.email || "No email",
          display_name: displayName,
          created_at: new Date().toISOString()
        };
      } else {
        throw new Error(`No warden data found for ID: ${wardenId}`);
      }
    }

    // Get warden's sentinels
    console.log("Step 2: Loading warden's sentinels...");
    const { data: sentinelsData, error: sentinelsError } = await supabase
      .from("sentinels")
      .select("id, full_name, phone, notes, created_at")
      .eq("owner_guardian_id", wardenId);
      
    console.log("Sentinels query result:", { sentinelsData, sentinelsError });
    if (sentinelsError) throw sentinelsError;

    // Get devices for these sentinels separately to avoid join issues
    const sentinelIds = (sentinelsData || []).map(s => s.id);
    let devicesData: any[] = [];
    
    console.log("Step 3: Loading devices for sentinels:", sentinelIds);
    if (sentinelIds.length > 0) {
      const { data: devices, error: devicesError } = await supabase
        .from("devices")
        .select("id, sentinel_id, last_seen_at")
        .in("sentinel_id", sentinelIds);
      
      if (devicesError) {
        console.warn("Error loading devices:", devicesError);
      } else {
        devicesData = devices || [];
      }
    }

    // Map sentinels with device counts and latest activity
    const sentinels = (sentinelsData || []).map(s => {
      const sentinelDevices = devicesData.filter(d => d.sentinel_id === s.id);
      const deviceCount = sentinelDevices.length;
      const latestEvent = sentinelDevices.reduce((latest: string | null, d: any) => {
        if (!latest || (d.last_seen_at && d.last_seen_at > latest)) {
          return d.last_seen_at;
        }
        return latest;
      }, null);

      return {
        id: s.id,
        full_name: s.full_name,
        phone: s.phone,
        notes: s.notes,
        created_at: s.created_at,
        device_count: deviceCount,
        latest_event: latestEvent
      };
    });

    // Get latest activity across all devices
    const allSentinelIds = sentinels.map(s => s.id);
    let latestActivity: string | null = null;
    
    if (allSentinelIds.length > 0) {
      const { data: recentEvents, error: eventsError } = await supabase
        .from("device_events")
        .select("created_at")
        .in("sentinel_id", allSentinelIds)
        .order("created_at", { ascending: false })
        .limit(1);
      
      if (!eventsError && recentEvents && recentEvents.length > 0) {
        latestActivity = recentEvents[0].created_at;
      }
    }

    const wardenDetails: WardenDetails = {
      id: profile.id,
      email: profile.email || '',
      display_name: profile.display_name,
      registered_at: profile.created_at,
      sentinel_count: sentinels.length,
      device_count: sentinels.reduce((total, s) => total + s.device_count, 0),
      latest_activity: latestActivity,
      sentinels
    };

    console.log("Final warden details:", wardenDetails);
    setSelectedWardenDetails(wardenDetails);
    setShowWardenModal(true);
  } catch (e: any) {
    console.error("Error in loadWardenDetails:", e);
    console.error("Error details:", e?.details, e?.hint, e?.code);
    setErrorMsg(e?.message ?? "Failed to load warden details.");
  }
};

const startStream = (deviceId?: string) => {
  if (deviceChannelRef.current) supabase.removeChannel(deviceChannelRef.current);
  deviceChannelRef.current = supabase
    .channel(`provider-events-${deviceId ?? "all"}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "device_events",
        ...(deviceId ? { filter: `device_id=eq.${deviceId}` } : {}),
      },
      (payload: any) => {
        const e = payload.new as DeviceEvent;

        // Drop GPS_SEARCH noise
        if (e.event_type === "GPS_SEARCH") return;

        // If not device-focused, accept only events for my assigned sentinels
        if (!deviceId && sentinels.length) {
          const allowed = new Set(sentinels.map(s => s.id));
          if (e.sentinel_id && !allowed.has(e.sentinel_id)) return;
        }
        setEvents(prev => [e, ...prev].slice(0, 600));
      }
    )
    .subscribe();
};

  // Derived maps
  const devicesBySentinel = useMemo(() => {
    const map: Record<string, Device[]> = {};
    devices.forEach(d => {
      if (!d.sentinel_id) return;
      (map[d.sentinel_id] ??= []).push(d);
    });
    return map;
  }, [devices]);

  const filteredEvents = useMemo(() => {
    const f = filterText.trim().toLowerCase();
    if (!f) return events;
    return events.filter(e => {
      const msg = String(e?.payload?.message ?? "");
      const hw  = String(e?.payload?.hw_uid ?? "");
      return (
        e.event_type?.toLowerCase().includes(f) ||
        msg.toLowerCase().includes(f) ||
        hw.toLowerCase().includes(f) ||
        e.device_id?.toLowerCase().includes(f)
      );
    });
  }, [events, filterText]);

  const incidents = useMemo(() => {
    const critical = new Set(["SOS", "CRITICAL", "OTW"]);
    return filteredEvents.filter(e => critical.has(e.event_type));
  }, [filteredEvents]);

  // ---------- Boot ----------
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    (async () => {
      try {
        await loadMe();
        await loadAssignmentsBundle();
        const sentinelIds = Array.from(new Set((assignments ?? []).map(a => a.sentinel_id)));
        await loadEvents(sentinelIds);
        startStream();
      } catch (e: any) {
        setErrorMsg(e?.message ?? "Failed to initialize.");
      }
    })();

    return () => {
      if (deviceChannelRef.current) supabase.removeChannel(deviceChannelRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When assignments change, refresh events if not focused
  useEffect(() => {
    if (focusedDeviceId) return;
    const sentinelIds = Array.from(new Set(assignments.map(a => a.sentinel_id)));
    loadEvents(sentinelIds);
    startStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments]);

  // ---------- UI helpers ----------
  const guardianLabel = (guardianId: string) => {
    const g = wardenProfiles[guardianId];
    return g ? (g.display_name || g.email || guardianId) : guardianId;
  };

  // Helper functions (matching warden dashboard design)
  type Tone = "danger" | "warn" | "success" | "info" | "muted";
  
  const toneClasses: Record<Tone, string> = {
    danger: "bg-red-50 border-red-200",
    warn: "bg-amber-50 border-amber-200", 
    success: "bg-emerald-50 border-emerald-200",
    info: "bg-sky-50 border-sky-200",
    muted: "bg-zinc-50 border-zinc-200",
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
      case "OTW":        return { Icon: User,         tone: "info",    label: "On the way" };
      case "GPS_SEARCH": return { Icon: MapPin,       tone: "muted",   label: "GPS Search" };
      default:           return { Icon: Info,         tone: "muted",   label: e.event_type };
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
      case "GPS_SEARCH": return "🔍 GPS search";
      default: return e.event_type;
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

  const chip = (e: string) =>
    e === "SOS" ? "bg-red-100 text-red-700 border-red-200"
    : e === "OTW" ? "bg-blue-100 text-blue-700 border-blue-200"
    : e === "BTN_SHORT" ? "bg-amber-100 text-amber-700 border-amber-200"
    : e === "IN_SMS" ? "bg-sky-100 text-sky-700 border-sky-200"
    : e.startsWith("AGPS") ? "bg-amber-100 text-amber-700 border-amber-200"
    : e === "HEALTH" ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : e === "PAIR_OK" ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : e.startsWith("PAIR") || e.startsWith("UNPAIR") ? "bg-rose-100 text-rose-700 border-rose-200"
    : e === "GPS_SEARCH" ? "bg-purple-100 text-purple-700 border-purple-200"
    : "bg-zinc-100 text-zinc-700 border-zinc-200";

  return (
    <>
      {/* Modals */}
      <AlertDialog open={!!errorMsg} onOpenChange={(o) => !o && setErrorMsg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" /> Something went wrong
            </AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-wrap">{errorMsg}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogAction onClick={() => setErrorMsg(null)}>OK</AlertDialogAction></AlertDialogFooter>
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
          <AlertDialogFooter><AlertDialogAction onClick={() => setSuccessMsg(null)}>OK</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Top banner */}
      <div className="mb-4 flex items-center justify-between bg-white/80 border border-emerald-200 rounded-md p-2">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-700" />
          <div className="font-semibold text-gray-800">Provider Console</div>
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-3">
          <Stethoscope className="h-3.5 w-3.5" /> emergency-ready • RLS scoped to your assignments
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="space-y-6">
        <TabsList className="bg-white/80 backdrop-blur-lg border border-emerald-200">
          <TabsTrigger value="my-sentinels" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">My Wardens</TabsTrigger>
          <TabsTrigger value="incidents"    className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Events</TabsTrigger>
          <TabsTrigger value="directory"    className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Directory</TabsTrigger>
        </TabsList>

        {/* My Assigned Wardens */}
        <TabsContent value="my-sentinels">
          {loading ? (
            <div className="text-sm text-gray-600">Loading…</div>
          ) : Object.keys(wardenProfiles).length === 0 ? (
            <Card className="bg-white/90 border-emerald-200">
              <CardContent className="py-8 text-center text-gray-600">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="font-medium">No wardens assigned</p>
                <p className="text-sm">Ask an architect to assign wardens to your provider account.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {Object.values(wardenProfiles).map((warden: Profile) => {
                const wardenSentinels = sentinels.filter(s => s.owner_guardian_id === warden.id);
                const wardenDevices = wardenSentinels.flatMap(s => devicesBySentinel[s.id] ?? []);
                const lastSeen = wardenDevices
                  .map(d => d.last_seen_at ? new Date(d.last_seen_at).getTime() : 0)
                  .reduce((a, b) => Math.max(a, b), 0);

                return (
                  <Card key={warden.id} className="bg-white/90 border-emerald-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-gray-800 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-emerald-700" />
                        {warden.display_name || 'Unnamed Warden'}
                      </CardTitle>
                      <CardDescription>
                        <div className="text-gray-800">{warden.email}</div>
                        {wardenSentinels.length === 1 && (
                          <div className="text-sm text-gray-600 mt-1">
                            Monitoring: <span className="font-medium">{wardenSentinels[0].full_name}</span>
                            {wardenSentinels[0].phone && <span className="ml-2">📱 {wardenSentinels[0].phone}</span>}
                          </div>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid gap-1 text-sm text-gray-700">
                        <div className="flex items-center gap-4">
                          <span><span className="text-gray-500">Sentinels:</span> {wardenSentinels.length}</span>
                          <span><span className="text-gray-500">Devices:</span> {wardenDevices.length}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="h-3.5 w-3.5" />
                          Last activity: {lastSeen ? new Date(lastSeen).toLocaleString() : "—"}
                        </div>
                      </div>

                      <div className="border rounded-md">
                        <div className="px-3 py-2 text-xs text-gray-500 border-b">Recent Sentinels</div>
                        {wardenSentinels.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-600">No sentinels yet.</div>
                        ) : (
                          <ul className="divide-y max-h-24 overflow-y-auto">
                            {wardenSentinels.slice(0, 3).map(s => {
                              const sentinelDevices = devicesBySentinel[s.id] ?? [];
                              return (
                                <li key={s.id} className="px-3 py-2 text-sm">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4 text-blue-600" />
                                      <div>
                                        <div className="text-gray-800">{s.full_name}</div>
                                        <div className="text-xs text-gray-500">
                                          {s.phone && <span className="mr-2">📱 {s.phone}</span>}
                                          {sentinelDevices.length} device(s)
                                        </div>
                                      </div>
                                    </div>
                                    {sentinelDevices.length > 0 && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={async () => {
                                          setFocusedDeviceId(sentinelDevices[0].id);
                                          await loadEvents(undefined, sentinelDevices[0].id);
                                          startStream(sentinelDevices[0].id);
                                          setTab("incidents");
                                        }}
                                        title="View device logs"
                                      >
                                        Monitor
                                      </Button>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                            {wardenSentinels.length > 3 && (
                              <li className="px-3 py-2 text-xs text-gray-500 text-center">
                                +{wardenSentinels.length - 3} more sentinel(s)
                              </li>
                            )}
                          </ul>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => loadWardenDetails(warden.id)}
                          className="flex-1"
                        >
                          <Stethoscope className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                        {wardenDevices.length > 0 && (
                          <Button
                            size="sm"
                            onClick={async () => {
                              setFocusedDeviceId(null);
                              const sentinelIds = wardenSentinels.map(s => s.id);
                              await loadEvents(sentinelIds);
                              startStream();
                              setTab("incidents");
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                          >
                            Monitor All
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Events */}
        <TabsContent value="incidents">
          <Card className="bg-white/90 border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Siren className="h-5 w-5 text-emerald-600" />
                {focusedDeviceId ? "Focused Device Events" : "Live Events (Assigned Sentinels)"}
              </CardTitle>
              <CardDescription>
                All device events from assigned wardens. Filter or click a device in My Sentinels to focus.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="Filter by type/message/HW/ID…"
                    className="pl-8 bg-white/80"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    focusedDeviceId ? loadEvents(undefined, focusedDeviceId) :
                    loadEvents(Array.from(new Set(assignments.map(a => a.sentinel_id))))
                  }
                >
                  Refresh
                </Button>
                {focusedDeviceId ? (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      setFocusedDeviceId(null);
                      startStream(); // global (assigned filter)
                      loadEvents(Array.from(new Set(assignments.map(a => a.sentinel_id))));
                    }}
                  >
                    <X className="h-4 w-4" /> Clear device focus
                  </Button>
                ) : null}
              </div>

              {eventsLoading ? (
                <div className="text-sm text-gray-600">Loading…</div>
              ) : filteredEvents.length === 0 ? (
                <div className="text-sm text-gray-600">No events right now.</div>
              ) : (
                (() => {
                  // Compact health events and group by day
                  const compacted = compactHealth(filteredEvents.slice(0, 400));
                  const grouped: Record<string, typeof compacted> = {};
                  for (const e of compacted) {
                    const day = dayLabel(new Date(e.created_at));
                    grouped[day] = grouped[day] || [];
                    grouped[day].push(e);
                  }

                  return (
                    <div className="space-y-4">
                      {Object.entries(grouped).map(([day, events]) => (
                        <div key={day}>
                          <div className="text-xs font-semibold text-gray-500 mb-2">{day}</div>
                          <div className="space-y-1">
                            {events.map((e) => {
                              const meta = getEventMeta(e);
                              const Icon = meta.Icon;
                              const sentinelName = sentinels.find(s => s.id === e.sentinel_id)?.full_name || `Sentinel ${e.sentinel_id?.slice(0, 8)}`;
                              
                              return (
                                <div
                                  key={String(e.id)}
                                  className={cn(
                                    "rounded-lg p-3 text-sm transition-colors border-l-4",
                                    toneClasses[meta.tone],
                                    meta.tone === "danger" && "border-l-red-400",
                                    meta.tone === "warn" && "border-l-amber-400", 
                                    meta.tone === "success" && "border-l-emerald-500",
                                    meta.tone === "info" && "border-l-sky-500",
                                    meta.tone === "muted" && "border-l-zinc-300"
                                  )}
                                >
                                  <div className="flex items-start gap-3">
                                    <div
                                      className={cn(
                                        "flex items-center justify-center w-6 h-6 rounded-full",
                                        meta.tone === "danger" && "bg-red-100",
                                        meta.tone === "warn" && "bg-amber-100", 
                                        meta.tone === "success" && "bg-emerald-100",
                                        meta.tone === "info" && "bg-sky-100",
                                        meta.tone === "muted" && "bg-zinc-100"
                                      )}
                                    >
                                      <Icon className={cn(
                                        "h-3.5 w-3.5",
                                        meta.tone === "danger" && "text-red-600",
                                        meta.tone === "warn" && "text-amber-600", 
                                        meta.tone === "success" && "text-emerald-600",
                                        meta.tone === "info" && "text-sky-600",
                                        meta.tone === "muted" && "text-zinc-600"
                                      )} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-gray-900">
                                            {prettyLabel(e)}
                                          </span>
                                          {e._count && e._count > 1 && (
                                            <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">
                                              {e._count}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                          <span>{sentinelName}</span>
                                          <span>•</span>
                                          <span>{new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                      </div>
                                      <PrettyPayload e={e} />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Directory */}
        <TabsContent value="directory">
          <Card className="bg-white/90 border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-700" /> Assigned Directory
              </CardTitle>
              <CardDescription>Quick contact + device context.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                {sentinels.map(s => {
                  const devs = devicesBySentinel[s.id] ?? [];
                  return (
                    <div key={s.id} className="rounded-md border bg-white/80">
                      <div className="px-3 py-2 border-b text-sm font-medium text-gray-800 flex items-center gap-2">
                        <User className="h-4 w-4 text-emerald-700" /> {s.full_name}
                      </div>
                      <div className="p-3 grid md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <div className="text-gray-500">Guardian</div>
                          <div className="text-gray-800">{guardianLabel(s.owner_guardian_id)}</div>
                          <div className="text-gray-500 mt-2">Phone</div>
                          <div className="text-gray-800">{s.phone || "—"}</div>
                        </div>
                        <div className="md:col-span-2">
                          <div className="text-gray-500">Devices</div>
                          {devs.length === 0 ? (
                            <div className="text-gray-600">No devices.</div>
                          ) : (
                            <ul className="mt-1 grid sm:grid-cols-2 gap-2">
                              {devs.map(d => (
                                <li key={d.id} className="rounded border p-2 flex items-center justify-between">
                                  <div>
                                    <div className="text-gray-800">dev <span className="font-mono">{d.id.slice(0,8)}…</span> {d.model ? `(${d.model})` : ""}</div>
                                    <div className="text-xs text-gray-500">HW: {d.hw_uid || "—"}</div>
                                  </div>
                                  <Button size="sm" variant="outline" onClick={async () => {
                                    setFocusedDeviceId(d.id);
                                    await loadEvents(undefined, d.id);
                                    startStream(d.id);
                                    setTab("incidents");
                                  }}>
                                    Live log
                                  </Button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Warden Details Modal */}
      <Dialog open={showWardenModal} onOpenChange={setShowWardenModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              Warden Details
            </DialogTitle>
            <DialogDescription>
              Complete information about {selectedWardenDetails?.display_name || 'this warden'} and their managed sentinels.
            </DialogDescription>
          </DialogHeader>
          
          {selectedWardenDetails && (
            <div className="space-y-6">
              {/* Warden Overview */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Tile 
                  icon={<User className="h-4 w-4" />}
                  label="Display Name"
                  value={selectedWardenDetails.display_name || 'Not set'}
                />
                <Tile 
                  icon={<CheckCircle className="h-4 w-4" />}
                  label="Email"
                  value={selectedWardenDetails.email}
                />
                <Tile 
                  icon={<Users className="h-4 w-4" />}
                  label="Sentinels"
                  value={selectedWardenDetails.sentinel_count.toString()}
                />
                <Tile 
                  icon={<Smartphone className="h-4 w-4" />}
                  label="Devices"
                  value={selectedWardenDetails.device_count.toString()}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Tile 
                  icon={<Clock className="h-4 w-4" />}
                  label="Registered"
                  value={new Date(selectedWardenDetails.registered_at).toLocaleDateString()}
                />
                <Tile 
                  icon={<ActivitySquare className="h-4 w-4" />}
                  label="Latest Activity"
                  value={selectedWardenDetails.latest_activity ? 
                    new Date(selectedWardenDetails.latest_activity).toLocaleString() : 
                    'No recent activity'
                  }
                />
              </div>

              {/* Sentinels List */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Managed Sentinels ({selectedWardenDetails.sentinels.length})
                </h4>
                
                {selectedWardenDetails.sentinels.length === 0 ? (
                  <Card className="bg-gray-50">
                    <CardContent className="py-8 text-center text-gray-600">
                      <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>(No sentinel)</p>
                      <p className="text-sm">This warden hasn't paired with any sentinels yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {selectedWardenDetails.sentinels.map((sentinel) => (
                      <Card key={sentinel.id} className="bg-white border-gray-200">
                        <CardContent className="py-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-600" />
                                <h5 className="font-medium">{sentinel.full_name}</h5>
                              </div>
                              
                              <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">Phone:</span> {sentinel.phone || '—'}
                                </div>
                                <div>
                                  <span className="font-medium">Devices:</span> {sentinel.device_count}
                                </div>
                                <div>
                                  <span className="font-medium">Created:</span> {new Date(sentinel.created_at).toLocaleDateString()}
                                </div>
                                {sentinel.latest_event && (
                                  <div>
                                    <span className="font-medium">Last Activity:</span> {new Date(sentinel.latest_event).toLocaleString()}
                                  </div>
                                )}
                              </div>
                              
                              {sentinel.notes && (
                                <div className="bg-gray-50 p-2 rounded text-sm">
                                  <span className="font-medium">Notes:</span> {sentinel.notes}
                                </div>
                              )}
                            </div>
                            
                            {sentinel.device_count > 0 && (
                              <Button
                                size="sm"
                                onClick={async () => {
                                  const sentinelDevices = devices.filter(d => d.sentinel_id === sentinel.id);
                                  if (sentinelDevices.length > 0) {
                                    setFocusedDeviceId(sentinelDevices[0].id);
                                    await loadEvents(undefined, sentinelDevices[0].id);
                                    startStream(sentinelDevices[0].id);
                                    setShowWardenModal(false);
                                    setTab("incidents");
                                  }
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700"
                              >
                                <ActivitySquare className="mr-2 h-4 w-4" />
                                Monitor
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowWardenModal(false);
                setSelectedWardenDetails(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Tile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded border p-2 bg-white/70">
      <div className="text-gray-500 flex items-center gap-1">{icon} {label}</div>
      <div className="text-gray-800">{value}</div>
    </div>
  );
}

/**
 * PrettyPayload: renders the payload of an event in a more readable way
 */
function PrettyPayload({ e }: { e: DeviceEvent }) {
  const p = e.payload || {};
  const showPayload = Object.keys(p).length > 0;

  if (!showPayload) return null;

  return (
    <div className="pl-7 pt-1">
      <div className="text-xs text-muted-foreground space-y-1">
        {p.message && (
          <div className="font-medium text-gray-700">
            💬 {String(p.message)}
          </div>
        )}
        {(p.lat || p.lon || p.lng) && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            <span>
              {p.lat && (p.lon || p.lng)
                ? `${Number(p.lat).toFixed(6)}, ${Number(p.lon || p.lng).toFixed(6)}`
                : p.lat || p.lon || p.lng}
            </span>
            {p.lat && (p.lon || p.lng) && (
              <a
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                href={`https://maps.google.com/maps?q=${p.lat},${p.lon || p.lng}`}
                target="_blank"
                rel="noreferrer"
                title={`Open ${Number(p.lat).toFixed(6)}, ${Number(p.lon || p.lng).toFixed(6)} in Maps`}
              >
                <MapPin className="h-3 w-3" />
                Open in Maps
              </a>
            )}
          </div>
        )}
        {p.battery && (
          <div className="flex items-center gap-1">
            ⚡ {p.battery}%
          </div>
        )}
        {p.network && (
          <div className="flex items-center gap-1">
            📶 {String(p.network)}
          </div>
        )}
        {p.rssi && (
          <div className="flex items-center gap-1">
            📡 {String(p.rssi)} dBm
          </div>
        )}
        {p.temp && (
          <div className="flex items-center gap-1">
            🌡️ {String(p.temp)}°C
          </div>
        )}
      </div>
    </div>
  );
}
