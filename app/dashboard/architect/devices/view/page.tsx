"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DeviceEvent = { event_type: string; payload: any; created_at: string };

export default function DeviceDetails() {
  const sp = useSearchParams();
  const router = useRouter();
  const id = sp.get("id");
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("device_events")
        .select("event_type, payload, created_at")
        .eq("device_id", id)
        .order("created_at", { ascending: false });
      if (error) setErrorMsg(error.message);
      else setEvents(data ?? []);
      setLoading(false);
    })();
  }, [id]);

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Device {id ?? "—"}</CardTitle>
          <button className="text-sm underline opacity-80" onClick={() => router.back()}>
            ← Back
          </button>
        </CardHeader>
        <CardContent>
          {!id && <div className="text-gray-500">Missing device id.</div>}
          {id && loading && <div>Loading…</div>}
          {id && !loading && errorMsg && <div className="text-red-600">{errorMsg}</div>}
          {id && !loading && !errorMsg && events.length === 0 && (
            <div className="text-gray-500">No events yet.</div>
          )}
          {id && !loading && !errorMsg && events.map((e, i) => (
            <div key={i} className="border-b py-3">
              <div className="font-medium">{e.event_type}</div>
              <div className="text-sm text-gray-600">{new Date(e.created_at).toLocaleString()}</div>
              <pre className="text-xs text-gray-700 overflow-auto">{JSON.stringify(e.payload, null, 2)}</pre>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
