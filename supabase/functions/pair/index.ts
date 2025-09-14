// supabase/functions/pair/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const got = (req.headers.get("x-device-secret") ?? "").trim();
  const exp = (Deno.env.get("DEVICE_INGEST_SECRET") ?? "").trim();
  if (!got || !exp || got !== exp) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { code, hw_uid, model } = await req.json().catch(() => ({}));
  if (!hw_uid) return new Response("Missing hw_uid", { status: 400 });

  // (Optional) verify 'code' belongs to a user. For now we’ll skip and pair anonymously.
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // server-side only
  );

  // Upsert device & issue a token
  const device_token = crypto.randomUUID() + crypto.randomUUID();
  const { data, error } = await supabase
    .from("devices")
    .upsert({ hw_uid, model, device_token })
    .select("id, device_token")
    .single();

  if (error) return new Response(error.message, { status: 500 });

  return Response.json({
    device_id: data.id,
    device_token: data.device_token, // <-- Arduino stores this
  });
});
