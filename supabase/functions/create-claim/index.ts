// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, x-device-secret, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const SUPA_URL   = Deno.env.get("SB_URL") ?? Deno.env.get("SUPABASE_URL");
const SERVICE    = Deno.env.get("SB_SERVICE_ROLE") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

function randCode(len = 8) {
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += alpha[Math.floor(Math.random() * alpha.length)];
  return s;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    if (!SUPA_URL || !SERVICE) return new Response("Server misconfigured: missing SB_URL or SB_SERVICE_ROLE", { status: 500, headers: corsHeaders });

    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!jwt) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const { sentinel_id, hw_uid } = await req.json().catch(() => ({}));
    if (!sentinel_id) return new Response("sentinel_id required", { status: 400, headers: corsHeaders });

    // Service key + forward user JWT so RLS evaluates as that user
    const supabase = createClient(SUPA_URL, SERVICE, {
      global: { headers: { Authorization: `Bearer ${jwt}` } }
    });

    // 1) Housekeep expired claims
    await supabase
      .from("device_claims")
      .delete()
      .lt("expires_at", new Date().toISOString());

    // 2) Try returning an existing unused claim for this user’s sentinel (or same hw_uid if provided)
    const nowIso = new Date().toISOString();

    // Prefer a claim scoped to same hw_uid if provided, otherwise any unused claim for the sentinel
    let { data: existing, error: exErr } = await supabase
      .from("device_claims")
      .select("code, expires_at, hw_uid")
      .eq("sentinel_id", sentinel_id)
      .is("used_at", null)
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(1);

    if (exErr) {
      // RLS or query error still bubbles as 403/500
      return new Response(exErr.message, { status: 403, headers: corsHeaders });
    }

    if (existing && existing.length) {
      // If caller provided hw_uid and existing claim has a different bound uid, ignore it; otherwise reuse
      const found = existing[0];
      if (!hw_uid || !found.hw_uid || found.hw_uid === hw_uid) {
        return new Response(JSON.stringify({ code: found.code, expires_at: found.expires_at }), {
          status: 200,
          headers: { "content-type": "application/json", ...corsHeaders }
        });
      }
    }

    // 3) Create new claim
    const ttl = parseInt(Deno.env.get("PAIRING_CODE_TTL_SECONDS") ?? "600", 10);
    const expires_at = new Date(Date.now() + ttl * 1000).toISOString();
    const code = randCode(8);

    const { error: insErr } = await supabase.from("device_claims").insert({
      code,
      hw_uid: hw_uid ?? null,
      sentinel_id,
      expires_at
    });

    if (insErr) {
      // If another parallel request won the race, re-select and return it
      if ((insErr.message || "").includes("duplicate key")) {
        const { data: again, error: againErr } = await supabase
          .from("device_claims")
          .select("code, expires_at")
          .eq("sentinel_id", sentinel_id)
          .is("used_at", null)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1);
        if (!againErr && again && again.length) {
          return new Response(JSON.stringify(again[0]), {
            status: 200,
            headers: { "content-type": "application/json", ...corsHeaders }
          });
        }
      }
      return new Response(insErr.message, { status: 403, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ code, expires_at }), {
      status: 200,
      headers: { "content-type": "application/json", ...corsHeaders }
    });

  } catch (e: any) {
    return new Response(e?.message ?? "error", { status: 500, headers: corsHeaders });
  }
});
