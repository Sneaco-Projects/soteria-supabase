// hooks/useWardenData.ts
import { useEffect, useMemo, useRef, useState } from 'react';
import { getGuardianSentinelIds, getProviderSentinelIds } from '@/data/scope';
import { fetchDevicesForSentinels, fetchLatestEvents, type DeviceRow, type EventRow } from '@/data/queries';
import { subscribeRealtime } from '@/data/realtime';

type Role = 'guardian' | 'provider';

export function useWardenData(role: Role) {
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<Map<string, DeviceRow>>(new Map());
  const logsRef = useRef<Map<string, EventRow[]>>(new Map());
  const [, force] = useState(0);
  const bump = () => force(v => v + 1);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);

      const sentinelIds =
        role === 'guardian'
          ? await getGuardianSentinelIds()
          : await getProviderSentinelIds();

      const ds = await fetchDevicesForSentinels(sentinelIds);
      if (!alive) return;

      const map = new Map<string, DeviceRow>();
      ds.forEach(d => map.set(d.id, d));
      setDevices(map);

      // initial logs (optional: lazy load only for selected)
      for (const d of ds) {
        const evs = await fetchLatestEvents(d.id, 200);
        if (!alive) return;
        logsRef.current.set(d.id, evs);
      }
      bump();
      setLoading(false);

      // realtime
      const sub = subscribeRealtime(sentinelIds, {
        onEventInsert: (e) => {
          const arr = logsRef.current.get(e.device_id) ?? [];
          logsRef.current.set(e.device_id, [e, ...arr]);
          bump();
        },
        onDeviceUpdate: (patch) => {
          setDevices(prev => {
            const next = new Map(prev);
            const ex = next.get(patch.id);
            if (ex) next.set(patch.id, { ...ex, ...patch });
            return next;
          });
        }
      });

      return () => sub.unsubscribe();
    })();

    return () => { alive = false; };
  }, [role]);

  const deviceList = useMemo(() => Array.from(devices.values()), [devices]);
  const getLogs = (deviceId: string) => logsRef.current.get(deviceId) ?? [];

  return { loading, deviceList, getLogs };
}
