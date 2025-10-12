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
      Icon = MessageSquareText; color = "text-blue-700 bg-blue-100 border-blue-200"; break;
    case "PAIR_OK":
    case "UNPAIR_OK":
      Icon = CheckCircle; color = "text-emerald-700 bg-emerald-100 border-emerald-200"; break;
    case "PAIR_FAIL":
    case "UNPAIR_DENY":
      Icon = AlertTriangle; color = "text-orange-700 bg-orange-100 border-orange-200"; break;
    default:
      Icon = ActivitySquare; color = "text-zinc-700 bg-zinc-100 border-zinc-200"; break;
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border rounded ${color}`}>
      <Icon className="h-3 w-3" />
      {prettyLabel(e)}
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
        window.location.href = "/auth/signin?message=Access denied";
        return;
      }
    };
    checkAccess();
  }, []);

  /* ----------------- State ----------------- */
  const [sentinels, setSentinels] = useState<Sentinel[]>([]);
  const [devices, setDevices] = useState<Record<string, DeviceRow>>({});
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

  // Log panel
  const [logPanel, setLogPanel] = useState(false);
  const [logDeviceId, setLogDeviceId] = useState("");
  const [logEvents, setLogEvents] = useState<DeviceEvent[]>([]);
  const [logLoading, setLogLoading] = useState(false);

  // Pairing
  const [openPair, setOpenPair] = useState(false);
  const [pairDeviceId, setPairDeviceId] = useState("");
  const [pairCode, setPairCode] = useState("");
  const [pairExpires, setPairExpires] = useState<string | null>(null);
  const [pairUsedAt, setPairUsedAt] = useState<string | null>(null);
  const [pairLoading, setPairLoading] = useState(false);

  // Device location
  const [openDeviceLocation, setOpenDeviceLocation] = useState(false);
  const [deviceLocationLat, setDeviceLocationLat] = useState<number | null>(null);
  const [deviceLocationLng, setDeviceLocationLng] = useState<number | null>(null);

  const unpairedDevices = Object.keys(devices).filter((devId) => !devices[devId]?.sentinel_id);

  /* ----------------- Data Loading ----------------- */
  const fetchSentinels = async () => {
    try {
      const { data, error } = await supabase
        .from("sentinels")
        .select("id, full_name, phone, notes")
        .order("full_name");

      if (error) {
        console.error("Error loading sentinels:", error);
        return;
      }
      setSentinels(data || []);
    } catch (err) {
      console.error("Fetch sentinels error:", err);
    }
  };

  const fetchDevices = async () => {
    try {
      const { data, error } = await supabase
        .from("device_registry")
        .select("id, sentinel_id, last_seen_at");

      if (error) {
        console.error("Error loading devices:", error);
        return;
      }
      const deviceMap: Record<string, DeviceRow> = {};
      (data || []).forEach((d) => {
        deviceMap[d.id] = d;
      });
      setDevices(deviceMap);
    } catch (err) {
      console.error("Fetch devices error:", err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchSentinels(), fetchDevices()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ----------------- Real-time Subscriptions ----------------- */
  useEffect(() => {
    const sub1 = supabase
      .channel("sentinels")
      .on("postgres_changes", { event: "*", schema: "public", table: "sentinels" }, () => {
        fetchSentinels();
      })
      .subscribe();

    const sub2 = supabase
      .channel("device_registry")
      .on("postgres_changes", { event: "*", schema: "public", table: "device_registry" }, () => {
        fetchDevices();
      })
      .subscribe();

    return () => {
      sub1.unsubscribe();
      sub2.unsubscribe();
    };
  }, []);

  /* ----------------- CRUD Operations ----------------- */
  const handleAdd = async () => {
    if (!fullName.trim()) return;

    try {
      const { error } = await supabase
        .from("sentinels")
        .insert({ full_name: fullName, phone: phone || null, notes: notes || null });

      if (error) {
        console.error("Add sentinel error:", error);
        return;
      }

      setFullName("");
      setPhone("");
      setNotes("");
      setOpenAdd(false);
      fetchSentinels();
    } catch (err) {
      console.error("Add sentinel error:", err);
    }
  };

  const handleEdit = async () => {
    if (!editId || !editName.trim()) return;

    try {
      const { error } = await supabase
        .from("sentinels")
        .update({ full_name: editName, phone: editPhone || null, notes: editNotes || null })
        .eq("id", editId);

      if (error) {
        console.error("Update sentinel error:", error);
        return;
      }

      setOpenEdit(false);
      setEditId(null);
      setEditName("");
      setEditPhone("");
      setEditNotes("");
      fetchSentinels();
    } catch (err) {
      console.error("Update sentinel error:", err);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("sentinels")
        .delete()
        .eq("id", deleteId);

      if (error) {
        console.error("Delete sentinel error:", error);
        return;
      }

      setOpenDelete(false);
      setDeleteId(null);
      fetchSentinels();
    } catch (err) {
      console.error("Delete sentinel error:", err);
    }
  };

  /* ----------------- Search & Filter ----------------- */
  const filteredSentinels = useMemo(() => {
    if (!query.trim()) return sentinels;
    const lowerQuery = query.toLowerCase();
    return sentinels.filter(
      (s) =>
        s.full_name.toLowerCase().includes(lowerQuery) ||
        (s.phone && s.phone.toLowerCase().includes(lowerQuery))
    );
  }, [sentinels, query]);

  /* ----------------- Device Operations ----------------- */
  const handleOpenLogs = async (deviceId: string) => {
    setLogDeviceId(deviceId);
    setLogPanel(true);
    setLogLoading(true);

    try {
      const { data, error } = await supabase
        .from(DEVICE_EVENTS_TABLE)
        .select("id, created_at, device_id, sentinel_id, event_type, payload")
        .eq("device_id", deviceId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Load logs error:", error);
        setLogEvents([]);
      } else {
        setLogEvents(data || []);
      }
    } catch (err) {
      console.error("Load logs error:", err);
      setLogEvents([]);
    }

    setLogLoading(false);
  };

  const handleOpenPairing = async (deviceId: string) => {
    setPairDeviceId(deviceId);
    setOpenPair(true);
    setPairLoading(true);

    try {
      const response = await fetch(`/api/pairing/${deviceId}`, { method: "GET" });
      const result = await response.json();

      if (result.success) {
        setPairCode(result.pairCode);
        setPairExpires(result.expires);
        setPairUsedAt(result.usedAt || null);
      } else {
        console.error("Failed to get pairing info:", result.error);
        setPairCode("");
        setPairExpires(null);
        setPairUsedAt(null);
      }
    } catch (err) {
      console.error("Pairing fetch error:", err);
      setPairCode("");
      setPairExpires(null);
      setPairUsedAt(null);
    }

    setPairLoading(false);
  };

  const handleGeneratePairing = async () => {
    if (!pairDeviceId) return;

    setPairLoading(true);

    try {
      const response = await fetch(`/api/pairing/${pairDeviceId}`, { method: "POST" });
      const result = await response.json();

      if (result.success) {
        setPairCode(result.pairCode);
        setPairExpires(result.expires);
        setPairUsedAt(null);
      } else {
        console.error("Failed to generate pairing code:", result.error);
      }
    } catch (err) {
      console.error("Generate pairing error:", err);
    }

    setPairLoading(false);
  };

  const handleOpenDeviceLocation = (deviceId: string) => {
    const device = devices[deviceId];
    if (!device) return;

    // For demo, use random coordinates near DC
    const lat = 38.9072 + (Math.random() - 0.5) * 0.01;
    const lng = -77.0369 + (Math.random() - 0.5) * 0.01;

    setDeviceLocationLat(lat);
    setDeviceLocationLng(lng);
    setOpenDeviceLocation(true);
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.warn("Clipboard copy failed:", err);
    }
  };

  /* ----------------- UI Helpers ----------------- */
  const isActive = (deviceId: string) => {
    const device = devices[deviceId];
    if (!device?.last_seen_at) return false;
    const lastSeen = new Date(device.last_seen_at);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastSeen > fiveMinutesAgo;
  };

  const isPaired = (deviceId: string) => {
    return !!devices[deviceId]?.sentinel_id;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-zinc-600" />
          <p className="mt-2 text-zinc-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-zinc-900">Warden Dashboard</h1>
          <p className="text-zinc-600 mt-1">Monitor sentinels and their devices</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              type="text"
              placeholder="Search sentinels..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 bg-white border-zinc-200"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <User className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-zinc-600">Total Sentinels</p>
                  <p className="text-2xl font-bold text-zinc-900">{sentinels.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <ActivitySquare className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="text-sm text-zinc-600">Active Devices</p>
                  <p className="text-2xl font-bold text-zinc-900">
                    {Object.keys(devices).filter(isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <LinkIcon className="h-8 w-8 text-amber-600" />
                <div>
                  <p className="text-sm text-zinc-600">Paired Devices</p>
                  <p className="text-2xl font-bold text-zinc-900">
                    {Object.keys(devices).filter(isPaired).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-zinc-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-sm text-zinc-600">Unpaired Devices</p>
                  <p className="text-2xl font-bold text-zinc-900">{unpairedDevices.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sentinels List */}
          <Card className="bg-white border-zinc-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-zinc-900">Sentinels</CardTitle>
                <Button onClick={() => setOpenAdd(true)} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sentinel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredSentinels.map((sentinel) => {
                  const deviceId = Object.keys(devices).find(d => devices[d]?.sentinel_id === sentinel.id);
                  const isOnline = deviceId ? isActive(deviceId) : false;

                  return (
                    <div
                      key={sentinel.id}
                      className="p-3 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <StatusDot green={isOnline} />
                            <h3 className="font-semibold text-zinc-900">{sentinel.full_name}</h3>
                          </div>
                          {sentinel.phone && (
                            <p className="text-sm text-zinc-600 flex items-center gap-1 mb-1">
                              <Phone className="h-3 w-3" />
                              {sentinel.phone}
                            </p>
                          )}
                          {sentinel.notes && (
                            <p className="text-sm text-zinc-600 flex items-center gap-1">
                              <StickyNote className="h-3 w-3" />
                              {sentinel.notes}
                            </p>
                          )}
                          {deviceId && (
                            <div className="mt-2">
                              <p className="text-xs text-zinc-500 font-mono">Device: {deviceId}</p>
                            </div>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white border-zinc-200">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditId(sentinel.id);
                                setEditName(sentinel.full_name);
                                setEditPhone(sentinel.phone || "");
                                setEditNotes(sentinel.notes || "");
                                setOpenEdit(true);
                              }}
                              className="text-zinc-700 hover:bg-zinc-50"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setDeleteId(sentinel.id);
                                setOpenDelete(true);
                              }}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
                {filteredSentinels.length === 0 && (
                  <div className="text-center py-8 text-zinc-500">
                    {query ? "No sentinels found matching your search." : "No sentinels added yet."}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Devices List */}
          <Card className="bg-white border-zinc-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-zinc-900">Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {Object.keys(devices).map((deviceId) => {
                  const device = devices[deviceId];
                  const sentinel = device?.sentinel_id
                    ? sentinels.find(s => s.id === device.sentinel_id)
                    : null;
                  const isOnline = isActive(deviceId);

                  return (
                    <div
                      key={deviceId}
                      className="p-3 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <StatusDot green={isOnline} />
                            <h3 className="font-mono text-sm text-zinc-900">{deviceId}</h3>
                          </div>
                          {sentinel ? (
                            <p className="text-sm text-zinc-600">Paired to: {sentinel.full_name}</p>
                          ) : (
                            <p className="text-sm text-amber-600">Unpaired</p>
                          )}
                          {device.last_seen_at && (
                            <p className="text-xs text-zinc-500 mt-1">
                              Last seen: {new Date(device.last_seen_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenLogs(deviceId)}
                            className="border-zinc-200 hover:bg-zinc-50"
                          >
                            <ActivitySquare className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDeviceLocation(deviceId)}
                            className="border-zinc-200 hover:bg-zinc-50 text-blue-600 hover:text-blue-700 hover:border-blue-300"
                          >
                            <MapPin className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenPairing(deviceId)}
                            className="border-zinc-200 hover:bg-zinc-50"
                          >
                            <LinkIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {Object.keys(devices).length === 0 && (
                  <div className="text-center py-8 text-zinc-500">
                    No devices found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Sentinel Dialog */}
      <AlertDialog open={openAdd} onOpenChange={setOpenAdd}>
        <AlertDialogContent className="bg-white border-zinc-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-900">Add New Sentinel</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-600">
              Add a new sentinel to monitor their device activities.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="text-zinc-700">Full Name *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
                className="border-zinc-200"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-zinc-700">Phone Number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                className="border-zinc-200"
              />
            </div>
            <div>
              <Label htmlFor="notes" className="text-zinc-700">Notes</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
                className="border-zinc-200"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setOpenAdd(false)} className="border-zinc-200">
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={addDisabled}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Sentinel
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Sentinel Dialog */}
      <AlertDialog open={openEdit} onOpenChange={setOpenEdit}>
        <AlertDialogContent className="bg-white border-zinc-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-900">Edit Sentinel</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-600">
              Update sentinel information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editName" className="text-zinc-700">Full Name *</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter full name"
                className="border-zinc-200"
              />
            </div>
            <div>
              <Label htmlFor="editPhone" className="text-zinc-700">Phone Number</Label>
              <Input
                id="editPhone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="Enter phone number"
                className="border-zinc-200"
              />
            </div>
            <div>
              <Label htmlFor="editNotes" className="text-zinc-700">Notes</Label>
              <Input
                id="editNotes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Optional notes"
                className="border-zinc-200"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)} className="border-zinc-200">
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!editName.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Update Sentinel
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Sentinel Dialog */}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent className="bg-white border-zinc-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-900">Delete Sentinel</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-600">
              Are you sure you want to delete this sentinel? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setOpenDelete(false)} className="border-zinc-200">
              Cancel
            </Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Log Panel */}
      {logPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900">
                Device Logs: <span className="font-mono">{logDeviceId}</span>
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setLogPanel(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto max-h-96">
              {logLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-zinc-600" />
                  <p className="mt-2 text-zinc-600">Loading logs...</p>
                </div>
              ) : logEvents.length > 0 ? (
                <div className="space-y-3">
                  {logEvents.map((event) => (
                    <div
                      key={`${event.id}-${event.created_at}`}
                      className="p-3 border border-zinc-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <EventBadge e={event} />
                            <span className="text-xs text-zinc-500">
                              {new Date(event.created_at).toLocaleString()}
                            </span>
                          </div>
                          {event.payload && Object.keys(event.payload).length > 0 && (
                            <div className="mt-2 text-xs text-zinc-600">
                              <pre className="bg-zinc-50 p-2 rounded border font-mono">
                                {JSON.stringify(event.payload, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-500">
                  No logs found for this device.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Device Location Dialog */}
      <AlertDialog open={openDeviceLocation} onOpenChange={setOpenDeviceLocation}>
        <AlertDialogContent className="bg-white border-zinc-200 max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Device Location
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-600">
              Last known location of the device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            {deviceLocationLat && deviceLocationLng && (
              <>
                <div className="bg-zinc-50 p-3 rounded border">
                  <p className="text-sm text-zinc-700">
                    <strong>Coordinates:</strong><br />
                    Lat: {deviceLocationLat.toFixed(6)}<br />
                    Lng: {deviceLocationLng.toFixed(6)}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    const mapsUrl = `https://www.google.com/maps?q=${deviceLocationLat},${deviceLocationLng}`;
                    window.open(mapsUrl, "_blank");
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Open in Maps
                </Button>
              </>
            )}
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setOpenDeviceLocation(false)}>
              Close
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pairing Dialog */}
      <AlertDialog open={openPair} onOpenChange={setOpenPair}>
        <AlertDialogContent className="bg-white border-zinc-200 max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-900 flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-blue-600" />
              Device Pairing
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-600">
              Manage pairing code for device: <span className="font-mono">{pairDeviceId}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            {pairLoading ? (
              <div className="text-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-zinc-600" />
              </div>
            ) : pairCode ? (
              <div className="space-y-3">
                <div className="bg-zinc-50 p-4 rounded border text-center">
                  <p className="text-sm text-zinc-600 mb-2">Pairing Code</p>
                  <p className="text-2xl font-bold font-mono text-zinc-900 flex items-center justify-center gap-2">
                    {pairCode}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToClipboard(pairCode)}
                      className="h-6 w-6 p-0"
                    >
                      <CopyIcon className="h-3 w-3" />
                    </Button>
                  </p>
                </div>
                <div className="text-xs text-zinc-500">
                  Expires: {pairExpires ? new Date(pairExpires).toLocaleString() : ""}
                  {pairUsedAt ? <> • Used: {new Date(pairUsedAt).toLocaleString()}</> : null}
                </div>
                <div className="text-xs text-zinc-500">
                  Text the device <span className="font-mono">PAIR {pairCode}</span> from the guardian phone.
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-zinc-600 mb-4">No active pairing code for this device.</p>
                <Button
                  onClick={handleGeneratePairing}
                  disabled={pairLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {pairLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Pairing Code"
                  )}
                </Button>
              </div>
            )}
            {pairCode && !pairUsedAt && (
              <Button
                onClick={handleGeneratePairing}
                disabled={pairLoading}
                variant="outline"
                className="w-full border-zinc-200"
              >
                {pairLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Regenerating...
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
}