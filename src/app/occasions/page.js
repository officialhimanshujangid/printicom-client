'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';

export default function OccasionsPage() {
  const [occasions, setOccasions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/related-to');
        if (!mounted) return;
        setOccasions(data?.data?.relatedTos || []);
      } catch {
        if (mounted) setOccasions([]);
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
          <div className="section-tag">Occasions</div>
          <h1 className="section-title">Shop by Occasion</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>
            Birthday, anniversary, festivals and more – pick an occasion to see curated products.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="products-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card skeleton" style={{ height: 180 }} />
          ))}
        </div>
      ) : occasions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ fontSize: '2.5rem' }}>🎁</div>
          <h3 className="empty-title">No occasions available</h3>
          <p className="empty-desc">Please check back later.</p>
        </div>
      ) : (
        <div className="occasions-grid">
          {occasions.map((occ) => (
            <Link
              key={occ._id}
              href={`/occasions/${occ.slug}`}
              className="occasion-card"
            >
              {occ.coverImage ? (
                <Image
                  src={occ.coverImage}
                  alt={occ.name}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-surface))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '3rem',
                  }}
                >
                  {occ.icon || '🎉'}
                </div>
              )}
              <div className="occasion-card-overlay">
                {occ.icon && <div className="occasion-card-icon">{occ.icon}</div>}
                <div className="occasion-card-name">{occ.name}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

