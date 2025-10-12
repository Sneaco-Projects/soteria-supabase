"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

import { CheckCircle, AlertTriangle } from "lucide-react";

type DeviceOverview = {
  device_id: string;
  hw_uid: string;
  model: string | null; // we use this as the "Contact #"
  sentinel_name: string | null;
  last_seen_at: string | null;
  latest_event_type: string | null;
};

export default function ArchitectDashboard() {
  const router = useRouter();

  // ----- Role guard -----
  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/auth/signin";
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (profile?.role !== "architect") {
        window.location.href = `/dashboard/${profile?.role ?? "warden"}`;
        return;
      }
    };
    checkAccess();
  }, []);

  // Modals / toasts
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tabs
  const [tab, setTab] = useState<"devices">("devices");

  // Devices
  const [devices, setDevices] = useState<DeviceOverview[]>([]);
  const [openAddDevice, setOpenAddDevice] = useState(false);
  const [newDeviceHwUid, setNewDeviceHwUid] = useState("");
  const [newDeviceContact, setNewDeviceContact] = useState("");

  const loadDevices = async () => {
    const { data, error } = await supabase
      .from("v_architect_device_overview")
      .select("*")
      .order("last_seen_at", { ascending: false });
    if (error) throw error;
    setDevices(data ?? []);
  };

  useEffect(() => {
    (async () => {
      try {
        await loadDevices();
      } catch (e: any) {
        setErrorMsg(e?.message ?? "Failed to load data.");
      }
    })();
  }, []);

  // Add device: Device ID + Contact #
  const addDevice = async () => {
    try {
      const hwUid = newDeviceHwUid.trim();
      const contact = newDeviceContact.trim();
      if (!hwUid) throw new Error("Please enter a Device ID (HW UID).");

      // Exists?
      const { data: existing, error: checkError } = await supabase
        .from("devices")
        .select("hw_uid")
        .eq("hw_uid", hwUid)
        .maybeSingle();
      if (checkError) throw checkError;
      if (existing) throw new Error("A device with this Device ID already exists.");

      // Save contact # into 'model' column
      const { error } = await supabase.from("devices").insert({
        hw_uid: hwUid,
        model: contact || null,
      });
      if (error) throw error;

      setSuccessMsg("Device added. Mark it Available (via your rules/policies), so Wardens can pair it.");
      setOpenAddDevice(false);
      setNewDeviceHwUid("");
      setNewDeviceContact("");
      await loadDevices();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to add device.");
    }
  };

  return (
    <>
      {/* Error modal */}
      <AlertDialog open={!!errorMsg} onOpenChange={(open) => !open && setErrorMsg(null)}>
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
      <AlertDialog open={!!successMsg} onOpenChange={(open) => !open && setSuccessMsg(null)}>
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
        <div className="p-6 relative z-10">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="space-y-6">
            <TabsList className="bg-white/80 backdrop-blur-lg border border-emerald-200">
              <TabsTrigger value="devices">Devices</TabsTrigger>
            </TabsList>

            <TabsContent value="devices">
              <Card className="bg-white/90 backdrop-blur-lg border-emerald-200 shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Device Inventory</CardTitle>
                      <CardDescription>
                        Add devices and (via policies) mark them <b>Available</b> so Wardens can pair them.
                      </CardDescription>
                    </div>
                    <Button onClick={() => setOpenAddDevice(true)} className="bg-emerald-600 hover:bg-emerald-700">
                      Add Device
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {devices.map((d) => (
                    <Card key={d.device_id} className="border-emerald-100 bg-white/80">
                      <CardContent className="py-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-800">{d.hw_uid}</div>
                          <div className="text-sm text-gray-600">
                            Contact: {d.model ?? "—"} • Sentinel: {d.sentinel_name ?? "—"} • Last seen:{" "}
                            {d.last_seen_at ? new Date(d.last_seen_at).toLocaleString() : "—"} • Last event:{" "}
                            {d.latest_event_type ?? "—"}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/dashboard/architect/devices/view?id=${d.device_id}`)}
                        >
                          Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}

                  {devices.length === 0 && (
                    <Card className="border-emerald-100 bg-white/70">
                      <CardContent className="py-6 text-gray-600">No devices yet.</CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Add Device Modal */}
      <AlertDialog open={openAddDevice} onOpenChange={setOpenAddDevice}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Device</AlertDialogTitle>
            <AlertDialogDescription>
              Add a device to the system so Wardens can pair it with sentinels.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="hw-uid">Device ID (HW UID) *</Label>
              <Input
                id="hw-uid"
                value={newDeviceHwUid}
                onChange={(e) => setNewDeviceHwUid(e.target.value)}
                placeholder="Enter device ID/IMEI…"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="contact">Contact # (device SIM)</Label>
              <Input
                id="contact"
                value={newDeviceContact}
                onChange={(e) => setNewDeviceContact(e.target.value)}
                placeholder="+63 9XX XXX XXXX"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                This number appears in the Warden instruction as the destination for the pairing SMS.
              </p>
            </div>

            {errorMsg && <div className="text-red-500 text-sm">{errorMsg}</div>}
          </div>

          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenAddDevice(false);
                setNewDeviceHwUid("");
                setNewDeviceContact("");
                setErrorMsg("");
              }}
            >
              Cancel
            </Button>
            <AlertDialogAction onClick={addDevice}>
              Add Device
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
