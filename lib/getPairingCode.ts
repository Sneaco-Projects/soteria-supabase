// lib/getPairingCode.ts
import { supabaseBrowser } from '@/lib/supabase-browser';

export async function getPairingCode(sentinel_id: string, hw_uid?: string) {
  const { data: { session } } = await supabaseBrowser.auth.getSession();
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      'Authorization': `Bearer ${session?.access_token ?? ''}`,
    },
    body: JSON.stringify({ sentinel_id, hw_uid }),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json() as { code: string; expires_at: string };
}
