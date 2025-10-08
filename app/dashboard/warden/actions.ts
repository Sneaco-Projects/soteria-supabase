'use server';

import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function createPairingCode(sentinelId: string, hw_uid?: string) {
  // Cast to any to allow set/remove in Server Actions (runtime is fine)
  const cookieStore = cookies() as any;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value as string | undefined;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session }, error: sErr } = await supabase.auth.getSession();
  if (sErr) throw new Error(`Auth error: ${sErr.message}`);
  if (!session) throw new Error('Not signed in');

  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ sentinel_id: sentinelId, hw_uid }),
    cache: 'no-store',
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`(${res.status}) ${text}`);
  return JSON.parse(text) as { code: string; expires_at: string };
}
