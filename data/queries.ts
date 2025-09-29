// data/queries.ts
import { supabase } from '@/lib/supabase-client';

export type DeviceRow = {
  id: string;
  hw_uid: string;
  model: string | null;
  sentinel_id: string | null;
  sentinel_name?: string | null;
  last_seen_at: string | null;
  is_paired: boolean;
  recently_active: boolean;
};

export type EventRow = {
  id: number;
  device_id: string;
  sentinel_id: string | null;
  event_type:
    | 'PAIR_OK' | 'PAIR_FAIL' | 'UNPAIR_OK' | 'UNPAIR_DENY'
    | 'BTN_SHORT' | 'SOS' | 'OTW' | 'IN_SMS'
    | 'AGPS_BOOST' | 'AGPS_STOP' | 'HEALTH';
  payload: Record<string, any>;
  created_at: string;
};

export async function fetchDevicesForSentinels(sentinelIds: string[]): Promise<DeviceRow[]> {
  if (sentinelIds.length === 0) return [];
  // Use a small SQL function to keep the client clean
  const { data, error } = await supabase.rpc('devices_for_sentinels', {
    p_sentinel_ids: sentinelIds
  });
  if (error) throw error;
  return (data ?? []) as DeviceRow[];
}



export async function fetchLatestEvents(deviceId: string, limit = 200): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from('v_device_event_feed')
    .select('*')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as EventRow[];
}
