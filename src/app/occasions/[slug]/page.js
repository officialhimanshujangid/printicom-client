'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';
import ProductCardSkeleton from '@/components/products/ProductCardSkeleton';

export default function OccasionDetailPage() {
  const { slug } = useParams();
  const [occasion, setOccasion] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let mounted = true;
    (async () => {
      try {
        const { data: occRes } = await api.get(`/related-to/slug/${slug}`);
        const occ = occRes?.data?.relatedTo || occRes?.data;
        if (!mounted) return;
        setOccasion(occ);
        if (occ?._id) {
          const { data: pRes } = await api.get(`/related-to/products/${occ._id}`);
          setProducts(pRes?.data?.products || pRes?.data || []);
        }
      } catch {
        if (mounted) {
          setOccasion(null);
          setProducts([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [slug]);

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <div className="section-tag">Occasion</div>
          <h1 className="section-title">{occasion?.name || 'Occasion'}</h1>
          {occasion?.description && (
            <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>
              {occasion.description}
            </p>
          )}
        </div>
      </div>

      <div className="products-grid">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.length > 0
            ? products.map((p) => <ProductCard key={p._id} product={p} />)
            : (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                <h3 className="empty-title">No products found</h3>
                <p className="empty-desc">Please explore other occasions.</p>
              </div>
            )
        }
      </div>
    </div>
  );
}

