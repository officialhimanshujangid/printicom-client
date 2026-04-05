'use client';

import { useState } from 'react';
import api from '@/lib/api';

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.get(`/orders/track/${encodeURIComponent(orderNumber.trim())}`);
      setResult(data?.data || data);
    } catch (err) {
      setError(err.response?.data?.message || 'Order not found. Please check the number and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <div className="section-tag">Support</div>
          <h1 className="section-title">Track Your Order</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>
            Enter your order number from email/SMS to see the latest status.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 520, margin: '0 auto 32px' }}>
        <label className="form-label" htmlFor="order-number">Order Number</label>
        <input
          id="order-number"
          className="form-input"
          placeholder="e.g. PRI2026XXXX"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
        />
        <button
          type="submit"
          className="btn btn-primary"
          style={{ marginTop: 14 }}
          disabled={loading || !orderNumber.trim()}
        >
          {loading ? 'Checking…' : 'Track Order'}
        </button>
      </form>

      {error && (
        <div className="card" style={{ maxWidth: 520, margin: '0 auto', borderColor: 'rgba(244, 67, 54, 0.4)' }}>
          <p style={{ color: '#f44336', fontSize: '0.9rem' }}>{error}</p>
        </div>
      )}

      {result && (
        <div className="card" style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 className="section-title" style={{ fontSize: '1.1rem', marginBottom: 12 }}>Order Details</h2>
          <div className="summary-line">
            <span>Order Number</span>
            <span>{result.orderNumber}</span>
          </div>
          <div className="summary-line">
            <span>Status</span>
            <span style={{ textTransform: 'capitalize' }}>{result.status}</span>
          </div>
          {result.paymentStatus && (
            <div className="summary-line">
              <span>Payment</span>
              <span style={{ textTransform: 'capitalize' }}>{result.paymentStatus}</span>
            </div>
          )}
          {result.tracking && (
            <>
              {result.tracking.carrier && (
                <div className="summary-line">
                  <span>Courier</span>
                  <span>{result.tracking.carrier}</span>
                </div>
              )}
              {result.tracking.trackingId && (
                <div className="summary-line">
                  <span>Tracking ID</span>
                  <span>{result.tracking.trackingId}</span>
                </div>
              )}
              {result.tracking.link && (
                <div className="summary-line">
                  <span>Tracking Link</span>
                  <a
                    href={result.tracking.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-link"
                  >
                    View on courier site
                  </a>
                </div>
              )}
            </>
          )}
          {Array.isArray(result.items) && result.items.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', marginBottom: 8 }}>
                Items
              </h3>
              <ul className="order-items">
                {result.items.map((item) => (
                  <li key={item._id || item.productId} className="order-item-row">
                    <span>{item.productSnapshot?.name || item.productName}</span>
                    <span>x{item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

