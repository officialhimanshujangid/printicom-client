'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import useWishlistStore from '@/store/wishlistStore';
import ProductCard from '@/components/products/ProductCard';
import ProductCardSkeleton from '@/components/products/ProductCardSkeleton';

export default function WishlistPage() {
  const { isAuthenticated, openAuthModal } = useAuthStore();
  const items = useWishlistStore(s => s.items);
  const fetchWishlist = useWishlistStore(s => s.fetchWishlist);
  const [loading, setLoading] = useState(!items.length);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    (async () => {
      // Small guard to avoid redundant fetches if already loading
      try {
        await fetchWishlist();
      } finally {
        setLoading(false);
      }
    })();
    // remove fetchWishlist from deps if you want total stability, but selectors give stability
  }, [isAuthenticated, fetchWishlist]);

  if (!isAuthenticated) {
    return (
      <div className="container section">
        <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
          <h1 className="section-title" style={{ fontSize: '1.3rem', marginBottom: 10 }}>My Wishlist</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
            Sign in to view and manage your wishlist.
          </p>
          <button className="btn btn-primary" onClick={() => openAuthModal('login')}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Proper normalization based on the actual API structure (nested 'product' object)
  const normalized = (items || []).map((item) => {
    if (item.productSnapshot) return item.productSnapshot;
    if (item.product) return item.product;
    return item;
  });

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <div className="section-tag">Account</div>
          <h1 className="section-title">My Wishlist</h1>
        </div>
      </div>

      <div className="products-grid">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : normalized.length > 0
            ? normalized.map((p) => <ProductCard key={p._id} product={p} />)
            : (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                <h3 className="empty-title">Your wishlist is empty</h3>
                <p className="empty-desc">Browse products and tap the heart icon to add them.</p>
                <Link href="/products" className="btn btn-primary">Browse Products</Link>
              </div>
            )
        }
      </div>
    </div>
  );
}

