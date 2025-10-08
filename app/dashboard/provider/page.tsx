"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase-client";

import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ActivitySquare, AlertTriangle, CheckCircle, HeartPulse, ListFilter, MapPin,
  Search, Shield, Siren, User, Users, Smartphone, Stethoscope, Clock, X
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

export default function ProviderDashboard() {
  // UX
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tabs
  const [tab, setTab] = useState<"my-sentinels" | "incidents" | "directory">("my-sentinels");

  // Core data
  const [me, setMe] = useState<Profile | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [sentinels, setSentinels] = useState<Sentinel[]>([]);
  const [guardianProfiles, setGuardianProfiles] = useState<Record<string, Profile>>({});
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  // Events
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [focusedDeviceId, setFocusedDeviceId] = useState<string | null>(null);
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
      // 1) Get my assignments (RLS returns only mine)
      const { data: asg, error: aErr } = await supabase
        .from("provider_assignments")
        .select("provider_id, sentinel_id");
      if (aErr) throw aErr;
      setAssignments(asg ?? []);

      const sentinelIds = Array.from(new Set((asg ?? []).map(a => a.sentinel_id)));
      if (sentinelIds.length === 0) {
        setSentinels([]); setDevices([]); setGuardianProfiles({});
        return;
      }

      // 2) Sentinels
      const { data: sens, error: sErr } = await supabase
        .from("sentinels")
        .select("id, full_name, phone, notes, owner_guardian_id")
        .in("id", sentinelIds);
      if (sErr) throw sErr;
      setSentinels(sens ?? []);

      // 3) Guardian profiles
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
      setGuardianProfiles(guardianMap);

      // 4) Devices
      const { data: devs, error: dErr } = await supabase
        .from("devices")
        .select("id, hw_uid, model, sentinel_id, last_seen_at")
        .in("sentinel_id", sentinelIds);
      if (dErr) throw dErr;
      setDevices(devs ?? []);
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
    const critical = new Set(["SOS", "FALL", "CRITICAL", "LOW_BATTERY", "OTW"]);
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
    const g = guardianProfiles[guardianId];
    return g ? (g.display_name || g.email || guardianId) : guardianId;
  };

  const chip = (e: string) =>
    e === "SOS" ? "bg-red-100 text-red-700 border-red-200"
    : e === "OTW" ? "bg-blue-100 text-blue-700 border-blue-200"
    : e.startsWith("AGPS") ? "bg-amber-100 text-amber-700 border-amber-200"
    : e === "HEALTH" ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : e === "LOW_BATTERY" ? "bg-rose-100 text-rose-700 border-rose-200"
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
          <TabsTrigger value="my-sentinels" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">My Sentinels</TabsTrigger>
          <TabsTrigger value="incidents"    className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Incidents</TabsTrigger>
          <TabsTrigger value="directory"    className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Directory</TabsTrigger>
        </TabsList>

        {/* My Sentinels */}
        <TabsContent value="my-sentinels">
          {loading ? (
            <div className="text-sm text-gray-600">Loading…</div>
          ) : sentinels.length === 0 ? (
            <Card className="bg-white/90 border-emerald-200">
              <CardContent className="py-6 text-gray-600">No sentinels assigned yet.</CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sentinels.map(s => {
                const devs = devicesBySentinel[s.id] ?? [];
                const lastSeen = devs
                  .map(d => d.last_seen_at ? new Date(d.last_seen_at).getTime() : 0)
                  .reduce((a, b) => Math.max(a, b), 0);

                return (
                  <Card key={s.id} className="bg-white/90 border-emerald-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-gray-800 flex items-center gap-2">
                        <User className="h-5 w-5 text-emerald-700" /> {s.full_name}
                      </CardTitle>
                      <CardDescription>
                        Guardian: <span className="text-gray-800">{guardianLabel(s.owner_guardian_id)}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid gap-1 text-sm text-gray-700">
                        <div><span className="text-gray-500">Phone:</span> {s.phone || "—"}</div>
                        <div><span className="text-gray-500">Notes:</span> {s.notes || "—"}</div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="h-3.5 w-3.5" />
                          Last seen: {lastSeen ? new Date(lastSeen).toLocaleString() : "—"}
                        </div>
                      </div>

                      <div className="border rounded-md">
                        <div className="px-3 py-2 text-xs text-gray-500 border-b">Devices</div>
                        {devs.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-600">No devices.</div>
                        ) : (
                          <ul className="divide-y">
                            {devs.map(d => (
                              <li key={d.id} className="px-3 py-2 text-sm flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Smartphone className="h-4 w-4 text-emerald-700" />
                                  <div>
                                    <div className="text-gray-800">dev <span className="font-mono">{d.id.slice(0,8)}…</span> {d.model ? `(${d.model})` : ""}</div>
                                    <div className="text-xs text-gray-500">HW: {d.hw_uid || "—"}</div>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    setFocusedDeviceId(d.id);
                                    await loadEvents(undefined, d.id);
                                    startStream(d.id);
                                    setTab("incidents");
                                  }}
                                  title="Open device log"
                                >
                                  View Log
                                </Button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Incidents */}
        <TabsContent value="incidents">
          <Card className="bg-white/90 border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Siren className="h-5 w-5 text-red-600" />
                {focusedDeviceId ? "Focused Device Incidents" : "Live Incidents (Assigned Sentinels)"}
              </CardTitle>
              <CardDescription>
                Critical signals (SOS, FALL, LOW_BATTERY, OTW). Filter or click a device in My Sentinels to focus.
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
              ) : incidents.length === 0 ? (
                <div className="text-sm text-gray-600">No incidents right now.</div>
              ) : (
                <div className="space-y-2">
                  {incidents.slice(0, 400).map((e) => {
                    const payload = e.payload || {};
                    const msg = typeof payload.message === "string" ? payload.message : "";
                    const lat = typeof payload.lat === "number" ? payload.lat : undefined;
                    const lng = typeof payload.lng === "number" ? payload.lng : undefined;
                    const mapHref = lat !== undefined && lng !== undefined
                      ? `https://maps.google.com/maps?q=${lat},${lng}` : null;

                    return (
                      <div key={String(e.id)} className="rounded-md border p-3 bg-white/80 text-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={cn("px-2 py-0.5 rounded border text-xs", chip(e.event_type))}>
                              {e.event_type}
                            </span>
                            <span className="text-xs text-gray-500">{new Date(e.created_at).toLocaleString()}</span>
                            <span className="text-[11px] text-gray-500">• dev <span className="font-mono">{e.device_id.slice(0,8)}…</span></span>
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

                        {/* brief */}
                        <div className="mt-1 text-gray-800">{msg || <span className="text-gray-500">—</span>}</div>

                        {/* vitals (if present) */}
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          {"hr" in payload && <Tile icon={<HeartPulse className="h-3.5 w-3.5" />} label="Heart rate" value={`${payload.hr} bpm`} />}
                          {"spo2" in payload && <Tile icon={<Stethoscope className="h-3.5 w-3.5" />} label="SpO₂" value={`${payload.spo2}%`} />}
                          {"battery" in payload && <Tile icon={<ActivitySquare className="h-3.5 w-3.5" />} label="Battery" value={`${payload.battery}%`} />}
                          {"temp" in payload && <Tile icon={<span className="inline-block w-3.5 h-3.5 rounded-full border" />} label="Temp" value={`${payload.temp}°`} />}
                        </div>

                        {/* full JSON */}
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
