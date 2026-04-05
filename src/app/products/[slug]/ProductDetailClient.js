'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star,
  Heart,
  ShoppingCart,
  Minus,
  Plus,
  Truck,
  Package,
  ShieldCheck,
  MessageSquare,
  ChevronRight,
  Loader2,
  BadgeCheck,
  Settings2,
} from 'lucide-react';
import useCartStore from '@/store/cartStore';
import useWishlistStore from '@/store/wishlistStore';
import useAuthStore from '@/store/authStore';
import { formatPrice, getDiscountPercent } from '@/lib/utils';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import ProductCard from '@/components/products/ProductCard';
import CustomizationModal from '@/components/products/CustomizationModal';

function StarRow({ value, size = 14 }) {
  return (
    <div className="stars" style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          fill={n <= value ? 'var(--accent)' : 'transparent'}
          color="var(--accent)"
          style={{ opacity: n <= value ? 1 : 0.25 }}
        />
      ))}
    </div>
  );
}

export default function ProductDetailClient({ product }) {
  const { addToCart } = useCartStore();
  const { toggle, isWishlisted, fetchWishlist } = useWishlistStore();
  const { isAuthenticated, openAuthModal, requireAuth } = useAuthStore();

  const [activeIndex, setActiveIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPagination, setReviewPagination] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [customizationOpen, setCustomizationOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    quantityEstimate: '',
    message: '',
  });

  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const images = useMemo(() => {
    const arr = [];
    if (product.thumbnailImage) arr.push(product.thumbnailImage);
    if (Array.isArray(product.images)) {
      for (const img of product.images) {
        if (img && img !== product.thumbnailImage) arr.push(img);
      }
    }
    return arr.length ? arr : [null];
  }, [product.thumbnailImage, product.images]);

  const wishlisted = isWishlisted(product._id);
  const discount = getDiscountPercent(product.basePrice, product.discountPrice);
  const unitPrice = product.discountPrice || product.basePrice;
  const outOfStock = product.stock !== undefined && product.stock !== null && product.stock <= 0;
  const minQty = product.minOrderQuantity || 1;
  const maxQty = product.maxOrderQuantity || 99;
  const pricingTiers = Array.isArray(product.pricingTiers) ? product.pricingTiers : [];
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const customizationOptions = Array.isArray(product.customizationOptions)
    ? product.customizationOptions
    : [];

  const loadReviews = useCallback(
    async (page = 1, append = false) => {
      if (!product._id) return;
      setReviewsLoading(true);
      try {
        const { data } = await api.get(`/reviews/product/${product._id}`, {
          params: { page, limit: 6, sortBy: 'createdAt', order: 'desc' },
        });
        const list = Array.isArray(data?.data) ? data.data : [];
        setReviews((prev) => (append ? [...prev, ...list] : list));
        setReviewPagination(data?.pagination || null);
        setReviewPage(page);
      } catch {
        if (!append) setReviews([]);
        setReviewPagination(null);
      } finally {
        setReviewsLoading(false);
      }
    },
    [product._id]
  );

  useEffect(() => {
    loadReviews(1, false);
  }, [loadReviews]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/products/${product._id}/recommendations`);
        const prods = data?.data?.products || [];
        if (!cancelled) setRecommendations(prods);
      } catch {
        if (!cancelled) setRecommendations([]);
      }
    })();
    return () => { cancelled = true; };
  }, [product._id]);

  useEffect(() => {
    if (isAuthenticated) fetchWishlist();
  }, [isAuthenticated, fetchWishlist]);

  const handleCart = async (customization = null) => {
    if (outOfStock) {
      toast.error('This product is currently out of stock.');
      return;
    }
    // If product is customizable, open customization modal first
    if (product.isCustomizable && product.customizationOptions?.length > 0 && !customization) {
      if (!requireAuth()) return;
      setCustomizationOpen(true);
      return;
    }
    const result = await addToCart(product._id, qty, null, customization || {});
    if (result === true) {
      toast.success(
        product.isCustomizable ? '✏️ Personalised item added to cart!' : 'Added to cart!'
      );
      setCustomizationOpen(false);
      document.dispatchEvent(new CustomEvent('toggleCart'));
    } else if (result && result !== false) {
      toast.error(result);
    }
  };

  const handleWishlist = async () => {
    if (!requireAuth()) return;
    await toggle(product._id);
    toast.success(wishlisted ? 'Removed from wishlist' : 'Saved to wishlist');
  };

  const submitBulk = async (e) => {
    e.preventDefault();
    if (!bulkForm.name.trim() || !bulkForm.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    setBulkSubmitting(true);
    try {
      await api.post('/bulk-orders', {
        name: bulkForm.name.trim(),
        email: bulkForm.email.trim(),
        phone: bulkForm.phone.trim(),
        company: bulkForm.company.trim(),
        productId: product._id,
        quantityEstimate: bulkForm.quantityEstimate,
        message: bulkForm.message.trim(),
      });
      toast.success('Request sent — our team will contact you with bulk pricing.');
      setBulkOpen(false);
      setBulkForm({
        name: '',
        email: '',
        phone: '',
        company: '',
        quantityEstimate: '',
        message: '',
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!requireAuth()) return;
    if (!reviewForm.body.trim()) {
      toast.error('Please write a short review');
      return;
    }
    setReviewSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('productId', product._id);
      fd.append('rating', String(reviewForm.rating));
      if (reviewForm.title.trim()) fd.append('title', reviewForm.title.trim());
      fd.append('body', reviewForm.body.trim());
      await api.post('/reviews', fd);
      toast.success('Thank you! Your review was submitted.');
      setReviewForm({ rating: 5, title: '', body: '' });
      loadReviews(1, false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const dist = reviewPagination?.ratingDistribution || [];
  const totalReviewPages = reviewPagination?.totalPages || 1;

  return (
    <div className="container section product-detail-page">
      <div className="breadcrumb">
        <span><Link href="/">Home</Link></span>
        <span className="breadcrumb-sep">/</span>
        <span><Link href="/products">Shop</Link></span>
        <span className="breadcrumb-sep">/</span>
        {product.category?.slug && (
          <>
            <Link href={`/categories/${product.category.slug}`}>{product.category.name}</Link>
            <span className="breadcrumb-sep">/</span>
          </>
        )}
        <span className="breadcrumb-current">{product.name}</span>
      </div>

      <div
        className="product-layout product-detail-top product-detail-hero-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)',
          gap: 36,
          marginBottom: 48,
        }}
      >
        <div className="product-images">
          <div className="product-thumbnails">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                className={`product-thumb${idx === activeIndex ? ' active' : ''}`}
                onClick={() => setActiveIndex(idx)}
                style={{ position: 'relative' }}
              >
                {img ? (
                  <Image src={img} alt="" fill style={{ objectFit: 'cover' }} sizes="72px" />
                ) : (
                  <span style={{ fontSize: '1.5rem' }}>🎁</span>
                )}
              </button>
            ))}
          </div>
          <div className="product-main-img">
            {images[activeIndex] ? (
              <Image
                src={images[activeIndex]}
                alt={product.name}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>🎁</div>
            )}
            {discount > 0 && (
              <span className="badge badge-success" style={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
                {discount}% OFF
              </span>
            )}
            {product.isFeatured && (
              <span className="badge badge-primary" style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
                Featured
              </span>
            )}
          </div>
        </div>

        <div className="product-info">
          <div className="product-rating" style={{ flexWrap: 'wrap' }}>
            {product.rating?.count > 0 ? (
              <>
                <StarRow value={Math.round(product.rating.average)} size={16} />
                <span className="rating-count">
                  {product.rating.average.toFixed(1)} · {product.rating.count} reviews
                </span>
              </>
            ) : (
              <span className="badge badge-default" style={{ fontSize: '0.75rem' }}>No reviews yet — be the first</span>
            )}
          </div>

          <h1 className="product-title-detail">{product.name}</h1>

          <div className="product-price-detail">
            <span className="price-detail-current">{formatPrice(unitPrice)}</span>
            {discount > 0 && (
              <>
                <span className="price-detail-original">{formatPrice(product.basePrice)}</span>
                <span className="price-detail-badge">{discount}% off</span>
              </>
            )}
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: 8 }}>per unit</span>
          </div>

          {product.shortDescription && (
            <p style={{ marginBottom: 18, fontSize: '1.02rem', color: 'var(--text-secondary)' }}>
              {product.shortDescription}
            </p>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {product.productType && (
              <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                {product.productType.replace('_', ' ')}
              </span>
            )}
            {product.category?.name && (
              <span className="badge badge-primary">
                {product.category.icon ? `${product.category.icon} ` : ''}{product.category.name}
              </span>
            )}
            {outOfStock ? (
              <span className="badge badge-danger">Out of stock</span>
            ) : product.stock != null ? (
              <span className="badge badge-success">{product.stock} in stock</span>
            ) : null}
          </div>

          {Array.isArray(product.relatedTos) && product.relatedTos.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div className="variant-label" style={{ marginBottom: 8 }}>Perfect for</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {product.relatedTos.slice(0, 10).map((rt) => (
                  <Link
                    key={rt._id || rt.relatedTo?._id}
                    href={rt.relatedTo?.slug ? `/occasions/${rt.relatedTo.slug}` : '/occasions'}
                    className="badge badge-warning"
                    style={{ fontSize: '0.78rem' }}
                  >
                    {rt.relatedTo?.icon ? `${rt.relatedTo.icon} ` : ''}{rt.relatedTo?.name || 'Occasion'}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 18 }}>
            <div className="variant-label">Quantity</div>
            <div
              className="qty-control"
              style={{
                width: 'fit-content',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '6px 10px',
              }}
            >
              <button
                type="button"
                className="qty-btn"
                onClick={() => setQty((q) => Math.max(minQty, q - 1))}
                disabled={qty <= minQty}
              >
                <Minus size={14} />
              </button>
              <span className="qty-num">{qty}</span>
              <button
                type="button"
                className="qty-btn"
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                disabled={qty >= maxQty}
              >
                <Plus size={14} />
              </button>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: 6 }}>
              Min {minQty} · Max {maxQty} per order
            </span>
          </div>

          <div
            className="product-actions-detail"
            style={{ flexWrap: 'wrap', marginBottom: 20 }}
          >
            <button
              type="button"
              className="btn btn-primary add-to-cart-detail"
              onClick={() => handleCart()}
              disabled={outOfStock}
            >
              {product.isCustomizable ? <Settings2 size={18} /> : <ShoppingCart size={18} />}
              {outOfStock
                ? 'Out of stock'
                : product.isCustomizable
                ? 'Personalise & Add to Cart'
                : 'Add to cart'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleWishlist}>
              <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
              {wishlisted ? 'Wishlisted' : 'Wishlist now'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setBulkOpen(true)}>
              <Package size={18} />
              Bulk order
            </button>
          </div>

          <div className="card" style={{ padding: 16, marginBottom: 16, background: 'var(--bg-elevated)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
              {product.deliveryDays != null && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <Truck size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Delivery</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Est. {product.deliveryDays} working days</div>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <ShieldCheck size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Quality</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>HD print &amp; careful packaging</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <MessageSquare size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Support</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <Link href="/contact" style={{ color: 'var(--primary)' }}>Contact us</Link> anytime
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="product-detail-split" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24, marginBottom: 40 }}>
        <div className="card" style={{ padding: 28 }}>
          <h2 className="section-title" style={{ fontSize: '1.25rem', marginBottom: 16 }}>About this product</h2>
          {product.description ? (
            <div style={{ color: 'var(--text-secondary)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
              {product.description}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Detailed description coming soon.</p>
          )}

          {variants.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <h3 className="variant-label" style={{ fontSize: '1rem', marginBottom: 12 }}>Variants</h3>
              <div className="variant-options">
                {variants.map((v) => (
                  <span key={v._id || v.sku} className="variant-btn" style={{ cursor: 'default' }}>
                    {v.variantName} — {formatPrice(v.discountPrice || v.basePrice)}
                    {v.stock === 0 ? ' (out of stock)' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {customizationOptions.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <h3 className="variant-label" style={{ fontSize: '1rem', marginBottom: 12 }}>Personalisation</h3>
              <ul style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.8 }}>
                {customizationOptions.map((opt, i) => (
                  <li key={i}>
                    <strong>{opt.label}</strong> ({opt.type.replace('_', ' ')})
                    {opt.isRequired ? ' — required' : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 24, height: 'fit-content' }}>
          <h3 className="section-title" style={{ fontSize: '1.05rem', marginBottom: 16 }}>Quick facts</h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.9rem' }}>
            <li style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>SKU / Slug</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{product.slug}</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Stock</span>
              <span>{outOfStock ? 'Unavailable' : product.stock}</span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Order qty</span>
              <span>{minQty} – {maxQty}</span>
            </li>
            {product.effectivePrice != null && (
              <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Effective price</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatPrice(product.effectivePrice)}</span>
              </li>
            )}
          </ul>
          {Array.isArray(product.tags) && product.tags.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div className="variant-label" style={{ marginBottom: 8 }}>Tags</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {product.tags.map((t) => (
                  <span key={t} className="badge badge-default" style={{ fontSize: '0.72rem' }}>{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {pricingTiers.length > 0 && (
        <div className="card" style={{ padding: 28, marginBottom: 40 }}>
          <h2 className="section-title" style={{ fontSize: '1.2rem', marginBottom: 8 }}>Volume pricing</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 20 }}>
            Lower per-unit rates for larger quantities. For custom quotes, use <strong>Bulk order</strong>.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 8px' }}>From qty</th>
                  <th style={{ padding: '10px 8px' }}>Price / unit</th>
                </tr>
              </thead>
              <tbody>
                {pricingTiers
                  .slice()
                  .sort((a, b) => a.minQuantity - b.minQuantity)
                  .map((tier, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 8px' }}>{tier.minQuantity}+</td>
                      <td style={{ padding: '12px 8px', fontWeight: 700, color: 'var(--primary)' }}>
                        {formatPrice(tier.pricePerUnit)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="card" style={{ padding: 28, marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <h2 className="section-title" style={{ fontSize: '1.25rem', marginBottom: 6 }}>Customer reviews</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Verified buyers and honest feedback
            </p>
          </div>
          {product.rating?.count > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                {product.rating.average.toFixed(1)}
              </div>
              <StarRow value={Math.round(product.rating.average)} />
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{product.rating.count} reviews</div>
            </div>
          )}
        </div>

        {dist.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
            {dist
              .slice()
              .sort((a, b) => b._id - a._id)
              .map((d) => (
                <span key={d._id} className="badge badge-default" style={{ fontSize: '0.78rem' }}>
                  {d._id}★ · {d.count}
                </span>
              ))}
          </div>
        )}

        {reviewsLoading && reviews.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)' }}>
            <Loader2 className="spin" size={18} /> Loading reviews…
          </div>
        ) : reviews.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No reviews yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {reviews.map((r) => (
              <div key={r._id} className="review-card" style={{ marginBottom: 0 }}>
                <div className="review-header">
                  <div className="reviewer-info">
                    <div className="reviewer-avatar">{(r.user?.name || 'U')[0]}</div>
                    <div>
                      <div className="reviewer-name">{r.user?.name || 'Customer'}</div>
                      <div className="review-date">{new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <StarRow value={r.rating} size={12} />
                </div>
                {r.isVerifiedPurchase && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#66BB6A', marginBottom: 8 }}>
                    <BadgeCheck size={14} /> Verified purchase
                  </div>
                )}
                {r.title && <div style={{ fontWeight: 700, marginBottom: 6 }}>{r.title}</div>}
                {r.body && <div className="review-text">{r.body}</div>}
                {r.adminReply && (
                  <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-elevated)', borderRadius: 8, fontSize: '0.86rem' }}>
                    <strong style={{ color: 'var(--primary)' }}>Printicom</strong>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>reply</span>
                    <div style={{ marginTop: 6 }}>{r.adminReply}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {reviewPagination && reviewPage < totalReviewPages && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ marginTop: 20 }}
            disabled={reviewsLoading}
            onClick={() => loadReviews(reviewPage + 1, true)}
          >
            {reviewsLoading ? 'Loading…' : 'Load more reviews'}
          </button>
        )}

        <div style={{ marginTop: 32, paddingTop: 28, borderTop: '1px solid var(--border)' }}>
          <h3 className="section-title" style={{ fontSize: '1.05rem', marginBottom: 12 }}>Write a review</h3>
          {!isAuthenticated ? (
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: 10 }}>
                Sign in to share your experience with this product.
              </p>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => openAuthModal('login')}>
                Sign in to review
              </button>
            </div>
          ) : null}
          {isAuthenticated && (
            <form onSubmit={submitReview} style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Rating</label>
                <select
                  className="form-select"
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm((f) => ({ ...f, rating: parseInt(e.target.value, 10) }))}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>{n} stars</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Title (optional)</label>
                <input
                  className="form-input"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                  maxLength={100}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Your review</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: 100 }}
                  value={reviewForm.body}
                  onChange={(e) => setReviewForm((f) => ({ ...f, body: e.target.value }))}
                  maxLength={1000}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={reviewSubmitting}>
                {reviewSubmitting ? <Loader2 className="spin" size={18} /> : 'Submit review'}
              </button>
            </form>
          )}
        </div>
      </div>

      {recommendations.length > 0 && (
        <section style={{ marginBottom: 48 }}>
          <div className="section-header" style={{ marginBottom: 20 }}>
            <h2 className="section-title" style={{ fontSize: '1.2rem' }}>You may also like</h2>
            <Link href="/products" className="btn btn-ghost btn-sm">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="products-grid">
            {recommendations.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Bulk order modal */}
      {bulkOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Bulk order request"
          onClick={(e) => e.target === e.currentTarget && setBulkOpen(false)}
        >
          <div className="modal modal-lg" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <button type="button" className="modal-close" onClick={() => setBulkOpen(false)} aria-label="Close" style={{ top: 20, right: 20 }}>✕</button>
            
            <div style={{ padding: '32px 32px 24px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, rgba(255,107,53,0.05) 0%, rgba(255,179,71,0.02) 100%)' }}>
              <div className="modal-logo" style={{ textAlign: 'left', fontSize: '1.4rem', marginBottom: 8 }}>Bulk order request</div>
              <p className="modal-subtitle" style={{ textAlign: 'left', marginBottom: 0, fontSize: '0.92rem' }}>
                Looking for 50+ units? Request a custom quote for <strong>{product.name}</strong>.
              </p>
            </div>

            <div style={{ padding: '24px 32px', overflowY: 'auto' }}>
              <form onSubmit={submitBulk} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="bulk-name">Name *</label>
                    <input id="bulk-name" className="form-input" required value={bulkForm.name} onChange={(e) => setBulkForm((f) => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="bulk-email">Email *</label>
                    <input id="bulk-email" type="email" className="form-input" required value={bulkForm.email} onChange={(e) => setBulkForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="bulk-phone">Phone</label>
                    <input id="bulk-phone" className="form-input" value={bulkForm.phone} onChange={(e) => setBulkForm((f) => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="bulk-qty">Estimated quantity</label>
                    <input
                      id="bulk-qty"
                      type="number"
                      min={1}
                      className="form-input"
                      placeholder="e.g. 100"
                      value={bulkForm.quantityEstimate}
                      onChange={(e) => setBulkForm((f) => ({ ...f, quantityEstimate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="bulk-co">Company (optional)</label>
                  <input id="bulk-co" className="form-input" value={bulkForm.company} onChange={(e) => setBulkForm((f) => ({ ...f, company: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="bulk-msg">Additional details</label>
                  <textarea
                    id="bulk-msg"
                    className="form-input"
                    style={{ minHeight: 100 }}
                    value={bulkForm.message}
                    onChange={(e) => setBulkForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Deadline, delivery city, or any specific customization needs..."
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={bulkSubmitting} style={{ marginTop: 8, height: 48 }}>
                  {bulkSubmitting ? <Loader2 className="spin" size={18} /> : 'Send quote request'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Customization Modal */}
      {customizationOpen && product.isCustomizable && (
        <CustomizationModal
          product={product}
          quantity={qty}
          onClose={() => setCustomizationOpen(false)}
          onConfirm={(customization) => handleCart(customization)}
        />
      )}
    </div>
  );
}
