'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { formatPrice, getDiscountPercent } from '@/lib/utils';
import useCartStore from '@/store/cartStore';
import useWishlistStore from '@/store/wishlistStore';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const { addToCart } = useCartStore();
  const { toggle, isWishlisted } = useWishlistStore();
  const { requireAuth } = useAuthStore();
  const wishlisted = isWishlisted(product._id);
  const discount = getDiscountPercent(product.basePrice, product.discountPrice);
  const price = product.discountPrice || product.basePrice;

  // stock: null/undefined means "unlimited" (legacy), 0 or less means out of stock
  const isOutOfStock = product.stock !== undefined && product.stock !== null && product.stock <= 0;

  const handleCart = async (e) => {
    e.preventDefault();
    if (isOutOfStock) return;
    if (requireAuth && typeof requireAuth === 'function') {
      const ok = requireAuth();
      if (!ok) return;
    }
    const result = await addToCart(product._id);
    if (result === true) {
      toast.success('Added to cart!');
      document.dispatchEvent(new CustomEvent('toggleCart'));
    } else if (result && result !== false) {
      toast.error(result);
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    await toggle(product._id);
    toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist! ❤️');
  };

  return (
    <article className="product-card">
      <Link href={`/products/${product.slug}`} className="product-card-img">
        {product.thumbnailImage ? (
          <Image
            src={product.thumbnailImage}
            alt={product.name}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 25vw"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              background: 'var(--bg-elevated)',
            }}
          >
            🎁
          </div>
        )}
        {isOutOfStock ? (
          <span style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }} className="badge badge-danger">
            Out of Stock
          </span>
        ) : discount > 0 ? (
          <span style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }} className="badge badge-success">
            {discount}% OFF
          </span>
        ) : product.isFeatured ? (
          <span style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }} className="badge badge-primary">
            Featured
          </span>
        ) : null}
      </Link>

      <div className="product-card-actions">
        <button
          className={`action-btn${wishlisted ? ' wishlisted' : ''}`}
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={15} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
        <button
          className="action-btn"
          onClick={handleCart}
          aria-label="Add to cart"
          disabled={isOutOfStock}
          title={isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          style={isOutOfStock ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
        >
          <ShoppingCart size={15} />
        </button>
      </div>

      <div className="product-card-body">
        <Link href={`/products/${product.slug}`}>
          <h3 className="product-card-name">{product.name}</h3>
        </Link>

        {product.rating?.count > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
            <Star size={12} fill="var(--accent)" color="var(--accent)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {product.rating.average.toFixed(1)} ({product.rating.count})
            </span>
          </div>
        )}

        <div className="product-card-price">
          <span className="price-current" style={isOutOfStock ? { color: 'var(--text-muted)' } : {}}>
            {formatPrice(price)}
          </span>
          {discount > 0 && !isOutOfStock && (
            <>
              <span className="price-original">{formatPrice(product.basePrice)}</span>
              <span className="price-discount">{discount}% off</span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
