'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { formatPrice, ORDER_STATUS_MAP, timeAgo } from '@/lib/utils';

export default function MyOrdersPage() {
  const { isAuthenticated, openAuthModal } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/orders/my');
        if (!mounted) return;
        setOrders(data?.data?.orders || data?.data || []);
      } catch {
        if (mounted) setOrders([]);
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
          <h1 className="section-title" style={{ fontSize: '1.3rem', marginBottom: 10 }}>My Orders</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
            Please sign in to view your orders.
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
          <h1 className="section-title">My Orders</h1>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <p>Loading your orders…</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <h3 className="empty-title">No orders yet</h3>
          <p className="empty-desc">Start by ordering your first personalised product.</p>
          <Link href="/products" className="btn btn-primary">Shop Now</Link>
        </div>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const s = ORDER_STATUS_MAP[o.status] || { label: o.status, color: 'var(--text-muted)' };
                return (
                  <tr key={o._id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>#{o.orderNumber}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(o.createdAt).toLocaleDateString()}<br />
                      <span style={{ fontSize: 11 }}>{timeAgo(o.createdAt)}</span>
                    </td>
                    <td style={{ fontSize: 13 }}>{o.items?.length || 0}</td>
                    <td style={{ fontWeight: 600 }}>{formatPrice(o.totalAmount)}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: `${s.color}20`,
                          color: s.color,
                          fontSize: 11,
                          textTransform: 'capitalize',
                        }}
                      >
                        {s.label}
                      </span>
                    </td>
                    <td>
                      <Link 
                        href={`/account/orders/${o._id}`} 
                        className="btn btn-secondary btn-sm" 
                        style={{ fontSize: 11, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <span style={{ fontSize: 13 }}>👁️</span> View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

