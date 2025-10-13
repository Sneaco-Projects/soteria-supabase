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

import { AlertTriangle, CheckCircle, Pencil, Trash2, Users, Plus, UserCheck, Smartphone, Crown, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

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

type WardenProfile = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
};

type ProviderProfile = {
  user_id: string;
  display_name: string | null;
  email: string;
  active: boolean;
};

type WardenProviderAssignment = {
  warden_id: string;
  provider_id: string;
  assigned_by: string;
  assigned_at: string;
  assignment_notes: string | null;
  active: boolean;
  warden_email: string;
  warden_display_name: string | null;
  provider_email: string;
  provider_display_name: string | null;
  provider_company_name: string | null;
  warden_sentinel_count: number;
};

type UserProfile = {
  id: string;
  email: string;
  display_name: string | null;
  role: 'warden' | 'provider' | 'architect';
  created_at: string;
  updated_at: string;
  sentinel_count?: number;
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

  // Tab state
  const [activeTab, setActiveTab] = useState<"devices" | "providers" | "users">("devices");

  // Device management
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [search, setSearch] = useState("");

  // Add device modal
  const [openAdd, setOpenAdd] = useState(false);
  const [newHwUid, setNewHwUid] = useState("");
  const [newContact, setNewContact] = useState("");

  // Edit device modal
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editHwUid, setEditHwUid] = useState("");
  const [editContact, setEditContact] = useState("");

  // Delete device modal
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Provider management
  const [wardens, setWardens] = useState<WardenProfile[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [assignments, setAssignments] = useState<WardenProviderAssignment[]>([]);
  const [providerSearch, setProviderSearch] = useState("");

  // Add assignment modal
  const [openAddAssignment, setOpenAddAssignment] = useState(false);
  const [selectedWarden, setSelectedWarden] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [assignmentNotes, setAssignmentNotes] = useState("");

  // Remove assignment modal
  const [openRemoveAssignment, setOpenRemoveAssignment] = useState(false);
  const [removeAssignmentId, setRemoveAssignmentId] = useState<{warden_id: string, provider_id: string} | null>(null);

  // User management
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserForPromotion, setSelectedUserForPromotion] = useState<UserProfile | null>(null);
  
  // Promote user modal
  const [openPromoteUser, setOpenPromoteUser] = useState(false);
  const [promotionRole, setPromotionRole] = useState<'provider' | 'architect'>('provider');
  const [companyName, setCompanyName] = useState(""); // For provider promotion

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

  const loadProviderData = async () => {
    try {
      console.log("Loading provider data...");
      
      // Load wardens
      const { data: wardensData, error: wardensError } = await supabase
        .from("profiles")
        .select("id, email, display_name, created_at")
        .eq("role", "warden")
        .order("display_name");
      
      console.log("Wardens loaded:", wardensData?.length, "Error:", wardensError);
      
      if (wardensError) {
        console.error("Error loading wardens:", wardensError);
        throw wardensError;
      }
      setWardens(wardensData ?? []);

      // Load all providers - simplified approach
      const { data: providerProfiles, error: providersError } = await supabase
        .from("profiles")
        .select("id, email, display_name")
        .eq("role", "provider")
        .order("display_name");
      
      console.log("Providers loaded:", providerProfiles?.length, "Error:", providersError);
      
      if (providersError) {
        console.error("Error loading providers:", providersError);
        throw providersError;
      }

      // Get provider details from providers table
      let providerDetails: Record<string, any> = {};
      if ((providerProfiles ?? []).length > 0) {
        const providerIds = (providerProfiles ?? []).map(p => p.id);
        const { data: providerData, error: providerDetailError } = await supabase
          .from("providers")
          .select("user_id, display_name, active")
          .in("user_id", providerIds);

        if (!providerDetailError && providerData) {
          providerData.forEach(p => {
            providerDetails[p.user_id] = p;
          });
        }
      }
      
      const formattedProviders: ProviderProfile[] = (providerProfiles ?? []).map(p => ({
        user_id: p.id,
        display_name: providerDetails[p.id]?.display_name || p.display_name || 'Unnamed Provider',
        email: p.email || '',
        active: providerDetails[p.id]?.active ?? true
      }));
      setProviders(formattedProviders);

      // Load existing assignments - simplified
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("warden_provider_assignments")
        .select("warden_id, provider_id, assigned_by, created_at, notes, active")
        .eq("active", true);

      if (!assignmentsError && assignmentsData) {
        // Get additional details for assignments
        const wardenIds = [...new Set(assignmentsData.map(a => a.warden_id))];
        const providerIds = [...new Set(assignmentsData.map(a => a.provider_id))];

        // Get warden details
        const { data: wardenDetails } = await supabase
          .from("profiles")
          .select("id, email, display_name")
          .in("id", wardenIds);

        // Get provider details
        const { data: providerDetailsForAssignments } = await supabase
          .from("profiles")
          .select("id, email, display_name")
          .in("id", providerIds);

        const wardenMap: Record<string, any> = {};
        const providerMap: Record<string, any> = {};

        (wardenDetails ?? []).forEach(w => wardenMap[w.id] = w);
        (providerDetailsForAssignments ?? []).forEach(p => providerMap[p.id] = p);

        const formattedAssignments: WardenProviderAssignment[] = assignmentsData.map(a => ({
          warden_id: a.warden_id,
          provider_id: a.provider_id,
          assigned_by: a.assigned_by,
          assigned_at: a.created_at,
          assignment_notes: a.notes,
          active: a.active,
          warden_email: wardenMap[a.warden_id]?.email || '',
          warden_display_name: wardenMap[a.warden_id]?.display_name,
          provider_email: providerMap[a.provider_id]?.email || '',
          provider_display_name: providerMap[a.provider_id]?.display_name,
          provider_company_name: providerDetails[a.provider_id]?.display_name,
          warden_sentinel_count: 0 // Will be calculated separately if needed
        }));
        setAssignments(formattedAssignments);
      } else {
        setAssignments([]);
      }
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to load provider data.");
    }
  };

  const addAssignment = async () => {
    try {
      if (!selectedWarden || !selectedProvider) {
        throw new Error("Please select both a warden and provider.");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated.");

      const { error } = await supabase
        .from("warden_provider_assignments")
        .insert({
          warden_id: selectedWarden,
          provider_id: selectedProvider,
          assigned_by: user.id,
          notes: assignmentNotes.trim() || null
        });

      if (error) throw error;

      setSuccessMsg("Provider assigned to warden successfully.");
      setOpenAddAssignment(false);
      setSelectedWarden("");
      setSelectedProvider("");
      setAssignmentNotes("");
      await loadProviderData();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to add assignment.");
    }
  };

  const removeAssignment = async () => {
    try {
      if (!removeAssignmentId) return;

      const { error } = await supabase
        .from("warden_provider_assignments")
        .update({ active: false })
        .eq("warden_id", removeAssignmentId.warden_id)
        .eq("provider_id", removeAssignmentId.provider_id);

      if (error) throw error;

      setSuccessMsg("Assignment removed successfully.");
      setOpenRemoveAssignment(false);
      setRemoveAssignmentId(null);
      await loadProviderData();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to remove assignment.");
    }
  };

  const loadUsers = async () => {
    try {
      console.log("Loading users...");
      
      // Get all users first
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("id, email, display_name, role, created_at, updated_at")
        .order("created_at", { ascending: false });
      
      console.log("Users loaded:", usersData?.length, "Error:", usersError);
      
      if (usersError) {
        console.error("Error loading users:", usersError);
        throw usersError;
      }

      // Get sentinel counts - warden is the guardian (owner_guardian_id = warden's user ID)
      let sentinelCounts: Record<string, number> = {};
      
      try {
        const { data: sentinelsData, error: sentinelsError } = await supabase
          .from("sentinels")
          .select("owner_guardian_id");

        console.log("Sentinels loaded:", sentinelsData?.length, "Error:", sentinelsError);

        if (!sentinelsError && sentinelsData) {
          // Count sentinels per warden (guardian)
          sentinelsData.forEach(sentinel => {
            const wardenId = sentinel.owner_guardian_id; // This is the warden's user ID
            sentinelCounts[wardenId] = (sentinelCounts[wardenId] || 0) + 1;
          });
        }
      } catch (sentinelError) {
        console.warn("Could not load sentinel counts:", sentinelError);
        // Continue without sentinel counts
      }
      
      const formattedUsers: UserProfile[] = (usersData ?? []).map(user => ({
        id: user.id,
        email: user.email || '',
        display_name: user.display_name,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at,
        sentinel_count: sentinelCounts[user.id] || 0
      }));
      
      console.log("Formatted users:", formattedUsers.length);
      setUsers(formattedUsers);
    } catch (e: any) {
      console.error("Failed to load users:", e);
      setErrorMsg(e?.message ?? "Failed to load users.");
    }
  };

  const promoteUser = async () => {
    try {
      if (!selectedUserForPromotion) throw new Error("No user selected.");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated.");

      // Update user role in profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role: promotionRole })
        .eq("id", selectedUserForPromotion.id);

      if (profileError) throw profileError;

      // If promoting to provider, create provider record
      if (promotionRole === 'provider') {
        const { error: providerError } = await supabase
          .from("providers")
          .upsert({
            user_id: selectedUserForPromotion.id,
            display_name: companyName.trim() || selectedUserForPromotion.display_name || 'Unnamed Provider',
            active: true
          });

        if (providerError) throw providerError;
      }

      setSuccessMsg(`User promoted to ${promotionRole} successfully.`);
      setOpenPromoteUser(false);
      setSelectedUserForPromotion(null);
      setCompanyName("");
      await Promise.all([loadUsers(), loadProviderData()]);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to promote user.");
    }
  };

  useEffect(() => { 
    loadDevices(); 
    loadProviderData();
    loadUsers();
  }, []);

  /* ---------- Actions ---------- */
  const addDevice = async () => {
    try {
      const hw = newHwUid.trim();
      const contact = newContact.trim();
      if (!hw) throw new Error("Device ID (HW UID) is required.");
      if (!contact) throw new Error("Contact # (device SIM) is required for pairing instructions.");
      // Duplicate check
      const { data: existing, error: chkErr } = await supabase
        .from("devices").select("id").eq("hw_uid", hw).maybeSingle();
      if (chkErr) throw chkErr;
      if (existing) throw new Error("A device with this Device ID already exists.");

      const { error } = await supabase.from("devices").insert({
        hw_uid: hw,
        phone: contact, // store Contact # in proper phone column
        available: false, // start Unavailable
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
          phone: editContact.trim() || null, // contact #
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
        <div className="relative z-10 p-6 max-w-7xl mx-auto">
          <Card className="bg-white/90 border-emerald-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle>Architect Dashboard</CardTitle>
              <CardDescription>
                Manage devices and provider-warden assignments.
              </CardDescription>
            </CardHeader>
            
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "devices" | "providers" | "users")}>
              <TabsList className="mx-6 mb-4">
                <TabsTrigger value="devices" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Device Management
                </TabsTrigger>
                <TabsTrigger value="providers" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Provider Assignments
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  User Management
                </TabsTrigger>
              </TabsList>

              <TabsContent value="devices" className="mt-0">
                <div className="px-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Device Inventory</h3>
                      <p className="text-sm text-gray-600">
                        Add devices and mark them <b>Available</b> so Wardens can pair them.
                      </p>
                    </div>
                    <Button onClick={() => setOpenAdd(true)} className="bg-emerald-600 hover:bg-emerald-700">
                      Add Device
                    </Button>
                  </div>
                  <div className="mb-4">
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search hw_uid, contact #, available/assigned…"
                      className="bg-white/80"
                    />
                  </div>
                </div>
                
                <CardContent className="px-6 pb-6 space-y-3">
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
              </TabsContent>

              <TabsContent value="providers" className="mt-0">
                <div className="px-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Provider Assignments</h3>
                      <p className="text-sm text-gray-600">
                        Assign providers to wardens so they can monitor device activity.
                      </p>
                    </div>
                    <Button 
                      onClick={() => setOpenAddAssignment(true)} 
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Assignment
                    </Button>
                  </div>
                  
                  <div className="mb-4">
                    <Input
                      value={providerSearch}
                      onChange={(e) => setProviderSearch(e.target.value)}
                      placeholder="Search assignments by warden or provider name..."
                      className="bg-white/80"
                    />
                  </div>

                  <div className="space-y-4 pb-6">
                    {assignments
                      .filter(a => 
                        a.active && (
                          a.warden_display_name?.toLowerCase().includes(providerSearch.toLowerCase()) ||
                          a.provider_display_name?.toLowerCase().includes(providerSearch.toLowerCase()) ||
                          a.provider_company_name?.toLowerCase().includes(providerSearch.toLowerCase()) ||
                          a.warden_email.toLowerCase().includes(providerSearch.toLowerCase()) ||
                          a.provider_email.toLowerCase().includes(providerSearch.toLowerCase())
                        )
                      )
                      .map((assignment) => (
                        <Card key={`${assignment.warden_id}-${assignment.provider_id}`} className="border-emerald-100 bg-white/70">
                          <CardContent className="py-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-3">
                                <div className="flex items-center gap-4">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <UserCheck className="h-4 w-4 text-blue-600" />
                                      <span className="font-medium text-sm">Warden</span>
                                    </div>
                                    <p className="text-sm font-semibold">{assignment.warden_display_name || 'Unnamed'}</p>
                                    <p className="text-xs text-gray-600">{assignment.warden_email}</p>
                                  </div>
                                  <div className="mx-4 text-gray-400">→</div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <Users className="h-4 w-4 text-emerald-600" />
                                      <span className="font-medium text-sm">Provider</span>
                                    </div>
                                    <p className="text-sm font-semibold">
                                      {assignment.provider_company_name || assignment.provider_display_name || 'Unnamed'}
                                    </p>
                                    <p className="text-xs text-gray-600">{assignment.provider_email}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span>Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}</span>
                                  {assignment.warden_sentinel_count > 0 && (
                                    <span>{assignment.warden_sentinel_count} sentinel(s)</span>
                                  )}
                                </div>
                                
                                {assignment.assignment_notes && (
                                  <div className="bg-gray-50 p-2 rounded text-xs">
                                    <span className="font-medium">Notes:</span> {assignment.assignment_notes}
                                  </div>
                                )}
                              </div>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => {
                                  setRemoveAssignmentId({
                                    warden_id: assignment.warden_id,
                                    provider_id: assignment.provider_id
                                  });
                                  setOpenRemoveAssignment(true);
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                    {assignments.filter(a => a.active).length === 0 && (
                      <Card className="border-emerald-100 bg-white/70">
                        <CardContent className="py-8 text-center text-gray-600">
                          <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                          <p className="font-medium">No provider assignments</p>
                          <p className="text-sm">Start by assigning a provider to a warden.</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="users" className="mt-0">
                <div className="px-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">User Management</h3>
                      <p className="text-sm text-gray-600">
                        Promote registered wardens to provider or architect roles.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <Input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search users by email or name..."
                      className="bg-white/80"
                    />
                  </div>

                  <div className="space-y-4 pb-6">
                    {users
                      .filter(user => 
                        user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                        user.display_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                        false
                      )
                      .map((user) => (
                        <Card key={user.id} className="border-emerald-100 bg-white/70">
                          <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    {user.role === 'architect' && <Crown className="h-4 w-4 text-yellow-600" />}
                                    {user.role === 'provider' && <Users className="h-4 w-4 text-emerald-600" />}
                                    {user.role === 'warden' && <Shield className="h-4 w-4 text-blue-600" />}
                                    <span className="font-medium text-sm capitalize">{user.role}</span>
                                  </div>
                                  <Badge 
                                    variant={
                                      user.role === 'architect' ? 'default' :
                                      user.role === 'provider' ? 'secondary' : 'outline'
                                    }
                                    className="text-xs"
                                  >
                                    {user.role}
                                  </Badge>
                                </div>
                                
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="font-medium">Name:</span>
                                    <span className="text-gray-700">{user.display_name || 'Not set'}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="font-medium">Email:</span>
                                    <span className="text-gray-700">{user.email}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span>Registered: {new Date(user.created_at).toLocaleDateString()}</span>
                                    {user.role === 'warden' && user.sentinel_count !== undefined && (
                                      <span>{user.sentinel_count} sentinel(s)</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {user.role === 'warden' && (
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUserForPromotion(user);
                                      setPromotionRole('provider');
                                      setOpenPromoteUser(true);
                                    }}
                                  >
                                    <Users className="mr-2 h-4 w-4" />
                                    Promote to Provider
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUserForPromotion(user);
                                      setPromotionRole('architect');
                                      setOpenPromoteUser(true);
                                    }}
                                  >
                                    <Crown className="mr-2 h-4 w-4" />
                                    Promote to Architect
                                  </Button>
                                </div>
                              )}
                              
                              {user.role !== 'warden' && (
                                <div className="text-sm text-gray-500 italic">
                                  Already promoted
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                    {users.filter(u => 
                      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                      u.display_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                      false
                    ).length === 0 && (
                      <Card className="border-emerald-100 bg-white/70">
                        <CardContent className="py-8 text-center text-gray-600">
                          <Crown className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                          <p className="font-medium">No users found</p>
                          <p className="text-sm">
                            {userSearch ? 
                              "No users match your search criteria." : 
                              "No users have registered yet."
                            }
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
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
              <Label>Contact # (device SIM) *</Label>
              <Input value={newContact} onChange={(e) => setNewContact(e.target.value)} placeholder="+63 9XX XXX XXXX" />
              <p className="text-xs text-gray-500 mt-1">
                This phone number will be shown to Wardens for SMS pairing instructions.
              </p>
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

      {/* Add provider assignment */}
      <Dialog open={openAddAssignment} onOpenChange={setOpenAddAssignment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Provider to Warden</DialogTitle>
            <DialogDescription>
              Select a warden and provider to create a monitoring assignment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Warden</Label>
              <Select value={selectedWarden} onValueChange={setSelectedWarden}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a warden" />
                </SelectTrigger>
                <SelectContent>
                  {wardens.map((warden) => (
                    <SelectItem key={warden.id} value={warden.id}>
                      {warden.display_name || warden.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Provider</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.filter(p => p.active).map((provider) => (
                    <SelectItem key={provider.user_id} value={provider.user_id}>
                      {provider.display_name || provider.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder="Add any notes about this assignment..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setOpenAddAssignment(false);
                setSelectedWarden("");
                setSelectedProvider("");
                setAssignmentNotes("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={addAssignment}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove assignment confirmation */}
      <AlertDialog open={openRemoveAssignment} onOpenChange={setOpenRemoveAssignment}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the provider's access to monitor this warden's devices. This action can be reversed by creating a new assignment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setOpenRemoveAssignment(false)}>Cancel</Button>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700" 
              onClick={removeAssignment}
            >
              Remove Assignment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promote user modal */}
      <Dialog open={openPromoteUser} onOpenChange={setOpenPromoteUser}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {promotionRole === 'provider' ? (
                <Users className="h-5 w-5 text-emerald-600" />
              ) : (
                <Crown className="h-5 w-5 text-yellow-600" />
              )}
              Promote to {promotionRole === 'provider' ? 'Provider' : 'Architect'}
            </DialogTitle>
            <DialogDescription>
              {selectedUserForPromotion && (
                <>
                  Promote <strong>{selectedUserForPromotion.display_name || selectedUserForPromotion.email}</strong> from 
                  warden to {promotionRole}. This will change their access permissions permanently.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm">
                <div><span className="font-medium">Current role:</span> Warden</div>
                <div><span className="font-medium">New role:</span> {promotionRole === 'provider' ? 'Provider' : 'Architect'}</div>
              </div>
            </div>
            
            {promotionRole === 'provider' && (
              <div>
                <Label>Company/Organization Name</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company or organization name..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be displayed as the provider name in assignments.
                </p>
              </div>
            )}
            
            {promotionRole === 'architect' && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Warning</p>
                    <p>Architects have full system access including user management and device provisioning.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setOpenPromoteUser(false);
                setSelectedUserForPromotion(null);
                setCompanyName("");
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={promoteUser}
              className={promotionRole === 'architect' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-emerald-600 hover:bg-emerald-700'}
            >
              Promote to {promotionRole === 'provider' ? 'Provider' : 'Architect'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
