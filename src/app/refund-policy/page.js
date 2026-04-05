'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

async function fetchLegal(slug) {
  const { data } = await api.get(`/legal/${slug}`);
  return data?.data?.page || data?.data;
}

export default function RefundPolicyPage() {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await fetchLegal('refund-policy');
        if (!mounted) return;
        setPage(p);
      } catch (err) {
        if (!mounted) return;
        setError(err.response?.data?.message || 'Unable to load refund policy.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <div className="section-tag">Legal</div>
          <h1 className="section-title">{page?.title || 'Refund Policy'}</h1>
        </div>
      </div>

      {loading && <div className="card"><p>Loading…</p></div>}
      {error && !loading && (
        <div className="card">
          <p style={{ color: '#f44336' }}>{error}</p>
        </div>
      )}
      {page && !loading && !error && (
        <article className="card" style={{ lineHeight: 1.7 }}>
          <div
            dangerouslySetInnerHTML={{ __html: page.content || '' }}
          />
        </article>
      )}
    </div>
  );
}

