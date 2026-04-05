'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';

const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || 'payments@printicom';
const BANK_ACCOUNT = process.env.NEXT_PUBLIC_BANK_ACCOUNT || 'XXXX XXXX XXXX 1234';
const BANK_IFSC = process.env.NEXT_PUBLIC_BANK_IFSC || 'XXXX0000001';
const BANK_NAME = process.env.NEXT_PUBLIC_BANK_NAME || 'Printicom Pvt Ltd';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const method = searchParams.get('method');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (!orderId) { router.push('/'); return; }
    (async () => {
      try {
        const { data } = await api.get(`/orders/${orderId}`);
        setOrder(data.data?.order || data.data);
      } catch {
        router.push('/');
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="loading-spinner" style={{ width: 48, height: 48 }} />
    </div>
  );

  if (!order) return null;

  const isCOD = order.paymentMethod === 'cod';
  const isBankTransfer = order.paymentMethod === 'bank_transfer';
  const isOnline = order.paymentMethod === 'razorpay';

  return (
    <div className="container section-sm" style={{ maxWidth: 760, padding: '40px 20px' }}>

      {/* ── Success Header ── */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', margin: '0 auto 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(102,187,106,0.2), rgba(102,187,106,0.05))',
          border: '2px solid rgba(102,187,106,0.4)',
          fontSize: 36, animation: 'pulse 2s infinite'
        }}>✅</div>
        <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)', marginBottom: 8 }}>
          {isBankTransfer ? 'Order Received!' : 'Order Confirmed!'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          {isBankTransfer
            ? 'Complete your payment using the details below to confirm your order.'
            : isCOD
            ? 'Your order has been placed. Pay when you receive it!'
            : 'Payment successful. Your order is being processed.'}
        </p>
        <div style={{
          display: 'inline-block', marginTop: 16, padding: '6px 20px',
          background: 'rgba(255,107,53,0.1)', borderRadius: 999,
          border: '1px solid rgba(255,107,53,0.25)',
          fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--primary)'
        }}>
          #{order.orderNumber}
        </div>
      </div>

      {/* ── Bank Transfer Payment Details ── */}
      {isBankTransfer && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.02))',
          border: '1px solid rgba(99,102,241,0.25)', borderRadius: 16, padding: 28, marginBottom: 28
        }}>
          <h2 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-heading)', marginBottom: 20, color: '#818cf8', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>💳</span> Complete Your Payment
          </h2>
          <p style={{ fontSize: '0.87rem', color: 'var(--text-muted)', marginBottom: 20 }}>
            Transfer exactly <strong style={{ color: 'var(--primary)' }}>{formatPrice(order.totalAmount)}</strong> using any of the options below. 
            Your order will be confirmed within 2–4 hours of payment receipt.
          </p>

          {/* UPI Section */}
          <div style={{ marginBottom: 20, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 10 }}>
              Option 1 — UPI Transfer (Instant)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 2 }}>UPI ID</div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{UPI_ID}</div>
              </div>
              <button
                onClick={() => copyToClipboard(UPI_ID, 'upi')}
                style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600,
                  background: copied === 'upi' ? 'rgba(102,187,106,0.15)' : 'rgba(99,102,241,0.15)',
                  color: copied === 'upi' ? '#66BB6A' : '#818cf8',
                  border: `1px solid ${copied === 'upi' ? 'rgba(102,187,106,0.3)' : 'rgba(99,102,241,0.3)'}`,
                  transition: 'all 0.2s'
                }}
              >
                {copied === 'upi' ? '✓ Copied!' : 'Copy UPI ID'}
              </button>
            </div>
          </div>

          {/* Bank Section */}
          <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 12 }}>
              Option 2 — Bank Transfer / NEFT / IMPS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { label: 'Account Name', value: BANK_NAME },
                { label: 'Account Number', value: BANK_ACCOUNT, copyKey: 'acc' },
                { label: 'IFSC Code', value: BANK_IFSC, copyKey: 'ifsc' },
                { label: 'Amount', value: formatPrice(order.totalAmount) },
              ].map(({ label, value, copyKey }) => (
                <div key={label}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.92rem', fontFamily: copyKey ? 'monospace' : 'inherit' }}>{value}</span>
                    {copyKey && (
                      <button onClick={() => copyToClipboard(value, copyKey)} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
                        {copied === copyKey ? '✓' : 'Copy'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(245,158,11,0.08)', borderRadius: 10, border: '1px solid rgba(245,158,11,0.2)', fontSize: '0.82rem', color: '#f59e0b' }}>
            ⚠️ Please add your order number <strong>#{order.orderNumber}</strong> in the payment remarks for faster processing.
          </div>
        </div>
      )}

      {/* ── COD Info ── */}
      {isCOD && (
        <div style={{
          background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 16, padding: 20, marginBottom: 28,
          display: 'flex', gap: 14, alignItems: 'flex-start'
        }}>
          <span style={{ fontSize: 24 }}>💵</span>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4, color: '#f59e0b' }}>Cash on Delivery</div>
            <div style={{ fontSize: '0.87rem', color: 'var(--text-muted)' }}>
              Keep <strong style={{ color: 'var(--text-primary)' }}>{formatPrice(order.totalAmount)}</strong> ready at the time of delivery. 
              Our delivery partner will collect payment when your order arrives.
            </div>
          </div>
        </div>
      )}

      {/* ── Order Summary ── */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 28 }}>
        <h2 style={{ fontSize: '1rem', fontFamily: 'var(--font-heading)', marginBottom: 20 }}>Order Summary</h2>

        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
          {order.items?.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--bg-card)', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' }}>
                {item.productSnapshot?.thumbnailImage && (
                  <img src={item.productSnapshot.thumbnailImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.productSnapshot?.name}</div>
                {item.variantName && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.variantName}</div>}
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Qty: {item.quantity}</div>
              </div>
              <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>
                {formatPrice(item.lineTotal)}
              </div>
            </div>
          ))}
        </div>

        {/* Pricing */}
        {[
          { label: 'Subtotal', value: formatPrice(order.subtotal) },
          { label: 'Shipping', value: order.shippingCharge > 0 ? formatPrice(order.shippingCharge) : 'FREE', color: '#66BB6A' },
          ...(order.couponDiscount > 0 ? [{ label: `Coupon (${order.coupon?.code})`, value: `-${formatPrice(order.couponDiscount)}`, color: '#66BB6A' }] : []),
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ color: color || 'var(--text-primary)' }}>{value}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, marginTop: 4, borderTop: '1px solid var(--border)', fontWeight: 800, fontSize: '1.05rem' }}>
          <span>Total Paid</span>
          <span style={{ color: 'var(--primary)' }}>{formatPrice(order.totalAmount)}</span>
        </div>
      </div>

      {/* ── Delivery Address ── */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 28 }}>
        <h2 style={{ fontSize: '0.9rem', fontFamily: 'var(--font-heading)', marginBottom: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Deliver To</h2>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{order.shippingAddress?.fullName}</div>
        <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          {order.shippingAddress?.street}{order.shippingAddress?.landmark ? `, ${order.shippingAddress.landmark}` : ''}<br />
          {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}<br />
          📞 {order.shippingAddress?.phone}
        </div>
        {order.estimatedDeliveryDate && (
          <div style={{ marginTop: 12, padding: '8px 14px', background: 'rgba(255,107,53,0.06)', borderRadius: 8, fontSize: '0.83rem', color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', gap: 6 }}>
            🚀 Est. Delivery: {new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        )}
      </div>

      {/* ── CTAs ── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/account/orders" className="btn btn-primary" style={{ flex: 1, minWidth: 160, textAlign: 'center' }}>
          Track My Orders
        </Link>
        <Link href="/products" className="btn btn-secondary" style={{ flex: 1, minWidth: 160, textAlign: 'center' }}>
          Continue Shopping
        </Link>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .loading-spinner {
          border: 3px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><div className="loading-spinner" style={{ width: 48, height: 48, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#FF6B35', borderRadius: '50%' }} /></div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
