'use server';

import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function createPairingCode(sentinelId: string) {
  const cookieStore = cookies() as any; // cast to allow set/remove in Server Actions

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => cookieStore.set({ name, value, ...options }),
        remove: (name: string, options: CookieOptions) => cookieStore.set({ name, value: '', ...options }),
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not signed in');

  const { data, error } = await supabase.functions.invoke('create-claim', {
    body: { sentinel_id: sentinelId },
  });
  if (error) {
    const resp = (error as any).context?.response;
    const body = resp ? await resp.text() : error.message;
    throw new Error(`(${resp?.status ?? 'ERR'}) ${body}`);
  }
  return data as { code: string; expires_at: string };
}
