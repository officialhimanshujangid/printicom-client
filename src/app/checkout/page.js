'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import useCartStore from '@/store/cartStore';
import useAuthStore from '@/store/authStore';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  {
    id: 'bank_transfer',
    label: 'UPI / Bank Transfer',
    icon: '💳',
    badge: 'Recommended',
    badgeColor: '#66BB6A',
    description: 'Pay via UPI, NEFT or IMPS. Order confirmed after payment receipt (2–4 hrs).',
    free: true,
  },
  {
    id: 'cod',
    label: 'Cash on Delivery',
    icon: '💵',
    badge: null,
    description: 'Pay in cash when your order arrives at your doorstep.',
    free: true,
  },
  {
    id: 'razorpay',
    label: 'Razorpay (Cards / Netbanking)',
    icon: '⚡',
    badge: 'Coming Soon',
    badgeColor: '#818cf8',
    description: 'Pay securely using Credit/Debit cards, Netbanking or UPI via Razorpay.',
    disabled: !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, coupon, fetchCart, applyCoupon, removeCoupon } = useCartStore();
  const { user, isAuthenticated, requireAuth } = useAuthStore();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [placing, setPlacing] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [customerNote, setCustomerNote] = useState('');
  const [newAddress, setNewAddress] = useState({
    fullName: '', phone: '', street: '', city: '', state: '', pincode: '', landmark: '', label: 'Home', country: 'India'
  });

  useEffect(() => {
    if (user && !newAddress.fullName) {
      setNewAddress(prev => ({ ...prev, fullName: user.name || '', phone: user.phone || '' }));
    }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) { requireAuth(); return; }
    fetchCart();
    (async () => {
      try {
        const { data } = await api.get('/addresses');
        const list = data?.data?.addresses || data?.data || [];
        setAddresses(list);
        if (list.length === 0) setShowAddForm(true);
        const def = list.find(a => a.isDefault);
        if (def) setSelectedAddress(def._id);
        else if (list.length > 0) setSelectedAddress(list[0]._id);
      } catch { setAddresses([]); }
    })();
  }, [isAuthenticated]);

  const fetchCityState = async (pin) => {
    if (pin.length !== 6) return;
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (data[0].Status === 'Success') {
        const info = data[0].PostOffice[0];
        setNewAddress(prev => ({ ...prev, city: info.District, state: info.State, country: 'India' }));
      }
    } catch { }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/addresses', { ...newAddress, isDefault: addresses.length === 0 });
      const added = data.data?.address || data.data;
      setAddresses([added, ...addresses]);
      setSelectedAddress(added._id);
      setShowAddForm(false);
      toast.success('Address saved!');
    } catch (err) { setError(err.response?.data?.message || 'Failed to add address'); }
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    setCouponError('');
    const res = await applyCoupon(couponInput);
    if (!res.success) setCouponError(res.message);
    else { setCouponInput(''); toast.success('Coupon applied!'); }
    setApplyingCoupon(false);
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) { requireAuth(); return; }
    if (!items.length) { setError('Your cart is empty.'); return; }
    if (!selectedAddress) { setError('Please select a delivery address.'); return; }
    if (!paymentMethod) { setError('Please select a payment method.'); return; }

    setError('');
    setPlacing(true);
    try {
      const { data } = await api.post('/orders', { addressId: selectedAddress, paymentMethod, customerNote });
      const order = data.data?.order || data.data;
      const orderId = order?._id;

      if (paymentMethod === 'razorpay' && data.data?.razorpayOrder) {
        // Load Razorpay SDK
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        document.body.appendChild(script);
        script.onload = () => {
          const rzp = new window.Razorpay({
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: data.data.razorpayOrder.amount,
            currency: 'INR',
            name: 'Printicom',
            description: `Order #${order.orderNumber}`,
            order_id: data.data.razorpayOrder.id,
            handler: async (response) => {
              try {
                await api.post('/orders/verify-payment', {
                  orderId,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });
                router.push(`/order-confirmation?orderId=${orderId}&method=razorpay`);
              } catch { toast.error('Payment verification failed. Contact support.'); }
            },
            prefill: { name: user?.name, email: user?.email, contact: user?.phone },
            theme: { color: '#FF6B35' },
          });
          rzp.open();
        };
      } else {
        router.push(`/order-confirmation?orderId=${orderId}&method=${paymentMethod}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  const subtotal = items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const shipping = subtotal > 0 && subtotal < 499 ? 49 : 0;
  const discountAmount = coupon?.discountAmount || 0;
  const grandTotal = Math.max(0, subtotal + shipping - discountAmount);

  return (
    <div className="container section-sm" style={{ paddingTop: 40 }}>
      <div style={{ marginBottom: 32 }}>
        <div className="section-tag">Secure Checkout</div>
        <h1 className="section-title" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginTop: 6 }}>Complete Your Order</h1>
      </div>

      {!isAuthenticated ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
          <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>Please sign in to proceed to checkout.</p>
          <button className="btn btn-primary" onClick={() => requireAuth()}>Sign In</button>
        </div>
      ) : (
        <div className="page-grid" style={{ alignItems: 'start' }}>

          {/* ─── LEFT COLUMN ────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Delivery Address */}
            <section style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-heading)', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>1</span>
                  Delivery Address
                </h2>
                <button className="btn btn-secondary btn-sm" onClick={() => { setShowAddForm(!showAddForm); setError(''); }}>
                  {showAddForm ? 'Cancel' : '+ Add New'}
                </button>
              </div>

              {showAddForm ? (
                <form onSubmit={handleAddAddress} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Full Name *</label>
                    <input className="form-input" value={newAddress.fullName} onChange={e => setNewAddress({ ...newAddress, fullName: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input className="form-input" value={newAddress.phone} onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pincode *</label>
                    <input className="form-input" placeholder="6 digits" value={newAddress.pincode} onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setNewAddress({ ...newAddress, pincode: v }); if (v.length === 6) fetchCityState(v); }} required />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Street Address *</label>
                    <input className="form-input" value={newAddress.street} onChange={e => setNewAddress({ ...newAddress, street: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input className="form-input" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State *</label>
                    <input className="form-input" value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} required />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Landmark (optional)</label>
                    <input className="form-input" value={newAddress.landmark} onChange={e => setNewAddress({ ...newAddress, landmark: e.target.value })} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Save Address</button>
                  </div>
                </form>
              ) : addresses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>📍</div>
                  <p style={{ fontSize: '0.9rem', marginBottom: 14 }}>No saved addresses yet.</p>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(true)}>Add Your First Address</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {addresses.map(addr => (
                    <div
                      key={addr._id}
                      onClick={() => setSelectedAddress(addr._id)}
                      style={{
                        cursor: 'pointer', padding: '14px 16px', borderRadius: 12, display: 'flex', gap: 12, alignItems: 'flex-start',
                        border: `1.5px solid ${selectedAddress === addr._id ? 'var(--primary)' : 'var(--border)'}`,
                        background: selectedAddress === addr._id ? 'rgba(255,107,53,0.06)' : 'var(--bg-card)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${selectedAddress === addr._id ? 'var(--primary)' : 'var(--border)'}`, flexShrink: 0, marginTop: 2, background: selectedAddress === addr._id ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedAddress === addr._id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{addr.fullName}</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{addr.phone}</span>
                          {addr.label && <span style={{ fontSize: '0.68rem', padding: '1px 8px', borderRadius: 4, background: 'rgba(255,107,53,0.1)', color: 'var(--primary)', fontWeight: 600 }}>{addr.label}</span>}
                          {addr.isDefault && <span style={{ fontSize: '0.68rem', padding: '1px 8px', borderRadius: 4, background: 'rgba(102,187,106,0.1)', color: '#66BB6A', fontWeight: 600 }}>Default</span>}
                        </div>
                        <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          {addr.street}{addr.landmark ? `, ${addr.landmark}` : ''}, {addr.city}, {addr.state} — {addr.pincode}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Payment Method */}
            <section style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>2</span>
                Payment Method
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {PAYMENT_METHODS.map(method => (
                  <div
                    key={method.id}
                    onClick={() => !method.disabled && setPaymentMethod(method.id)}
                    style={{
                      cursor: method.disabled ? 'not-allowed' : 'pointer',
                      padding: '16px 18px', borderRadius: 12, display: 'flex', gap: 14, alignItems: 'flex-start',
                      border: `1.5px solid ${paymentMethod === method.id ? 'var(--primary)' : 'var(--border)'}`,
                      background: paymentMethod === method.id ? 'rgba(255,107,53,0.05)' : 'var(--bg-card)',
                      opacity: method.disabled ? 0.5 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${paymentMethod === method.id ? 'var(--primary)' : 'var(--border)'}`, flexShrink: 0, marginTop: 2, background: paymentMethod === method.id ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {paymentMethod === method.id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1rem' }}>{method.icon}</span>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{method.label}</span>
                        {method.badge && (
                          <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 4, background: `${method.badgeColor}1a`, color: method.badgeColor, fontWeight: 700, border: `1px solid ${method.badgeColor}33` }}>
                            {method.badge}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{method.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* UPI/Bank details inline preview */}
              {paymentMethod === 'bank_transfer' && (
                <div style={{ marginTop: 16, padding: 16, background: 'rgba(99,102,241,0.06)', borderRadius: 12, border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.82rem' }}>
                  <div style={{ fontWeight: 700, color: '#818cf8', marginBottom: 8 }}>🔒 Your payment details will be shown after order confirmation</div>
                  <div style={{ color: 'var(--text-muted)' }}>You'll receive UPI ID and bank account details on the next page.</div>
                </div>
              )}
            </section>

            {/* Note */}
            <section style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>3</span>
                Order Note (optional)
              </h2>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Special instructions, customization notes, delivery preferences..."
                value={customerNote}
                onChange={e => setCustomerNote(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </section>
          </div>

          {/* ─── RIGHT COLUMN — ORDER SUMMARY ── */}
          <aside>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, position: 'sticky', top: 90 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: 20 }}>Order Summary</h2>

              {/* Item list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                {items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 8, background: 'var(--bg-card)', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' }}>
                      {item.image && <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>x{item.quantity}</div>
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>{formatPrice(item.unitPrice * item.quantity)}</div>
                  </div>
                ))}
              </div>

              {/* Pricing rows */}
              {[
                { label: `Items (${items.length})`, value: formatPrice(subtotal) },
                { label: 'Shipping', value: shipping ? formatPrice(shipping) : 'FREE', color: shipping ? undefined : '#66BB6A' },
                ...(discountAmount > 0 ? [{ label: `Coupon (${coupon?.code})`, value: `-${formatPrice(discountAmount)}`, color: '#66BB6A' }] : []),
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ color: color || 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
                </div>
              ))}

              {/* Coupon input */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed var(--border)' }}>
                {coupon?.code ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(102,187,106,0.08)', borderRadius: 10, border: '1px solid rgba(102,187,106,0.25)' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Applied</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#66BB6A' }}>{coupon.code}</div>
                    </div>
                    <button onClick={async () => { await removeCoupon(); toast.success('Coupon removed'); }} style={{ fontSize: '0.78rem', padding: '4px 10px', borderRadius: 6, background: 'rgba(239,83,80,0.1)', color: '#EF5350', border: '1px solid rgba(239,83,80,0.2)' }}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>🏷️ Coupon Code</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input className="form-input" placeholder="Enter code" style={{ height: 38, textTransform: 'uppercase', fontSize: '0.85rem' }} value={couponInput} onChange={e => setCouponInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()} />
                      <button className="btn btn-secondary btn-sm" onClick={handleApplyCoupon} disabled={applyingCoupon || !couponInput.trim()} style={{ whiteSpace: 'nowrap' }}>
                        {applyingCoupon ? '...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && <p style={{ color: '#EF5350', fontSize: '0.78rem', marginTop: 6 }}>{couponError}</p>}
                  </div>
                )}
              </div>

              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 0 20px', paddingTop: 16, borderTop: '1px solid var(--border)', fontWeight: 800, fontSize: '1.15rem' }}>
                <span>To Pay</span>
                <span style={{ color: 'var(--primary)' }}>{formatPrice(grandTotal)}</span>
              </div>

              {/* CTA */}
              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px 0', fontSize: '0.95rem', fontWeight: 700, borderRadius: 12 }}
                disabled={placing || !items.length || !selectedAddress}
                onClick={handlePlaceOrder}
              >
                {placing
                  ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Processing…</span>
                  : paymentMethod === 'bank_transfer' ? '📤 Place Order & View Payment Details'
                  : paymentMethod === 'cod' ? '✅ Place Order (Pay on Delivery)'
                  : '⚡ Pay Now with Razorpay'}
              </button>

              {error && <p style={{ color: '#f44336', fontSize: '0.84rem', marginTop: 10, textAlign: 'center' }}>{error}</p>}

              {/* Trust badges */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 20, flexWrap: 'wrap' }}>
                {['🔒 Secure', '📦 Fast Delivery', '↩️ Easy Returns'].map(b => (
                  <span key={b} style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>{b}</span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .page-grid { display: grid; grid-template-columns: 1fr 360px; gap: 24px; align-items: start; }
        @media (max-width: 768px) { .page-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
