'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import useAuthStore from '@/store/authStore';
import { formatPrice, ORDER_STATUS_MAP, timeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function OrderDetailPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const { isAuthenticated, requireAuth } = useAuthStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states for cancel/return
  const [actionModal, setActionModal] = useState(null); // 'cancel' or 'return'
  const [actionReason, setActionReason] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      requireAuth();
      return;
    }
    fetchOrder();
  }, [id, isAuthenticated]);

  const fetchOrder = async () => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data?.data?.order || data?.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load order detailed view.');
    } finally {
      setLoading(false);
    }
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!actionReason.trim()) {
      toast.error('Please provide a reason.');
      return;
    }
    setActionSubmitting(true);
    try {
      if (actionModal === 'cancel') {
        await api.patch(`/orders/${id}/cancel`, { reason: actionReason });
        toast.success('Cancellation request submitted.');
      } else {
        await api.patch(`/orders/${id}/return`, { reason: actionReason });
        toast.success('Return request submitted.');
      }
      setActionModal(null);
      setActionReason('');
      fetchOrder(); // refresh
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setActionSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container section" style={{ textAlign: 'center', padding: '100px 0' }}>Loading details...</div>;
  }

  if (error || !order) {
    return (
      <div className="container section">
        <div className="card" style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
          <h2>Order Not Found</h2>
          <p style={{ color: 'var(--text-muted)', margin: '14px 0 20px' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => router.push('/account/orders')}>Back to Orders</button>
        </div>
      </div>
    );
  }

  const s = ORDER_STATUS_MAP[order.status] || { label: order.status, color: 'var(--text-muted)' };

  // Calculate order progress
  const progressSteps = ['pending', 'processing', 'shipped', 'delivered'];
  let currentStepIndex = progressSteps.indexOf(order.status);
  if (['cancelled', 'returned'].includes(order.status)) currentStepIndex = -1;

  const isCancellable = ['pending', 'processing'].includes(order.status) && !order.cancellationRequest?.requested;
  const isReturnable = order.status === 'delivered' && !order.returnRequest?.requested;

  return (
    <div className="container section-sm" style={{ paddingTop: 30, paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/account/orders')} className="btn btn-secondary btn-sm" style={{ fontSize: 13, padding: '6px 12px' }}>
          ← Back
        </button>
        <h1 className="section-title" style={{ margin: 0, fontSize: 'clamp(1.2rem, 3vw, 1.8rem)' }}>Order #{order.orderNumber}</h1>
        <span style={{ marginLeft: 'auto', background: `${s.color}20`, color: s.color, padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {s.label}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }} className="responsive-grid">
        
        {/* LEFT COLUMN - Items & Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Progress Bar (if valid status) */}
          {currentStepIndex >= 0 && (
            <div className="card" style={{ padding: '30px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: 10 }}>
                {/* Connecting Line */}
                <div style={{ position: 'absolute', top: 12, left: 30, right: 30, height: 4, background: 'var(--border)', zIndex: 0, borderRadius: 2 }}>
                  <div style={{ height: '100%', background: '#66BB6A', borderRadius: 2, width: `${(Math.max(0, currentStepIndex) / (progressSteps.length - 1)) * 100}%`, transition: 'width 0.5s ease-out' }} />
                </div>
                {progressSteps.map((step, idx) => {
                  const isCompleted = idx <= currentStepIndex;
                  return (
                    <div key={step} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 60 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: isCompleted ? '#66BB6A' : 'var(--bg-card)', border: `3px solid ${isCompleted ? '#66BB6A' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 800 }}>
                        {isCompleted && '✓'}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: isCompleted ? 700 : 500, color: isCompleted ? 'var(--text-primary)' : 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              {/* External Tracking info */}
              {order.trackingNumber && (
                <div style={{ marginTop: 24, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', padding: 16, borderRadius: 12, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 24 }}>🚚</div>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Shipped via {order.courierName || 'Courier'}</div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{order.trackingNumber}</div>
                  </div>
                  {order.trackingUrl && (
                    <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>
                      Track Package ↗
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Special Requests Status */}
          {(order.cancellationRequest?.requested || order.returnRequest?.requested) && (
            <div className="card" style={{ border: `1px solid ${order.cancellationRequest?.requested ? '#EF5350' : '#FFB300'}` }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Special Request Status</h3>
              {order.cancellationRequest?.requested && (
                 <div style={{ fontSize: 14 }}>
                   <strong>Cancellation Request:</strong> <span style={{ textTransform: 'capitalize' }}>{order.cancellationRequest.status}</span>
                   <p style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: 13 }}>Reason: "{order.cancellationRequest.reason}"</p>
                 </div>
              )}
              {order.returnRequest?.requested && (
                 <div style={{ fontSize: 14 }}>
                   <strong>Return Request:</strong> <span style={{ textTransform: 'capitalize' }}>{order.returnRequest.status.replace('_', ' ')}</span>
                   <p style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: 13 }}>Reason: "{order.returnRequest.reason}"</p>
                   {order.returnRequest.refundStatus !== 'pending' && <p style={{ marginTop: 4, fontWeight: 600 }}>Refund: {order.returnRequest.refundStatus}</p>}
                 </div>
              )}
            </div>
          )}

          {/* Items */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>Items Ordered ({order.items?.length})</h2>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {order.items?.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, paddingBottom: 20, borderBottom: i !== order.items.length - 1 ? '1px dashed var(--border)' : 'none' }}>
                  <div style={{ width: 80, height: 80, borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', overflow: 'hidden', flexShrink: 0 }}>
                    {item.productSnapshot?.thumbnailImage ? (
                       <img src={item.productSnapshot.thumbnailImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Link href={`/products?search=${encodeURIComponent(item.productSnapshot?.name||'')}`} style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }} className="hover-underline">
                      {item.productSnapshot?.name || 'Product'}
                    </Link>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: '8px 12px' }}>
                      <span>Qty: <strong style={{ color: 'var(--text-primary)' }}>{item.quantity}</strong></span>
                      {item.variantName && <span>Variant: {item.variantName}</span>}
                      {item.customization && Object.keys(item.customization).length > 0 && <span style={{ color: 'var(--brand-primary)' }}>✨ Customised</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{formatPrice(item.lineTotal)}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatPrice(item.unitPrice)} each</div>
                  </div>
                </div>
              ))}
            </div>
            
            {(isCancellable || isReturnable) && (
              <div style={{ padding: '16px 20px', background: 'var(--bg-hover)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                {isCancellable && (
                  <button className="btn btn-secondary btn-sm" style={{ color: '#EF5350', borderColor: 'rgba(239,83,80,0.3)', background: 'rgba(239,83,80,0.05)' }} onClick={() => setActionModal('cancel')}>
                    Request Cancellation
                  </button>
                )}
                {isReturnable && (
                  <button className="btn btn-secondary btn-sm" style={{ color: '#FFB300', borderColor: 'rgba(255,179,0,0.3)', background: 'rgba(255,179,0,0.05)' }} onClick={() => setActionModal('return')}>
                    Request Return / Refund
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN - Summary & Shipping */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Order Summary */}
          <div className="card">
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Payment Summary</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment Method</span>
                <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{order.paymentMethod.replace('_', ' ')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment Status</span>
                <span style={{ color: order.paymentStatus === 'paid' ? '#66BB6A' : 'var(--text-primary)', fontWeight: 600 }}>{order.paymentStatus}</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px dashed var(--border)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Shipping</span>
                <span>{order.shippingCharge > 0 ? formatPrice(order.shippingCharge) : 'Free'}</span>
              </div>
              {order.couponDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#66BB6A' }}>
                  <span>Discount ({order.coupon?.code})</span>
                  <span>-{formatPrice(order.couponDiscount)}</span>
                </div>
              )}
              <hr style={{ border: 'none', borderTop: '1px var(--border) solid', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18 }}>
                <span>Total</span>
                <span style={{ color: 'var(--primary)' }}>{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="card">
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Delivery Address</h2>
            {order.shippingAddress ? (
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{order.shippingAddress.fullName}</div>
                <div>{order.shippingAddress.street}</div>
                {order.shippingAddress.landmark && <div>Near {order.shippingAddress.landmark}</div>}
                <div>{order.shippingAddress.city}, {order.shippingAddress.state}</div>
                <div style={{ fontWeight: 700, marginTop: 4 }}>PIN: {order.shippingAddress.pincode}</div>
                <div style={{ marginTop: 8, color: 'var(--text-muted)' }}>Phone: {order.shippingAddress.phone}</div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Address not available.</p>
            )}
          </div>
          
          {/* Support */}
          <div className="card" style={{ background: 'rgba(99,102,241,0.03)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 16 }}>📞</span> Need Help?</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>Have a problem with your order? Our support team is here to help.</p>
            <Link href="/contact" className="btn btn-primary btn-sm" style={{ width: '100%' }}>Contact Support</Link>
          </div>
        </div>
      </div>

      {/* Action Modal (Cancel/Return) */}
      {actionModal && (
        <div className="modal-overlay" onClick={() => setActionModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>{actionModal === 'cancel' ? 'Request Cancellation' : 'Request Return'}</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              {actionModal === 'cancel' 
                ? 'Are you sure you want to cancel this order? Please tell us why.'
                : 'Want to return your items? Let us know the issue and our team will review the request.'}
            </p>
            <form onSubmit={handleActionSubmit}>
              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea 
                  className="form-input" 
                  rows={4} 
                  required 
                  placeholder={actionModal === 'cancel' ? "E.g. Ordered by mistake, found a better price..." : "E.g. Item defective, not as described..."}
                  value={actionReason} 
                  onChange={e => setActionReason(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActionModal(null)} disabled={actionSubmitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={actionSubmitting}>
                  {actionSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .responsive-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
