'use client';

import { useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';

type Props = {
  sentinelId: string;
  expectedCode: string;
  onPaired: (info: { deviceId: number }) => void;
};

export default function PairWatcher({ sentinelId, expectedCode, onPaired }: Props) {
  useEffect(() => {
    if (!sentinelId || !expectedCode) return;

    const channel = supabaseBrowser
      .channel('pairing-watch')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'device_events',
          filter: `sentinel_id=eq.${sentinelId}`,
        },
        (payload: any) => {
          const row = payload.new;
          if (row?.event_type === 'PAIR_OK' && row?.payload?.code === expectedCode) {
            onPaired({ deviceId: row.device_id });
          }
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [sentinelId, expectedCode, onPaired]);

  return null;
}
