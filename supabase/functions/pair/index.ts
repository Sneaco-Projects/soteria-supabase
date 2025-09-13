// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---- CORS ----
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-device-secret, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ---- Env (new names with fallbacks) ----
const SUPA_URL = Deno.env.get("SB_URL") ?? Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE = Deno.env.get("SB_SERVICE_ROLE") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    if (!SUPA_URL || !SERVICE_ROLE) {
      return new Response("Server misconfigured: missing SB_URL or SB_SERVICE_ROLE", {
        status: 500,
        headers: corsHeaders,
      });
    }

    // ---- Robust secret check (diagnostic) ----
    const got = (req.headers.get("x-device-secret") ?? "").trim();
    const exp = (Deno.env.get("DEVICE_INGEST_SECRET") ?? "").trim();
    console.log("x-device-secret len:", got.length, "env len:", exp.length, "match:", got === exp);
    if (!got || !exp || got !== exp) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const { code, hw_uid, model } = await req.json();
    if (!code || !hw_uid) {
      return new Response("code and hw_uid required", { status: 400, headers: corsHeaders });
    }

    const svc = createClient(SUPA_URL, SERVICE_ROLE);

    const { data: claim, error: e1 } = await svc
      .from("device_claims")
      .select("*")
      .eq("code", code)
      .is("used_at", null)
      .single();
    if (e1 || !claim) return new Response("Invalid claim", { status: 400, headers: corsHeaders });
    if (new Date(claim.expires_at) < new Date()) return new Response("Expired", { status: 410, headers: corsHeaders });
    if (claim.hw_uid && claim.hw_uid !== hw_uid) return new Response("HW mismatch", { status: 409, headers: corsHeaders });

    const { data: dev } = await svc.from("devices").select("id").eq("hw_uid", hw_uid).maybeSingle();
    let device_id = dev?.id;

    if (!device_id) {
      const { data: ins, error: e2 } = await svc
        .from("devices")
        .insert({ hw_uid, model: model ?? null, sentinel_id: claim.sentinel_id })
        .select("id")
        .single();
      if (e2) return new Response(e2.message, { status: 500, headers: corsHeaders });
      device_id = ins.id;
    } else {
      const { error: e3 } = await svc
        .from("devices")
        .update({ sentinel_id: claim.sentinel_id })
        .eq("id", device_id);
      if (e3) return new Response(e3.message, { status: 500, headers: corsHeaders });
    }

    await svc.from("device_claims").update({ used_at: new Date().toISOString() }).eq("code", code);

    return new Response(JSON.stringify({ ok: true, device_id }), {
      headers: { "content-type": "application/json", ...corsHeaders },
      status: 200,
    });
  } catch (e: any) {
    return new Response(e?.message ?? "error", { status: 500, headers: corsHeaders });
  }
});
