'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function HeroBanner({ banners = [] }) {
  const [idx, setIdx] = useState(0);
  const total = banners.length;

  const next = useCallback(() => setIdx((i) => (i + 1) % total), [total]);
  const prev = () => setIdx((i) => (i - 1 + total) % total);

  useEffect(() => {
    if (total <= 1) return;
    const t = setInterval(next, 4500);
    return () => clearInterval(t);
  }, [next, total]);

  if (!total) {
    return (
      <div className="hero">
        <div className="hero-slide" style={{ background: 'linear-gradient(135deg, #0A0A0F 0%, #18181F 50%, #1a0a05 100%)', minHeight: 560 }}>
          <div className="container">
            <div className="hero-content">
              <div className="hero-tag">✨ Premium Custom Printing</div>
              <h1 className="hero-title">Turn Your <span className="text-gradient">Memories</span><br />Into Masterpieces</h1>
              <p className="hero-subtitle">Custom mugs, photo prints, calendars & more — all personalised just for you. Fast delivery across India.</p>
              <div className="hero-actions">
                <Link href="/products" className="btn btn-primary btn-lg">Shop Now →</Link>
                <Link href="/occasions" className="btn btn-secondary btn-lg">Browse Occasions</Link>
              </div>
            </div>
          </div>
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '45%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8rem', opacity: 0.08, pointerEvents: 'none' }}>🎁</div>
        </div>
      </div>
    );
  }

  const slide = banners[idx];

  return (
    <div className="hero" role="banner">
      <div className="hero-slide">
        <div className="hero-bg">
          <Image src={slide.imageUrl} alt={slide.altText || slide.title} fill style={{ objectFit: 'cover' }} priority />
        </div>
        <div className="container">
          <div className="hero-content fade-in" key={idx}>
            {slide.badgeText && <div className="hero-tag">✨ {slide.badgeText}</div>}
            <h1 className="hero-title">{slide.title}</h1>
            {slide.subtitle && <p className="hero-subtitle">{slide.subtitle}</p>}
            {slide.ctaText && slide.ctaLink && (
              <div className="hero-actions">
                <Link href={slide.ctaLink} className="btn btn-primary btn-lg" target={slide.ctaTarget || '_self'}>{slide.ctaText} →</Link>
                <Link href="/products" className="btn btn-secondary btn-lg">Browse All</Link>
              </div>
            )}
          </div>
        </div>
        {total > 1 && (
          <>
            <button className="btn btn-ghost" onClick={prev} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', borderRadius: '50%', width: 44, height: 44, border: '1px solid rgba(255,255,255,0.15)' }} aria-label="Previous slide">
              <ChevronLeft size={20} />
            </button>
            <button className="btn btn-ghost" onClick={next} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', borderRadius: '50%', width: 44, height: 44, border: '1px solid rgba(255,255,255,0.15)' }} aria-label="Next slide">
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>
      {total > 1 && (
        <div className="hero-dots" role="tablist" aria-label="Slides">
          {banners.map((_, i) => (
            <button key={i} role="tab" aria-selected={i === idx} className={`hero-dot${i === idx ? ' active' : ''}`} onClick={() => setIdx(i)} aria-label={`Slide ${i + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
}
