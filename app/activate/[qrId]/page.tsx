"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, Loader2, Smartphone, QrCode } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type DeviceQR = {
  id: string;
  imei: string;
  sim_number: string;
  device_model: string | null;
  notes: string | null;
  status: string;
  activated_at: string | null;
  activated_by: string | null;
  device_id: string | null;
  expires_at: string | null;
};

type Sentinel = {
  id: string;
  full_name: string;
};

export default function DeviceActivation() {
  const params = useParams();
  const router = useRouter();
  const qrId = params?.qrId as string;

  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [qrData, setQrData] = useState<DeviceQR | null>(null);
  const [sentinels, setSentinels] = useState<Sentinel[]>([]);
  const [selectedSentinel, setSelectedSentinel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [alreadyActivated, setAlreadyActivated] = useState(false);
  const [activatedDevice, setActivatedDevice] = useState<any>(null);

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Redirect to sign in with return URL
        router.push(`/auth/signin?redirect=/activate/${qrId}`);
        return;
      }
      setIsSignedIn(true);
    };
    checkAuth();
  }, [qrId, router]);

  // Load QR code data and user sentinels
  useEffect(() => {
    if (!isSignedIn) return;

    const loadData = async () => {
      try {
        setLoading(true);

        // Load QR code data (allow any status for better UX)
        const { data: qrCode, error: qrError } = await supabase
          .from("device_qr_codes")
          .select("*")
          .eq("qr_code", qrId)
          .maybeSingle();

        if (qrError) throw qrError;
        
        if (!qrCode) {
          setError("Invalid QR code. Please contact support.");
          return;
        }

        // Check if QR code is expired
        if (qrCode.expires_at && new Date(qrCode.expires_at) < new Date()) {
          setError("This QR code has expired. Please contact support for a new activation code.");
          return;
        }

        setQrData(qrCode);

        // Check if already activated
        if (qrCode.status === "activated") {
          setAlreadyActivated(true);
          
          // Load device and sentinel info for already activated QR codes
          if (qrCode.device_id) {
            const { data: deviceInfo, error: deviceError } = await supabase
              .from("devices")
              .select(`
                *,
                sentinel:sentinels(id, full_name)
              `)
              .eq("id", qrCode.device_id)
              .maybeSingle();

            if (!deviceError && deviceInfo) {
              setActivatedDevice(deviceInfo);
            }
          }
        } else {
          // Load user's sentinels for new activations
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: userSentinels, error: sentinelsError } = await supabase
              .from("sentinels")
              .select("id, full_name")
              .eq("owner_guardian_id", user.id)
              .order("full_name");

            if (sentinelsError) throw sentinelsError;
            setSentinels(userSentinels || []);
          }
        }

      } catch (err: any) {
        setError(err?.message || "Failed to load activation data.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [qrId, isSignedIn]);

  const activateDevice = async () => {
    if (!qrData || !selectedSentinel) return;

    try {
      setActivating(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Double-check the QR code is still available for activation
      const { data: currentQrData, error: checkError } = await supabase
        .from("device_qr_codes")
        .select("status, activated_by")
        .eq("id", qrData.id)
        .single();

      if (checkError) throw checkError;

      // If already activated, check if it was activated by the same user
      if (currentQrData.status === "activated") {
        if (currentQrData.activated_by === user.id) {
          // Same user - show success
          setSuccess(true);
          setTimeout(() => {
            router.push("/dashboard/warden");
          }, 2000);
          return;
        } else {
          // Different user - show error
          throw new Error("This device has already been activated by another user.");
        }
      }

      // Create device record
      const { data: device, error: deviceError } = await supabase
        .from("devices")
        .insert({
          hw_uid: qrData.imei,
          model: qrData.device_model || "Soteria Device",
          sentinel_id: selectedSentinel,
          available: false, // Device is now paired
          owner_id: user.id
        })
        .select()
        .single();

      if (deviceError) throw deviceError;

      // Update QR code status - only if still 'generated'
      const { error: updateError } = await supabase
        .from("device_qr_codes")
        .update({
          status: "activated",
          activated_at: new Date().toISOString(),
          activated_by: user.id,
          device_id: device.id
        })
        .eq("id", qrData.id)
        .eq("status", "generated"); // Only update if still pending

      if (updateError) throw updateError;

      setSuccess(true);
      
      // Redirect to warden dashboard after success
      setTimeout(() => {
        router.push("/dashboard/warden");
      }, 3000);

    } catch (err: any) {
      setError(err?.message || "Failed to activate device.");
    } finally {
      setActivating(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading device activation...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-700">Device Activated!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-700">
              Your device has been successfully activated and paired to your sentinel.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to your dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (alreadyActivated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-blue-700">Device Already Activated</CardTitle>
            <p className="text-gray-600">This device has already been activated and paired</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Device Information */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-gray-600" />
                <span className="font-medium">Device Information</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>IMEI:</strong> {qrData?.imei}</p>
                <p><strong>SIM:</strong> {qrData?.sim_number}</p>
                {qrData?.device_model && <p><strong>Model:</strong> {qrData.device_model}</p>}
                <p><strong>Status:</strong> <span className="text-green-600 font-medium">Activated</span></p>
                <p><strong>Activated:</strong> {qrData?.activated_at ? new Date(qrData.activated_at).toLocaleDateString() : "Unknown"}</p>
                {activatedDevice?.sentinel && (
                  <p><strong>Assigned to:</strong> {activatedDevice.sentinel.full_name}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => router.push("/dashboard/warden")} 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Go to Dashboard
              </Button>
              <Button 
                onClick={() => router.back()} 
                variant="outline"
                className="flex-1"
              >
                Go Back
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              If you need to make changes to this device, please visit your dashboard or contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-red-700">Activation Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-700">{error}</p>
            <Button onClick={() => router.push("/dashboard/warden")} variant="outline">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <QrCode className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
          <CardTitle className="text-2xl">Activate Your Device</CardTitle>
          <p className="text-gray-600">Complete the setup for your Soteria safety device</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Device Information */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-gray-600" />
              <span className="font-medium">Device Information</span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>IMEI:</strong> {qrData?.imei}</p>
              <p><strong>SIM:</strong> {qrData?.sim_number}</p>
              {qrData?.device_model && <p><strong>Model:</strong> {qrData.device_model}</p>}
              {qrData?.notes && <p><strong>Notes:</strong> {qrData.notes}</p>}
            </div>
          </div>

          {/* Sentinel Selection */}
          <div className="space-y-2">
            <Label htmlFor="sentinel">Assign to Sentinel</Label>
            <Select onValueChange={setSelectedSentinel} required>
              <SelectTrigger>
                <SelectValue placeholder="Choose which family member will carry this device" />
              </SelectTrigger>
              <SelectContent>
                {sentinels.map((sentinel) => (
                  <SelectItem key={sentinel.id} value={sentinel.id}>
                    {sentinel.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sentinels.length === 0 && (
              <p className="text-sm text-amber-600">
                You need to add family members (sentinels) first. 
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-amber-600 underline"
                  onClick={() => router.push("/dashboard/warden")}
                >
                  Go to Dashboard
                </Button>
              </p>
            )}
          </div>

          {/* Activation Button */}
          <Button 
            onClick={activateDevice}
            disabled={!selectedSentinel || activating || sentinels.length === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {activating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Activating Device...
              </>
            ) : (
              "Activate & Pair Device"
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            This will activate your device and automatically pair it to the selected family member.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}