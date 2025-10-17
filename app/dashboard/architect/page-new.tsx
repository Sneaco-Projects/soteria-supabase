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

import { AlertTriangle, CheckCircle, Pencil, Trash2, Users, Plus, UserCheck, Smartphone, Crown, Shield, QrCode, Menu, X } from "lucide-react";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

/* ---------- Types ---------- */
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

type DeviceQRCode = {
  id: string;
  imei: string;
  sim_number: string;
  qr_code: string;
  device_model: string | null;
  notes: string | null;
  generated_at: string;
  activated_at: string | null;
  device_id: string | null;
  generated_by_name: string | null;
  activated_by_name: string | null;
  sentinel_name: string | null;
  status: 'pending' | 'activated' | 'paired';
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

  /* ---------- State ---------- */
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Navigation state
  const [activeTab, setActiveTab] = useState<"devices" | "qr-codes" | "providers" | "users">("devices");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Device management
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [search, setSearch] = useState("");

  // QR Code management
  const [qrCodes, setQrCodes] = useState<DeviceQRCode[]>([]);
  const [qrSearch, setQrSearch] = useState("");
  const [openQrGenerate, setOpenQrGenerate] = useState(false);
  const [qrForm, setQrForm] = useState({
    imei: "",
    sim_number: "",
    device_model: "",
    notes: ""
  });

  /* ---------- Functions ---------- */
  const loadDevices = async () => {
    try {
      const { data, error } = await supabase
        .from("v_architect_device_overview")
        .select("*")
        .order("last_seen_at", { ascending: false });
      if (error) throw error;
      
      const normalized = (data ?? []).map((r: any) => ({
        id: r.device_id ?? r.id,
        hw_uid: r.hw_uid,
        contact: r.model ?? null,
        sentinel_name: r.sentinel_name ?? null,
        last_seen_at: r.last_seen_at ?? null,
        latest_event_type: r.latest_event_type ?? null,
        available: !r.sentinel_name,
        assigned: !!r.sentinel_name,
      }));
      
      setDevices(normalized);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to load devices.");
    }
  };

  const loadQrCodes = async () => {
    try {
      const { data, error } = await supabase
        .from("v_architect_qr_overview")
        .select("*")
        .order("generated_at", { ascending: false });
      
      if (error) throw error;
      setQrCodes(data ?? []);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to load QR codes.");
    }
  };

  const generateQrCode = async () => {
    try {
      if (!qrForm.imei.trim() || !qrForm.sim_number.trim()) {
        throw new Error("IMEI and SIM number are required.");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated.");

      // Generate unique QR code string
      const qrCodeId = crypto.randomUUID();

      const { error } = await supabase
        .from("device_qr_codes")
        .insert({
          imei: qrForm.imei.trim(),
          sim_number: qrForm.sim_number.trim(),
          qr_code: qrCodeId,
          device_model: qrForm.device_model.trim() || null,
          notes: qrForm.notes.trim() || null,
          generated_by: user.id
        });

      if (error) throw error;
      
      setSuccessMsg("QR code generated successfully.");
      setOpenQrGenerate(false);
      setQrForm({
        imei: "",
        sim_number: "",
        device_model: "",
        notes: ""
      });
      await loadQrCodes();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to generate QR code.");
    }
  };

  useEffect(() => { 
    loadDevices(); 
    loadQrCodes();
  }, []);

  /* ---------- Derived ---------- */
  const filteredDevices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return devices;
    return devices.filter((d) =>
      [d.hw_uid, d.contact ?? "", d.sentinel_name ?? ""].some((v) => v.toLowerCase().includes(q))
    );
  }, [devices, search]);

  const filteredQrCodes = useMemo(() => {
    const q = qrSearch.trim().toLowerCase();
    if (!q) return qrCodes;
    return qrCodes.filter((qr) =>
      [
        qr.imei,
        qr.sim_number,
        qr.device_model ?? "",
        qr.status,
      ].some((v) => v.toLowerCase().includes(q))
    );
  }, [qrCodes, qrSearch]);

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

      {/* Main Layout */}
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="flex">
          {/* Sidebar */}
          <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-emerald-200 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
            <div className="flex items-center justify-between h-16 px-6 border-b border-emerald-200">
              <h1 className="text-lg font-semibold text-emerald-900">Architect Panel</h1>
              <Button 
                variant="ghost" 
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <nav className="mt-8">
              <div className="px-4 space-y-2">
                <button
                  onClick={() => {setActiveTab("devices"); setSidebarOpen(false);}}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === "devices" 
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-200" 
                      : "text-gray-700 hover:bg-emerald-50"
                  }`}
                >
                  <Smartphone className="h-5 w-5" />
                  Device Management
                </button>
                
                <button
                  onClick={() => {setActiveTab("qr-codes"); setSidebarOpen(false);}}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === "qr-codes" 
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-200" 
                      : "text-gray-700 hover:bg-emerald-50"
                  }`}
                >
                  <QrCode className="h-5 w-5" />
                  Device QR Codes
                </button>
                
                <button
                  onClick={() => {setActiveTab("providers"); setSidebarOpen(false);}}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === "providers" 
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-200" 
                      : "text-gray-700 hover:bg-emerald-50"
                  }`}
                >
                  <Users className="h-5 w-5" />
                  Provider Assignments
                </button>
                
                <button
                  onClick={() => {setActiveTab("users"); setSidebarOpen(false);}}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === "users" 
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-200" 
                      : "text-gray-700 hover:bg-emerald-50"
                  }`}
                >
                  <Crown className="h-5 w-5" />
                  User Management
                </button>
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 lg:ml-0">
            {/* Mobile Top Bar */}
            <div className="bg-white border-b border-emerald-200 lg:hidden">
              <div className="flex items-center justify-between h-16 px-6">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold text-emerald-900">Architect Dashboard</h1>
                <div></div>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6">
              {/* Devices Tab */}
              {activeTab === "devices" && (
                <Card className="bg-white/90 border-emerald-200 shadow-lg">
                  <CardHeader className="pb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">Device Inventory</CardTitle>
                        <CardDescription>
                          Manage device inventory. Users can pair any <b>Available</b> device using its Device ID.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search devices..."
                        className="bg-white/80"
                      />
                    </div>
                    <div className="space-y-4">
                      {filteredDevices.map((d) => (
                        <Card key={d.id} className="border-emerald-100">
                          <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-mono font-medium">{d.hw_uid}</p>
                                <p className="text-sm text-gray-600">
                                  {d.sentinel_name ? `Assigned to: ${d.sentinel_name}` : "Unassigned"}
                                </p>
                              </div>
                              <Badge variant={d.available ? "default" : "secondary"}>
                                {d.available ? "Available" : "Assigned"}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* QR Codes Tab */}
              {activeTab === "qr-codes" && (
                <Card className="bg-white/90 border-emerald-200 shadow-lg">
                  <CardHeader className="pb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">Device QR Codes</CardTitle>
                        <CardDescription>
                          Generate QR codes for device activation. Customers scan to instantly activate and pair devices.
                        </CardDescription>
                      </div>
                      <Button onClick={() => setOpenQrGenerate(true)} className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Generate QR Code
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <Input
                        value={qrSearch}
                        onChange={(e) => setQrSearch(e.target.value)}
                        placeholder="Search QR codes..."
                        className="bg-white/80"
                      />
                    </div>
                    <div className="space-y-4">
                      {filteredQrCodes.map((qr) => (
                        <Card key={qr.id} className="border-emerald-100">
                          <CardContent className="py-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm">{qr.imei}</span>
                                  <Badge variant={qr.status === 'pending' ? 'default' : qr.status === 'activated' ? 'secondary' : 'outline'}>
                                    {qr.status}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-600">
                                  <p>SIM: {qr.sim_number}</p>
                                  {qr.device_model && <p>Model: {qr.device_model}</p>}
                                  <p>Generated: {new Date(qr.generated_at).toLocaleDateString()}</p>
                                  {qr.activated_at && <p>Activated: {new Date(qr.activated_at).toLocaleDateString()}</p>}
                                </div>
                              </div>
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-20 h-20 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                  <QrCode className="h-8 w-8 text-gray-400" />
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    const url = `${window.location.origin}/activate/${qr.qr_code}`;
                                    navigator.clipboard.writeText(url);
                                    setSuccessMsg("Activation URL copied to clipboard!");
                                  }}
                                >
                                  Copy URL
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Other tabs can be added here */}
              {activeTab === "providers" && (
                <Card className="bg-white/90 border-emerald-200 shadow-lg">
                  <CardContent className="py-12 text-center text-gray-500">
                    Provider Assignments - Coming Soon
                  </CardContent>
                </Card>
              )}

              {activeTab === "users" && (
                <Card className="bg-white/90 border-emerald-200 shadow-lg">
                  <CardContent className="py-12 text-center text-gray-500">
                    User Management - Coming Soon
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Generation Modal */}
      <Dialog open={openQrGenerate} onOpenChange={setOpenQrGenerate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Device QR Code</DialogTitle>
            <DialogDescription>
              Create a QR code for device activation. Customers will scan this to automatically activate and pair the device.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="imei">Device IMEI *</Label>
              <Input
                id="imei"
                value={qrForm.imei}
                onChange={(e) => setQrForm(prev => ({...prev, imei: e.target.value}))}
                placeholder="Device IMEI/HW UID..."
              />
            </div>
            
            <div>
              <Label htmlFor="sim_number">SIM Number *</Label>
              <Input
                id="sim_number"
                value={qrForm.sim_number}
                onChange={(e) => setQrForm(prev => ({...prev, sim_number: e.target.value}))}
                placeholder="SIM card number..."
              />
            </div>
            
            <div>
              <Label htmlFor="device_model">Device Model</Label>
              <Input
                id="device_model"
                value={qrForm.device_model}
                onChange={(e) => setQrForm(prev => ({...prev, device_model: e.target.value}))}
                placeholder="ESP32-S3, etc..."
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={qrForm.notes}
                onChange={(e) => setQrForm(prev => ({...prev, notes: e.target.value}))}
                placeholder="Additional notes..."
                className="min-h-[60px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setOpenQrGenerate(false);
                setQrForm({
                  imei: "",
                  sim_number: "",
                  device_model: "",
                  notes: ""
                });
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={generateQrCode}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Generate QR Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}