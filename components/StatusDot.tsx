import React from 'react';

export function StatusDot({ green }: { green: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${
        green ? 'bg-emerald-500' : 'bg-zinc-400'
      }`}
      aria-label={green ? 'online' : 'offline'}
      title={green ? 'Online (paired & active)' : 'Offline / Unpaired'}
    />
  );
}
