'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import useCartStore from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';

export default function CartSidebar() {
  const [open, setOpen] = useState(false);
  const { items, removeItem, updateItem, isLoading } = useCartStore();

  useEffect(() => {
    const toggle = () => setOpen((p) => !p);
    document.addEventListener('toggleCart', toggle);
    return () => document.removeEventListener('toggleCart', toggle);
  }, []);

  const subtotal = items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const shipping = subtotal > 0 && subtotal < 499 ? 49 : 0;
  const total = subtotal + shipping;

  if (!open) return null;

  return (
    <>
      <div className="modal-overlay" style={{ zIndex: 7999 }} onClick={() => setOpen(false)} />
      <aside className="cart-sidebar" aria-label="Shopping cart">
        <div className="cart-header">
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700 }}>Your Cart</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>{items.length} {items.length === 1 ? 'item' : 'items'}</p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={() => setOpen(false)} aria-label="Close cart"><X size={20} /></button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon"><ShoppingBag size={32} /></div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>Your cart is empty</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Add some amazing products to your cart!</p>
            <Link href="/products" className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>Shop Now</Link>
          </div>
        ) : (
          <>
            <div className="cart-items-list">
              {items.map((item) => (
                <div key={item._id} className="cart-item">
                  <div className="cart-item-img">
                    {item.productSnapshot?.thumbnailImage ? (
                      <Image src={item.productSnapshot.thumbnailImage} alt={item.productSnapshot.name} width={72} height={72} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '1.5rem' }}>🛍</div>
                    )}
                  </div>
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.productSnapshot?.name}</div>
                    {item.variantName && <div className="cart-item-variant">{item.variantName}</div>}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                      <div className="qty-control">
                        <button className="qty-btn" onClick={() => item.quantity > 1 ? updateItem(item._id, item.quantity - 1) : removeItem(item._id)} aria-label="Decrease quantity"><Minus size={12} /></button>
                        <span className="qty-num">{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateItem(item._id, item.quantity + 1)} aria-label="Increase quantity"><Plus size={12} /></button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="cart-item-price">{formatPrice(item.unitPrice * item.quantity)}</span>
                        <button className="btn btn-ghost btn-icon" style={{ padding: 6 }} onClick={() => removeItem(item._id)} aria-label="Remove item"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              {subtotal < 499 && (
                <div style={{ background: 'rgba(255,179,71,0.08)', border: '1px solid rgba(255,179,71,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: '0.82rem', color: 'var(--accent)' }}>
                  🚚 Add {formatPrice(499 - subtotal)} more for FREE shipping!
                </div>
              )}
              <div className="summary-line"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              <div className="summary-line"><span>Shipping</span><span>{shipping === 0 ? <span style={{ color: '#66BB6A' }}>FREE</span> : formatPrice(shipping)}</span></div>
              <div className="summary-line total"><span>Total</span><span style={{ color: 'var(--primary)' }}>{formatPrice(total)}</span></div>
              <Link href="/checkout" className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={() => setOpen(false)}>
                Proceed to Checkout
              </Link>
              <button onClick={() => setOpen(false)} className="btn btn-ghost" style={{ width: '100%', marginTop: 8, fontSize: '0.85rem' }}>Continue Shopping</button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
