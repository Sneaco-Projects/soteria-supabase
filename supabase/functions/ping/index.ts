import { serve } from "https://deno.land/std/http/server.ts";
serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    }
  });
  const ok = !!(Deno.env.get("SB_URL") || Deno.env.get("SUPABASE_URL"));
  const ok2 = !!(Deno.env.get("SB_SERVICE_ROLE") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  return new Response(JSON.stringify({ env_url: ok, env_service_role: ok2 }), {
    status: 200,
    headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
});
