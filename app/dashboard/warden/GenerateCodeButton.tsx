'use client';
import { useState } from 'react';
import { createPairingCode } from './actions';

export default function GenerateCodeButton({ sentinelId }: { sentinelId: string }) {
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<{ code: string; expires_at: string } | null>(null);

  const go = async () => {
    try {
      setLoading(true);
      const data = await createPairingCode(sentinelId);
      setRes(data);
    } catch (e:any) {
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
        <div style={{marginTop: 8}}>
          <div>Code: <b>{res.code}</b></div>
          <div>Expires: {new Date(res.expires_at).toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}
