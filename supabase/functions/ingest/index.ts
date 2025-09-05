// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

    const devSecret = req.headers.get("x-device-secret");
    if (devSecret !== Deno.env.get("DEVICE_INGEST_SECRET")) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { hw_uid, event_type, payload } = await req.json();
    if (!hw_uid || !event_type || payload == null) {
      return new Response("hw_uid, event_type, payload required", { status: 400 });
    }

    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: dev, error: e1 } = await svc
      .from("devices")
      .select("id, sentinel_id")
      .eq("hw_uid", hw_uid)
      .single();
    if (e1 || !dev) return new Response("Unknown device", { status: 404 });

    const { error: e2 } = await svc.from("device_events").insert({
      device_id: dev.id,
      sentinel_id: dev.sentinel_id,
      event_type,
      payload
    });
    if (e2) return new Response(e2.message, { status: 500 });

    await svc.from("devices").update({ last_seen_at: new Date().toISOString() }).eq("id", dev.id);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" }
    });
  } catch (e: any) {
    return new Response(e?.message ?? "error", { status: 500 });
  }
});
