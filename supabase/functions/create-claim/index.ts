// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function randCode(len = 8) {
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += alpha[Math.floor(Math.random() * alpha.length)];
  return s;
}

serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!jwt) return new Response("Unauthorized", { status: 401 });

    const { sentinel_id, hw_uid } = await req.json();
    if (!sentinel_id) return new Response("sentinel_id required", { status: 400 });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } } // end-user context for RLS
    );

    const ttl = parseInt(Deno.env.get("PAIRING_CODE_TTL_SECONDS") ?? "600", 10);
    const expires_at = new Date(Date.now() + ttl * 1000).toISOString();
    const code = randCode(8);

    // RLS ensures only a warden/admin for that sentinel can insert
    const { error } = await supabase.from("device_claims").insert({
      code,
      hw_uid: hw_uid ?? null,
      sentinel_id,
      expires_at,
    });
    if (error) return new Response(error.message, { status: 403 });

    return new Response(JSON.stringify({ code, expires_at }), {
      headers: { "content-type": "application/json" },
      status: 200,
    });
  } catch (e: any) {
    return new Response(e?.message ?? "error", { status: 500 });
  }
});
