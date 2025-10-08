'use client';

import { supabase } from '@/lib/supabase-browser';

type ClaimResponse = { code: string; expires_at: string };

export async function createPairingCode(sentinel_id: string, hw_uid?: string) {
  const { data, error } = await supabase.functions.invoke<ClaimResponse>('create-claim', {
    body: { sentinel_id, hw_uid: hw_uid ?? null },
  });
  if (error) {
    // TEMP: surface status/body in console if it fails
    const status = error?.context?.response?.status;
    const body = error?.context?.response?.text;
    console.error('create-claim failed', { status, body, message: error.message });
    throw new Error(body ?? error.message);
  }
  return data!;
}
