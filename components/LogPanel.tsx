import React, { useMemo, useState } from 'react';
import type { EventRow } from '@/data/queries';
import { categorize, labelFor, extractLatLng, type LogCategory } from './logs/event-helpers';
import { EventBadge } from './logs/EventBadge';
import { MapPin } from 'lucide-react';

export function LogPanel({ events }: { events: EventRow[] }) {
  const [filter, setFilter] = useState<LogCategory>('All');

  const filtered = useMemo(() => {
    if (filter === 'All') return events;
    return events.filter(e => categorize(e) === filter);
  }, [events, filter]);

  if (!events || events.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl border bg-white p-8 text-center">
        <div className="mb-3 text-6xl">🛰️</div>
        <div className="text-lg font-semibold">No events yet</div>
        <div className="mt-1 text-sm text-zinc-600">
          Events from your device will appear here in realtime.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-4">
      {/* Filter tabs */}
      <div className="mb-3">
        {/** lazy import to avoid circular; inline for simplicity */}
        {/* @ts-ignore */}
        <FilterTabsLazy value={filter} onChange={setFilter} />
      </div>

      <ul className="space-y-2">
        {filtered.map(e => {
          const label = labelFor(e);
          const { lat, lng } = extractLatLng(e);
          const hasLoc = lat !== undefined && lng !== undefined;

          return (
            <li key={e.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <EventBadge e={e} />
                    <div className="truncate text-sm">{label}</div>
                  </div>

                  {hasLoc && (
                    <div className="mt-1">
                      <a
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-zinc-700 hover:bg-zinc-50"
                        href={`https://maps.google.com/maps?q=${lat},${lng}`}
                        target="_blank"
                        rel="noreferrer"
                        title={`${lat?.toFixed(6)}, ${lng?.toFixed(6)}`}
                      >
                        <MapPin className="h-3.5 w-3.5" />
                        Open in Maps
                      </a>
                    </div>
                  )}
                </div>

                <div className="shrink-0 text-xs text-zinc-500">
                  {new Date(e.created_at).toLocaleTimeString()}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Inline lazy wrapper to avoid import ordering hassles:
function FilterTabsLazy({
  value, onChange,
}: {
  value: LogCategory;
  onChange: (v: LogCategory) => void;
}) {
  const tabs: LogCategory[] = ['All', 'Button', 'SOS', 'SMS', 'System'];
  return (
    <div className="flex gap-2 border-b pb-2">
      {tabs.map(t => {
        const active = t === value;
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={`rounded-md px-2.5 py-1 text-sm ${
              active ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}
