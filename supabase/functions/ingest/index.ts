// supabase/functions/ingest/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const got = (req.headers.get("x-device-secret") ?? "").trim();
  const exp = (Deno.env.get("DEVICE_INGEST_SECRET") ?? "").trim();
  if (!got || !exp || got !== exp) return new Response("Unauthorized", { status: 401 });

  const { device_token, hw_uid, event_type, payload } = await req.json().catch(() => ({}));
  if (!event_type) return new Response("Missing event_type", { status: 400 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // server-side only
  );

  // Prefer token
  let deviceId: string | null = null;
  if (device_token) {
    const { data } = await supabase.from("devices")
      .select("id").eq("device_token", device_token).single();
    deviceId = data?.id ?? null;
  } else if (hw_uid) {
    const { data } = await supabase.from("devices")
      .select("id").eq("hw_uid", hw_uid).single();
    deviceId = data?.id ?? null;
  }

  if (!deviceId) return new Response("Unknown device", { status: 404 });

  const { error } = await supabase.from("device_events").insert({
    device_id: deviceId,
    event_type,
    payload: payload ?? {},
  });
  if (error) return new Response(error.message, { status: 500 });

  return new Response("ok", { status: 200 });
});
