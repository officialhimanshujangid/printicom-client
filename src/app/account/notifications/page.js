'use client';

import { useEffect, useState } from 'react';
import useAuthStore from '@/store/authStore';
import api from '@/lib/api';
import { timeAgo } from '@/lib/utils';

export default function NotificationsPage() {
  const { isAuthenticated, openAuthModal } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/notifications');
        if (!mounted) return;
        setNotifications(data?.data?.notifications || data?.data || []);
      } catch {
        if (mounted) setNotifications([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="container section">
        <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
          <h1 className="section-title" style={{ fontSize: '1.3rem', marginBottom: 10 }}>Notifications</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
            Sign in to see order updates and offers.
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
          <h1 className="section-title">Notifications</h1>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p>Loading notifications…</p>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-title">No notifications</h3>
            <p className="empty-desc">We&apos;ll notify you here about your orders and offers.</p>
          </div>
        ) : (
          <ul className="notification-list">
            {notifications.map((n) => (
              <li
                key={n._id}
                className={`notification-item${n.read ? '' : ' unread'}`}
              >
                <div>
                  <div className="notification-title">{n.title}</div>
                  {n.message && (
                    <div className="notification-body">{n.message}</div>
                  )}
                  <div className="notification-meta">
                    <span>{timeAgo(n.createdAt)}</span>
                    {n.type && <span>· {n.type}</span>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

