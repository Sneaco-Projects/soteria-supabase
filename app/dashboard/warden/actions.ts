'use client';

import { supabase } from '@/lib/supabase-browser';

export async function createPairingCode(sentinel_id: string, hw_uid?: string) {
  const { data, error } = await supabase.functions.invoke('create-claim', {
    body: { sentinel_id, hw_uid: hw_uid ?? null },
  });
  if (error) throw new Error(error.message);
  return data as { code: string; expires_at: string };
}
