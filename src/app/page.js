import { Suspense } from 'react';
import api from '@/lib/api';
import HeroBanner from '@/components/home/HeroBanner';
import ProductCard from '@/components/products/ProductCard';
import ProductCardSkeleton from '@/components/products/ProductCardSkeleton';
import Link from 'next/link';
import Image from 'next/image';

async function getBanners() {
  try { const r = await api.get('/banners/public/hero_slider'); return r.data?.data?.banners || []; }
  catch { return []; }
}
async function getCategories() {
  try { const r = await api.get('/categories'); return r.data?.data?.categories || []; }
  catch { return []; }
}
async function getFeatured() {
  try { const r = await api.get('/products/featured'); return r.data?.data?.products || []; }
  catch { return []; }
}
async function getOccasions() {
  try { const r = await api.get('/related-to'); return r.data?.data?.relatedTos || []; }
  catch { return []; }
}
async function getOfferBanners() {
  try { const r = await api.get('/banners/public/homepage_grid'); return r.data?.data?.banners || []; }
  catch { return []; }
}
async function getSettings() {
  try { const r = await api.get('/settings/public'); return r.data?.data?.settings || {}; }
  catch { return {}; }
}

export default async function HomePage() {
  const [banners, categories, featured, occasions, offerBanners, settings] = await Promise.all([
    getBanners(), getCategories(), getFeatured(), getOccasions(), getOfferBanners(), getSettings(),
  ]);

  const features = settings?.homepage?.features || [
    { icon: '🚀', title: 'Fast Delivery', desc: '2-5 days across India' },
    { icon: '🎨', title: 'Custom Design', desc: 'Upload your photos & text' },
    { icon: '💎', title: 'Premium Quality', desc: 'HD print, long-lasting ink' },
    { icon: '🔒', title: 'Secure Payments', desc: 'Razorpay, UPI, COD' },
  ];

  return (
    <div className="fade-in">
      {/* Hero */}
      <HeroBanner banners={banners} />

      {/* Categories */}
      {categories.length > 0 && (
        <section className="section-sm" aria-labelledby="categories-heading">
          <div className="container">
            <div className="section-header">
              <div>
                <div className="section-tag">Browse</div>
                <h2 id="categories-heading" className="section-title">Shop by Category</h2>
              </div>
              <Link href="/categories" className="btn btn-secondary btn-sm">View All →</Link>
            </div>
            <div className="categories-scroll">
              {categories.slice(0, 12).map((cat) => (
                <Link key={cat._id} href={`/categories/${cat.slug}`} className="category-chip">
                  <div className="category-chip-icon">
                    {cat.image ? <Image src={cat.image} alt={cat.name} width={52} height={52} style={{ objectFit: 'cover', width: '100%', height: '100%' }} /> : <span style={{ fontSize: '1.6rem' }}>{cat.icon || '🏷'}</span>}
                  </div>
                  <span className="category-chip-label">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="section" aria-labelledby="featured-heading">
        <div className="container">
          <div className="section-header">
            <div>
              <div className="section-tag">Trending</div>
              <h2 id="featured-heading" className="section-title">Featured Products</h2>
            </div>
            <Link href="/products" className="btn btn-secondary btn-sm">View All →</Link>
          </div>
          <div className="products-grid">
            {featured.length > 0
              ? featured.slice(0, 8).map((p) => <ProductCard key={p._id} product={p} />)
              : Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            }
          </div>
        </div>
      </section>

      {/* Offer Banners */}
      {offerBanners.length > 0 && (
        <section className="section-sm">
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {offerBanners.slice(0, 3).map((b) => (
                <Link key={b._id} href={b.ctaLink || '/products'} className="card" style={{ position: 'relative', overflow: 'hidden', minHeight: 180 }}>
                  <Image src={b.imageUrl} alt={b.altText || b.title} fill style={{ objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(9,9,15,0.8), rgba(9,9,15,0.3))', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24 }}>
                    {b.badgeText && <span className="badge badge-primary" style={{ alignSelf: 'flex-start', marginBottom: 8 }}>{b.badgeText}</span>}
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#fff', marginBottom: 6 }}>{b.title}</h3>
                    {b.subtitle && <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>{b.subtitle}</p>}
                    {b.ctaText && <span className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>{b.ctaText}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Highlight Strip */}
      <section style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.08), rgba(255,179,71,0.05))', borderTop: '1px solid rgba(255,107,53,0.15)', borderBottom: '1px solid rgba(255,107,53,0.15)', padding: '40px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, textAlign: 'center' }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '2rem' }}>{f.icon}</span>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem' }}>{f.title}</h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Occasions */}
      {occasions.length > 0 && (
        <section className="section" aria-labelledby="occasions-heading">
          <div className="container">
            <div className="section-header">
              <div>
                <div className="section-tag">Occasions</div>
                <h2 id="occasions-heading" className="section-title">Shop by Occasion</h2>
              </div>
              <Link href="/occasions" className="btn btn-secondary btn-sm">View All →</Link>
            </div>
            <div className="occasions-grid">
              {occasions.slice(0, 8).map((occ) => (
                <Link key={occ._id} href={`/occasions/${occ.slug}`} className="occasion-card">
                  {occ.coverImage
                    ? <Image src={occ.coverImage} alt={occ.name} fill style={{ objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-surface))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>{occ.icon || '🎁'}</div>
                  }
                  <div className="occasion-card-overlay">
                    {occ.icon && <div className="occasion-card-icon">{occ.icon}</div>}
                    <div className="occasion-card-name">{occ.name}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="section-tag" style={{ justifyContent: 'center' }}>Get Started</div>
          <h2 className="section-title" style={{ marginBottom: 16 }}>Ready to Create Something <span className="text-gradient">Amazing?</span></h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>Join thousands of happy customers who've turned their memories into beautiful keepsakes.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/products" className="btn btn-primary btn-lg">Start Shopping</Link>
            <Link href="/contact" className="btn btn-secondary btn-lg">Get Help</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
