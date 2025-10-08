'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function GenerateCodeButton({ sentinelId }: { sentinelId: string }) {
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<{ code: string; expires_at: string } | null>(null);

  const go = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not signed in');

      // invoke sends apikey + Authorization automatically from the current session
      const { data, error } = await supabase.functions.invoke('create-claim', {
        body: { sentinel_id: sentinelId },  // add hw_uid if you want to lock
      });

      if (error) {
        // show exact status/body if non-2xx
        const resp = (error as any).context?.response;
        const body = resp ? await resp.text() : error.message;
        throw new Error(`(${resp?.status ?? 'ERR'}) ${body}`);
      }

      setRes(data as { code: string; expires_at: string });
    } catch (e: any) {
      alert(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={go} disabled={loading}>
        {loading ? 'Generating…' : 'Generate Code'}
      </button>
      {res && (
        <div style={{ marginTop: 8 }}>
          <div>Code: <b>{res.code}</b></div>
          <div>Expires: {new Date(res.expires_at).toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}
