'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';
import ProductCardSkeleton from '@/components/products/ProductCardSkeleton';

export default function CategoryDetailPage() {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let mounted = true;
    (async () => {
      try {
        const { data: catRes } = await api.get(`/categories/slug/${slug}`);
        const cat = catRes?.data?.category || catRes?.data;
        if (!mounted) return;
        setCategory(cat);
        if (cat?._id) {
          const { data: pRes } = await api.get(`/products/by-category/${cat._id}`);
          setProducts(pRes?.data?.products || pRes?.data || []);
        }
      } catch {
        if (mounted) {
          setCategory(null);
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
          <div className="section-tag">Category</div>
          <h1 className="section-title">{category?.name || 'Category'}</h1>
          {category?.description && (
            <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>
              {category.description}
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
                <p className="empty-desc">Please try other categories.</p>
              </div>
            )
        }
      </div>
    </div>
  );
}

