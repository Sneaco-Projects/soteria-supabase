"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DeviceEvent = { event_type: string; payload: any; created_at: string };

export default function DeviceDetails() {
  const { id } = useParams() as { id: string };
  const [events, setEvents] = useState<DeviceEvent[]>([]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("device_events")
        .select("event_type, payload, created_at")
        .eq("device_id", id)
        .order("created_at", { ascending: false });
      if (!error) setEvents(data ?? []);
    })();
  }, [id]);

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Device {id}</CardTitle>
        </CardHeader>
        <CardContent>
          {events.map((e, i) => (
            <div key={i} className="border-b py-2">
              <div className="font-medium">{e.event_type}</div>
              <div className="text-sm text-gray-600">{new Date(e.created_at).toLocaleString()}</div>
              <pre className="text-xs text-gray-700 overflow-auto">{JSON.stringify(e.payload, null, 2)}</pre>
            </div>
          ))}
          {events.length === 0 && <div className="text-gray-500">No events yet.</div>}
        </CardContent>
      </Card>
    </div>
  );
}
