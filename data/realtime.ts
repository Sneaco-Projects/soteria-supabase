// data/realtime.ts
import { supabase } from '@/lib/supabase-client';
import type { DeviceRow, EventRow } from '@/data/queries';
import { toast } from 'sonner'; // swap to your toast

export type Handlers = {
  onEventInsert: (e: EventRow) => void;
  onDeviceUpdate: (d: Partial<DeviceRow> & { id: string }) => void;
};

function inFilter(list: string[]) {
  // Realtime expects IN like: in.(uuid1,uuid2)
  // If empty, return a filter that matches nothing.
  return list.length ? `in.(${list.join(',')})` : 'in.(00000000-0000-0000-0000-000000000000)';
}

export function subscribeRealtime(sentinelIds: string[], handlers: Handlers) {
  if (sentinelIds.length === 0) return { unsubscribe: () => {} };

  const IN = inFilter(sentinelIds);
  const channel = supabase.channel('warden-realtime');

  // 1) New events → logs + toast on PAIR_OK
  channel.on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'device_events', filter: `sentinel_id=${IN}` },
    (payload) => {
      const e = payload.new as EventRow;
      // UI already filters out GPS_SEARCH by view; if you ever subscribe to raw table elsewhere, guard here:
      // if ((e as any).event_type === 'GPS_SEARCH') return;
      handlers.onEventInsert(e);
      if (e.event_type === 'PAIR_OK') toast.success('Paired successfully');
    }
  );

  // 2) Device updates → green dot refresh
  channel.on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'devices', filter: `sentinel_id=${IN}` },
    (payload) => {
      const d = payload.new as any;
      handlers.onDeviceUpdate({
        id: d.id,
        last_seen_at: d.last_seen_at,
        sentinel_id: d.sentinel_id,
        is_paired: d.sentinel_id !== null,
        recently_active: !!d.last_seen_at && (Date.now() - Date.parse(d.last_seen_at)) < 5*60*1000,
      });
    }
  );

  channel.subscribe();

  return {
    unsubscribe: () => supabase.removeChannel(channel),
  };
}
