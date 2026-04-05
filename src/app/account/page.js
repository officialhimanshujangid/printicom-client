'use client';

import Link from 'next/link';
import useAuthStore from '@/store/authStore';

export default function AccountHomePage() {
  const { user, isAuthenticated, openAuthModal, logout } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <div className="container section">
        <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
          <h1 className="section-title" style={{ fontSize: '1.4rem', marginBottom: 10 }}>My Account</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
            Please sign in to view your orders, addresses, wishlist and more.
          </p>
          <button className="btn btn-primary" onClick={() => openAuthModal('login')}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <div className="section-tag">Account</div>
          <h1 className="section-title">Hi, {user?.name || 'there'} 👋</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>
            Manage your orders, addresses, wishlist and notifications.
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={logout}>
          Logout
        </button>
      </div>

      <div className="account-grid">
        <Link href="/account/profile" className="card account-card">
          <span style={{ fontSize: '1.5rem', marginBottom: 8 }}>👤</span>
          <h2 className="account-card-title">Profile</h2>
          <p className="account-card-desc">Your personal details and contact info.</p>
        </Link>
        <Link href="/account/orders" className="card account-card">
          <span style={{ fontSize: '1.5rem', marginBottom: 8 }}>📦</span>
          <h2 className="account-card-title">Orders</h2>
          <p className="account-card-desc">View your past orders and track status.</p>
        </Link>
        <Link href="/account/addresses" className="card account-card">
          <span style={{ fontSize: '1.5rem', marginBottom: 8 }}>📍</span>
          <h2 className="account-card-title">Addresses</h2>
          <p className="account-card-desc">Manage your delivery addresses.</p>
        </Link>
        <Link href="/account/wishlist" className="card account-card">
          <span style={{ fontSize: '1.5rem', marginBottom: 8 }}>❤️</span>
          <h2 className="account-card-title">Wishlist</h2>
          <p className="account-card-desc">See products you&apos;ve saved.</p>
        </Link>
        <Link href="/account/notifications" className="card account-card">
          <span style={{ fontSize: '1.5rem', marginBottom: 8 }}>🔔</span>
          <h2 className="account-card-title">Notifications</h2>
          <p className="account-card-desc">Updates about your orders and offers.</p>
        </Link>
      </div>
    </div>
  );
}

