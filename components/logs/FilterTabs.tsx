import React from 'react';
import type { LogCategory } from './event-helpers';

const tabs: LogCategory[] = ['All', 'Button', 'SOS', 'SMS', 'System'];

export function FilterTabs({
  value, onChange,
}: {
  value: LogCategory;
  onChange: (v: LogCategory) => void;
}) {
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
