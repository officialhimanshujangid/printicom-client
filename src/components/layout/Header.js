'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Heart, User, Search, Menu, X, Bell } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import useCartStore from '@/store/cartStore';
import useSettingsStore from '@/store/settingsStore';
import { useRouter } from 'next/navigation';

const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/products' },
  { label: 'Categories', href: '/categories' },
  { label: 'Occasions', href: '/occasions' },
  { label: 'Track Order', href: '/track-order' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, openAuthModal } = useAuthStore();
  const { items } = useCartStore();
  const { settings } = useSettingsStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [isClosed, setIsClosed] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const home = settings?.homepage || {};
  const showStrip = home.showOfferStrip && !isClosed;

  const cartCount = items.reduce((acc, i) => acc + i.quantity, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQ.trim())}`);
      setSearchQ('');
    }
  };

  const handleCartClick = () => {
    if (!isAuthenticated) { openAuthModal('login'); return; }
    document.dispatchEvent(new CustomEvent('toggleCart'));
  };

  return (
    <>
      {showStrip && (
        <div className="offer-strip" style={{ 
          height: 36, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 1001,
          fontSize: '0.82rem',
          backgroundColor: home.offerStripBgColor || '#FF6B35',
          color: home.offerStripTextColor || '#FFFFFF',
        }}>
          <span dangerouslySetInnerHTML={{ __html: home.offerStripText }} />
          <button onClick={() => setIsClosed(true)} style={{ marginLeft: 16, opacity: 0.7, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
      )}

      <header 
        className={`header${!showStrip ? ' no-strip' : ''}${scrolled ? ' scrolled' : ''}`}
        style={{ 
          top: showStrip ? (scrolled ? 0 : 36) : 0,
          background: scrolled ? 'rgba(9, 9, 15, 0.95)' : 'rgba(9, 9, 15, 0.85)',
          paddingTop: scrolled ? 4 : 8,
          paddingBottom: scrolled ? 4 : 8,
        }}
      >
        <div className="container">
          <div className="header-inner">
            {/* Logo */}
            <Link href="/" className="header-logo" style={{ fontSize: scrolled ? '1.35rem' : '1.5rem', transition: 'var(--transition)' }}>Printicom</Link>

            {/* Desktop Nav */}
            <nav className="header-nav" aria-label="Main navigation">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className={`nav-link${pathname === n.href || (n.href !== '/' && pathname.startsWith(n.href)) ? ' active' : ''}`}>
                  {n.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="header-search-desktop" role="search">
              <input
                type="search"
                placeholder="Search products..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
              />
              <button type="submit"><Search size={16} /></button>
            </form>

            <div className="header-actions">
              <button 
                className="btn btn-ghost btn-icon mobile-search-toggle" 
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                aria-label="Toggle search"
              >
                <Search size={20} />
              </button>
              {isAuthenticated ? (
                <>
                  <Link href="/account/wishlist" className="btn btn-ghost btn-icon" aria-label="Wishlist" style={{ padding: scrolled ? 8 : 10 }}>
                    <Heart size={scrolled ? 18 : 20} />
                  </Link>
                  <Link href="/account/notifications" className="btn btn-ghost btn-icon" aria-label="Notifications" style={{ padding: scrolled ? 8 : 10 }}>
                    <Bell size={scrolled ? 18 : 20} />
                  </Link>
                  <Link href="/account" className="btn btn-ghost btn-icon" aria-label="Account" style={{ padding: scrolled ? 8 : 10 }}>
                    <User size={scrolled ? 18 : 20} />
                  </Link>
                </>
              ) : (
                <button className="btn btn-outline btn-sm" onClick={() => openAuthModal('login')}>
                  Sign In
                </button>
              )}
              <button className="btn btn-ghost btn-icon cart-btn" onClick={handleCartClick} aria-label={`Cart, ${cartCount} items`} style={{ padding: scrolled ? 8 : 10 }}>
                <ShoppingCart size={scrolled ? 18 : 20} />
                {cartCount > 0 && <span className="cart-count" style={{ top: scrolled ? -4 : -6, right: scrolled ? -4 : -6 }}>{cartCount > 99 ? '99+' : cartCount}</span>}
              </button>
              <button className="btn btn-ghost btn-icon mobile-menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                <Menu size={20} />
              </button>
            </div>
          </div>

          {/* Mobile Search Bar (Toggleable) */}
          {mobileSearchOpen && (
            <div className="mobile-search-bar fade-in">
              <form onSubmit={handleSearch}>
                <input
                  type="search"
                  placeholder="Search products..."
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  autoFocus
                />
                <button type="submit"><Search size={18} /></button>
              </form>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <span className="header-logo">Printicom</span>
            <button className="btn btn-ghost btn-icon" onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <X size={22} />
            </button>
          </div>
          <form onSubmit={handleSearch} className="search-bar" style={{ width: '100%', marginBottom: 16, display: 'flex' }}>
            <input type="search" placeholder="Search products..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} />
            <button type="submit"><Search size={16} /></button>
          </form>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="mobile-nav-link">{n.label}</Link>
          ))}
          <div style={{ marginTop: 'auto', paddingTop: 24, display: 'flex', gap: 10 }}>
            {isAuthenticated ? (
              <Link href="/account" className="btn btn-secondary" style={{ flex: 1 }}>My Account</Link>
            ) : (
              <>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setMobileOpen(false); openAuthModal('login'); }}>Sign In</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { setMobileOpen(false); openAuthModal('register'); }}>Register</button>
              </>
            )}
          </div>
        </nav>
      )}
    </>
  );
}
