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

    const { code, hw_uid, model } = await req.json();
    if (!code || !hw_uid) return new Response("code and hw_uid required", { status: 400 });

    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: claim, error: e1 } = await svc
      .from("device_claims")
      .select("*")
      .eq("code", code)
      .is("used_at", null)
      .single();
    if (e1 || !claim) return new Response("Invalid claim", { status: 400 });
    if (new Date(claim.expires_at) < new Date()) return new Response("Expired", { status: 410 });
    if (claim.hw_uid && claim.hw_uid !== hw_uid) return new Response("HW mismatch", { status: 409 });

    // Ensure device exists, then link
    const { data: dev } = await svc.from("devices").select("id").eq("hw_uid", hw_uid).maybeSingle();
    let device_id = dev?.id;

    if (!device_id) {
      const { data: ins, error: e2 } = await svc
        .from("devices")
        .insert({ hw_uid, model: model ?? null, sentinel_id: claim.sentinel_id })
        .select("id").single();
      if (e2) return new Response(e2.message, { status: 500 });
      device_id = ins.id;
    } else {
      const { error: e3 } = await svc
        .from("devices")
        .update({ sentinel_id: claim.sentinel_id })
        .eq("id", device_id);
      if (e3) return new Response(e3.message, { status: 500 });
    }

    await svc.from("device_claims").update({ used_at: new Date().toISOString() }).eq("code", code);

    return new Response(JSON.stringify({ ok: true, device_id }), {
      headers: { "content-type": "application/json" }
    });
  } catch (e: any) {
    return new Response(e?.message ?? "error", { status: 500 });
  }
});
