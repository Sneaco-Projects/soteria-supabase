import type { EventRow } from '@/data/queries';

export type LogCategory = 'All' | 'Button' | 'SOS' | 'SMS' | 'System';

export function categorize(e: EventRow): LogCategory {
  switch (e.event_type) {
    case 'BTN_SHORT':
      return 'Button';
    case 'SOS':
      return 'SOS';
    case 'IN_SMS':
      return 'SMS';
    case 'PAIR_OK':
    case 'PAIR_FAIL':
    case 'UNPAIR_OK':
    case 'UNPAIR_DENY':
    case 'OTW':
    case 'AGPS_BOOST':
    case 'AGPS_STOP':
    case 'HEALTH':
      return 'System';
    default:
      return 'All';
  }
}

export function labelFor(e: EventRow): string {
  switch (e.event_type) {
    case 'PAIR_OK':   return 'Paired successfully';
    case 'PAIR_FAIL': return 'Pair failed';
    case 'UNPAIR_OK': return 'Unpaired by guardian';
    case 'UNPAIR_DENY': return 'Unpair denied';
    case 'BTN_SHORT': return 'Button pressed (short)';
    case 'SOS':       return 'SOS sent';
    case 'OTW':       return 'On the way';
    case 'IN_SMS': {
      const msg = e.payload?.message ? `: “${String(e.payload.message)}”` : '';
      return `Incoming SMS${msg}`;
    }
    case 'AGPS_BOOST': return 'A-GPS boosting…';
    case 'AGPS_STOP':  return 'A-GPS detached';
    case 'HEALTH':     return `Health ${e.payload?.message ?? ''}`.trim();
    default:           return e.event_type;
  }
}

export function extractLatLng(e: EventRow): { lat?: number; lng?: number } {
  const lat = Number(e.payload?.lat);
  const lng = Number(e.payload?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  return {};
}
