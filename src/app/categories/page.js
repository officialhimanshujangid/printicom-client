'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/categories');
        if (!mounted) return;
        setCategories(data?.data || []);
      } catch {
        if (mounted) setCategories([]);
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
          <div className="section-tag">Browse</div>
          <h1 className="section-title">All Categories</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>
            Choose a category to explore personalised products.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="products-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card skeleton" style={{ height: 160 }} />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ fontSize: '2.5rem' }}>📂</div>
          <h3 className="empty-title">No categories found</h3>
          <p className="empty-desc">Please check back later.</p>
        </div>
      ) : (
        <div className="categories-grid">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              href={`/categories/${cat.slug}`}
              className="category-card"
            >
              <div className="category-card-thumb">
                {cat.image ? (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2.4rem',
                    }}
                  >
                    {cat.icon || '🏷'}
                  </div>
                )}
              </div>
              <div className="category-card-body">
                <h2 className="category-card-title">{cat.name}</h2>
                {cat.description && (
                  <p className="category-card-desc">
                    {cat.description.slice(0, 80)}
                    {cat.description.length > 80 ? '…' : ''}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

