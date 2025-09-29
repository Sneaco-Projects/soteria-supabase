import React from 'react';
import { Bell, ShieldAlert, MessageSquareText, Info } from 'lucide-react';
import type { EventRow } from '@/data/queries';

export function EventBadge({ e }: { e: EventRow }) {
  let Icon = Info;
  let color = 'text-zinc-600 bg-zinc-100';
  switch (e.event_type) {
    case 'BTN_SHORT':
      Icon = Bell; color = 'text-amber-700 bg-amber-100';
      break;
    case 'SOS':
      Icon = ShieldAlert; color = 'text-red-700 bg-red-100';
      break;
    case 'IN_SMS':
      Icon = MessageSquareText; color = 'text-sky-700 bg-sky-100';
      break;
    case 'PAIR_OK':
      Icon = Info; color = 'text-emerald-700 bg-emerald-100';
      break;
    case 'PAIR_FAIL':
    case 'UNPAIR_DENY':
      Icon = Info; color = 'text-rose-700 bg-rose-100';
      break;
    case 'UNPAIR_OK':
    case 'OTW':
    case 'AGPS_BOOST':
    case 'AGPS_STOP':
    case 'HEALTH':
      Icon = Info; color = 'text-zinc-700 bg-zinc-100';
      break;
    default:
      Icon = Info; color = 'text-zinc-700 bg-zinc-100';
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${color}`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="font-medium">{e.event_type}</span>
    </span>
  );
}
