// data/scope.ts
import { supabase } from '@/lib/supabase-client';

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('No authenticated user');
  return data.user.id;
}

export async function getGuardianSentinelIds(): Promise<string[]> {
  const uid = await currentUserId();
  const { data, error } = await supabase
    .from('sentinels')
    .select('id')
    .eq('owner_guardian_id', uid);
  if (error) throw error;
  return (data ?? []).map(r => r.id);
}

export async function getProviderSentinelIds(): Promise<string[]> {
  const uid = await currentUserId();
  const { data, error } = await supabase
    .from('provider_assignments')
    .select('sentinel_id')
    .eq('provider_id', uid);
  if (error) throw error;
  return (data ?? []).map(r => r.sentinel_id);
}
