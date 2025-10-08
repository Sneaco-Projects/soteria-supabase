import { supabase } from '@/lib/supabase-browser';

export async function debugCreateClaim(sentinel_id: string, hw_uid?: string) {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      // IMPORTANT: forward the user JWT so RLS runs as that user
      'Authorization': `Bearer ${session?.access_token ?? ''}`,
    },
    body: JSON.stringify({ sentinel_id, hw_uid }),
  });

  const txt = await res.text();
  return { ok: res.ok, status: res.status, text: txt };
}
