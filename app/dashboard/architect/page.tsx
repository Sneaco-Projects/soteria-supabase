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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  ActivitySquare, AlertTriangle, CheckCircle, Database, Globe, Link2, ListFilter,
  Server, ShieldCheck, Users, Zap, Search, MapPin, X
} from "lucide-react";

// ---------- Types ----------
type ProviderRow = { user_id: string; display_name: string | null; active: boolean; created_at: string };
type ProfileRow  = { id: string; email: string; display_name: string | null };
type SentinelRow = { id: string; full_name: string; owner_guardian_id: string };
type DeviceRow   = { id: string; hw_uid: string; model: string | null; sentinel_id: string | null; last_seen_at: string | null };
type Assignment  = { provider_id: string; sentinel_id: string };

type DeviceEvent = {
  id: string | number;
  created_at: string;
  device_id: string;
  sentinel_id: string | null;
  event_type: string;
  payload: any;
};

// ---------- Page ----------
export default function ArchitectPage() {
  // global feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // top tabs
  const [tab, setTab] = useState<"overview" | "events" | "providers" | "assignments">("overview");

  // -------- Overview (stats) --------
  const [countSentinels, setCountSentinels] = useState<number | null>(null);
  const [countDevices,   setCountDevices]   = useState<number | null>(null);
  const [countProviders, setCountProviders] = useState<number | null>(null);
  const [countEvents24h, setCountEvents24h] = useState<number | null>(null);

  const loadStats = async () => {
    try {
      const [s, d, p, e] = await Promise.all([
        supabase.from("sentinels").select("id", { count: "exact", head: true }),
        supabase.from("devices").select("id",   { count: "exact", head: true }),
        supabase.from("providers").select("user_id", { count: "exact", head: true }),
        supabase
          .from("device_events")
          .select("id", { count: "exact", head: true })
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ]);
      setCountSentinels(s.count ?? 0);
      setCountDevices(d.count ?? 0);
      setCountProviders(p.count ?? 0);
      setCountEvents24h(e.count ?? 0);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to load statistics.");
    }
  };

  // -------- Events (live log + focus) --------
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsFilter, setEventsFilter] = useState("");
  const [focusedDeviceId, setFocusedDeviceId] = useState<string | null>(null);
  const deviceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const mountedRef = useRef(false);

  const loadAllEvents = async () => {
    setEventsLoading(true);
    try {
      const { data, error } = await supabase
        .from("device_events")
        .select("id, created_at, event_type, payload, device_id, sentinel_id")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      setEvents((data ?? []) as DeviceEvent[]);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to load events.");
    } finally {
      setEventsLoading(false);
    }
  };

  const loadEventsForDevice = async (deviceId: string) => {
    setEventsLoading(true);
    try {
      const { data, error } = await supabase
        .from("device_events")
        .select("id, created_at, event_type, payload, device_id, sentinel_id")
        .eq("device_id", deviceId)
        .order("created_at", { ascending: false })
        .limit(600);
      if (error) throw error;
      setEvents((data ?? []) as DeviceEvent[]);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to load device log.");
    } finally {
      setEventsLoading(false);
    }
  };

  const startDeviceStream = (deviceId?: string) => {
    if (deviceChannelRef.current) supabase.removeChannel(deviceChannelRef.current);
    deviceChannelRef.current = supabase
      .channel(`arch-events-${deviceId ?? "all"}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "device_events",
          ...(deviceId ? { filter: `device_id=eq.${deviceId}` } : {}),
        },
        (payload: any) => {
          setEvents((prev) => [payload.new as DeviceEvent, ...prev].slice(0, 600));
        }
      )
      .subscribe();
  };

  const visibleEvents = useMemo(() => {
    const f = eventsFilter.trim().toLowerCase();
    if (!f) return events;
    return events.filter((e) => {
      const msg = String(e?.payload?.message ?? "");
      const hw  = String(e?.payload?.hw_uid ?? "");
      return (
        e.event_type?.toLowerCase().includes(f) ||
        msg.toLowerCase().includes(f) ||
        hw.toLowerCase().includes(f) ||
        e.device_id.toLowerCase().includes(f)
      );
    });
  }, [events, eventsFilter]);

  // -------- Providers --------
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, ProfileRow>>({});
  const [promoteEmail, setPromoteEmail] = useState("");

  const loadProviders = async () => {
    const { data: provs, error } = await supabase
      .from("providers")
      .select("user_id, display_name, active, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;

    setProviders(provs ?? []);
    const ids = (provs ?? []).map((p) => p.user_id);
    if (ids.length) {
      const { data: profs, error: pErr } = await supabase
        .from("profiles")
        .select("id, email, display_name")
        .in("id", ids);
      if (pErr) throw pErr;
      const map: Record<string, ProfileRow> = {};
      (profs ?? []).forEach((pr) => { map[pr.id] = pr; });
      setProfilesById(map);
    } else {
      setProfilesById({});
    }
  };

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
      await loadProviders();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to promote provider.");
    }
  };

  const toggleProvider = async (user_id: string, current: boolean) => {
    try {
      const { error } = await supabase.from("providers").update({ active: !current }).eq("user_id", user_id);
      if (error) throw error;
      setSuccessMsg(`Provider ${!current ? "activated" : "deactivated"}.`);
      await loadProviders();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to update provider.");
    }
  };

  // -------- Assignments --------
  const [activeProviders, setActiveProviders] = useState<ProviderRow[]>([]);
  const [sentinels, setSentinels] = useState<SentinelRow[]>([]);
  const [assignProviderId, setAssignProviderId] = useState("");
  const [assignSentinelId, setAssignSentinelId] = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const loadAssignments = async () => {
    const [{ data: actProvs, error: aErr }, { data: sens, error: sErr }, { data: asg, error: asgErr }] =
      await Promise.all([
        supabase.from("providers").select("user_id, display_name, active, created_at").eq("active", true),
        supabase.from("sentinels").select("id, full_name, owner_guardian_id").order("full_name"),
        supabase.from("provider_assignments").select("provider_id, sentinel_id"),
      ]);
    if (aErr) throw aErr;
    if (sErr) throw sErr;
    if (asgErr) throw asgErr;

    setActiveProviders(actProvs ?? []);
    setSentinels(sens ?? []);
    setAssignments(asg ?? []);
  };

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

  const bySentinel = useMemo(() => {
    const map: Record<string, string[]> = {};
    assignments.forEach((a) => {
      map[a.sentinel_id] ??= [];
      map[a.sentinel_id].push(a.provider_id);
    });
    return map;
  }, [assignments]);

  // -------- Initial load + live events --------
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    (async () => {
      await Promise.all([loadStats(), loadProviders(), loadAssignments(), loadAllEvents()]);
      startDeviceStream(); // global stream
    })();

    return () => {
      if (deviceChannelRef.current) supabase.removeChannel(deviceChannelRef.current);
    };
  }, []);

  // ---------- UI ----------
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

      {/* Local navbar (inside the page) */}
      <div className="mb-4 flex items-center justify-between bg-white/80 border border-emerald-200 rounded-md p-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-700" />
          <div className="font-semibold text-gray-800">Architect Admin</div>
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-3">
          <div className="flex items-center gap-1"><Server className="h-3.5 w-3.5" /> RLS enforced</div>
          <div className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> Live feed</div>
          <div className="flex items-center gap-1"><Database className="h-3.5 w-3.5" /> Supabase</div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="space-y-6">
        <TabsList className="bg-white/80 backdrop-blur-lg border border-emerald-200">
          <TabsTrigger value="overview"   className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Overview</TabsTrigger>
          <TabsTrigger value="events"     className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Events</TabsTrigger>
          <TabsTrigger value="providers"  className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Providers</TabsTrigger>
          <TabsTrigger value="assignments"className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Assignments</TabsTrigger>
        </TabsList>

        {/* ---------- OVERVIEW ---------- */}
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard title="Sentinels" value={countSentinels} note="total" />
            <StatCard title="Devices"   value={countDevices}   note="total" />
            <StatCard title="Providers" value={countProviders} note="active + inactive" />
            <StatCard title="Events"    value={countEvents24h} note="last 24h" />
          </div>
        </TabsContent>

        {/* ---------- EVENTS ---------- */}
        <TabsContent value="events">
          <Card className="bg-white/90 border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ActivitySquare className="h-5 w-5 text-emerald-700" />
                {focusedDeviceId ? "Device Log (focused)" : "Live Events (all devices)"}
              </CardTitle>
              <CardDescription>Filter, watch in real time, and click a device to focus.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={eventsFilter}
                    onChange={(e) => setEventsFilter(e.target.value)}
                    placeholder="Filter by type/message/HW UID/device id…"
                    className="pl-8 bg-white/80"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => (focusedDeviceId ? loadEventsForDevice(focusedDeviceId) : loadAllEvents())}
                  title="Refresh now"
                >
                  Refresh
                </Button>
                {focusedDeviceId ? (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      setFocusedDeviceId(null);
                      startDeviceStream(); // back to global
                      loadAllEvents();
                    }}
                  >
                    <X className="h-4 w-4" /> Clear device focus
                  </Button>
                ) : null}
              </div>

              {eventsLoading ? (
                <div className="text-sm text-gray-600">Loading events…</div>
              ) : visibleEvents.length === 0 ? (
                <div className="text-sm text-gray-600">No events.</div>
              ) : (
                <div className="space-y-2">
                  {visibleEvents.slice(0, 600).map((e) => {
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
                      <div key={String(e.id)} className="rounded-md border p-3 bg-white/80 text-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded border text-xs ${color}`}>{e.event_type}</span>
                            <span className="text-xs text-gray-500">{new Date(e.created_at).toLocaleString()}</span>
                            <button
                              className="text-[11px] text-emerald-700 underline-offset-2 hover:underline"
                              onClick={async () => {
                                setFocusedDeviceId(e.device_id);
                                await loadEventsForDevice(e.device_id);
                                startDeviceStream(e.device_id);
                              }}
                              title="Focus on this device"
                            >
                              • dev <span className="font-mono">{e.device_id.slice(0, 8)}…</span>
                            </button>
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

                        <div className="mt-1 text-gray-800">{msg || <span className="text-gray-500">—</span>}</div>
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

        {/* ---------- PROVIDERS ---------- */}
        <TabsContent value="providers">
          <Card className="bg-white/90 border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-emerald-700" /> Providers</CardTitle>
              <CardDescription>Promote users and manage activation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Label>Email to promote</Label>
                  <Input
                    placeholder="provider@example.com"
                    value={promoteEmail}
                    onChange={(e) => setPromoteEmail(e.target.value)}
                    className="bg-white/80"
                  />
                </div>
                <Button onClick={promote} className="bg-emerald-600 hover:bg-emerald-700">
                  Promote
                </Button>
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

        {/* ---------- ASSIGNMENTS ---------- */}
        <TabsContent value="assignments">
          <Card className="bg-white/90 border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5 text-emerald-700" /> Provider ↔ Sentinel Assignments</CardTitle>
              <CardDescription>Assign active providers to specific sentinels.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                    Assign
                  </Button>
                </div>
              </div>

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
                      <CardHeader className="py-3"><CardTitle className="text-base">{s.full_name}</CardTitle></CardHeader>
                      <CardContent className="py-3">
                        {provIds.length === 0 && <div className="text-sm text-gray-600">No providers assigned.</div>}
                        {provIds.length > 0 && (
                          <ul className="space-y-2">
                            {provIds.map((pid) => {
                              const row = providers.find((p) => p.user_id === pid);
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
    </>
  );
}

/** Small stat tile */
function StatCard({ title, value, note }: { title: string; value: number | null; note?: string }) {
  return (
    <Card className="bg-white/90 border-emerald-200">
      <CardHeader>
        <CardTitle className="text-gray-800 text-base">{title}</CardTitle>
        {note && <CardDescription className="text-gray-500">{note}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold text-emerald-700">{value ?? "—"}</div>
      </CardContent>
    </Card>
  );
}
