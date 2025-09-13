// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---- CORS ----
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  // add apikey (and x-client-info which supabase adds)
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, x-device-secret, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};


// ---- Env (new names with fallbacks) ----
const SUPA_URL = Deno.env.get("SB_URL") ?? Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE = Deno.env.get("SB_SERVICE_ROLE") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

function randCode(len = 8) {
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += alpha[Math.floor(Math.random() * alpha.length)];
  return s;
}

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

    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!jwt) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

    const { sentinel_id, hw_uid } = await req.json();
    if (!sentinel_id) return new Response("sentinel_id required", { status: 400, headers: corsHeaders });

    // Use service key but pass end-user JWT so PostgREST enforces the user's RLS context
    const supabase = createClient(SUPA_URL, SERVICE_ROLE, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const ttl = parseInt(Deno.env.get("PAIRING_CODE_TTL_SECONDS") ?? "600", 10);
    const expires_at = new Date(Date.now() + ttl * 1000).toISOString();
    const code = randCode(8);

    const { error } = await supabase.from("device_claims").insert({
      code,
      hw_uid: hw_uid ?? null,
      sentinel_id,
      expires_at,
    });
    if (error) {
      return new Response(error.message, { status: 403, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ code, expires_at }), {
      status: 200,
      headers: { "content-type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    return new Response(e?.message ?? "error", { status: 500, headers: corsHeaders });
  }
});
