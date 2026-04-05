import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';

const LINKS = {
  shop: [
    { label: 'All Products', href: '/products' },
    { label: 'Photo Mugs', href: '/products?type=mug' },
    { label: 'Calendars', href: '/products?type=calendar' },
    { label: 'Photo Prints', href: '/products?type=photo_print' },
    { label: 'Canvas Prints', href: '/products?type=canvas_print' },
    { label: 'Pillows', href: '/products?type=pillow' },
  ],
  help: [
    { label: 'Track Your Order', href: '/track-order' },
    { label: 'FAQs', href: '/faqs' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Shipping Policy', href: '/shipping-policy' },
    { label: 'Return Policy', href: '/return-policy' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms of Service', href: '/terms-of-service' },
    { label: 'Refund Policy', href: '/refund-policy' },
  ],
};

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div>
            <div className="header-logo" style={{ fontSize: '1.6rem', marginBottom: 12 }}>Printicom</div>
            <p className="footer-brand-desc">
              India's most loved personalized gifting platform. Turn your memories into stunning prints, mugs, calendars and more. Fast delivery, premium quality.
            </p>
            <div className="footer-social">
              {[
                { label: 'Instagram', text: 'IG', href: '#' },
                { label: 'Facebook', text: 'FB', href: '#' },
                { label: 'Twitter', text: 'TW', href: '#' },
                { label: 'YouTube', text: 'YT', href: '#' },
              ].map((s) => (
                <a key={s.label} href={s.href} className="social-icon" aria-label={s.label} target="_blank" rel="noopener noreferrer">
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{s.text}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <div className="footer-heading">Shop</div>
            <div className="footer-links">
              {LINKS.shop.map((l) => (
                <Link key={l.href} href={l.href} className="footer-link">{l.label}</Link>
              ))}
            </div>
          </div>

          {/* Help */}
          <div>
            <div className="footer-heading">Customer Help</div>
            <div className="footer-links">
              {LINKS.help.map((l) => (
                <Link key={l.href} href={l.href} className="footer-link">{l.label}</Link>
              ))}
            </div>
            <div style={{ marginTop: 20 }} className="footer-heading">Legal</div>
            <div className="footer-links">
              {LINKS.legal.map((l) => (
                <Link key={l.href} href={l.href} className="footer-link">{l.label}</Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <div className="footer-heading">Contact Us</div>
            <div className="footer-links">
              <a href="mailto:support@printicom.in" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={14} /> support@printicom.in
              </a>
              <a href="tel:+919876543210" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Phone size={14} /> +91 98765 43210
              </a>
              <span className="footer-link" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <MapPin size={14} style={{ marginTop: 3, flexShrink: 0 }} /> Jaipur, Rajasthan, India
              </span>
            </div>
            <div style={{ marginTop: 20 }}>
              <div className="footer-heading">Secure Payments</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {['Razorpay', 'UPI', 'Cards', 'COD'].map((p) => (
                  <span key={p} style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Printicom. All rights reserved.</span>
          <span>Made with ❤️ in India</span>
          <span style={{ display: 'flex', gap: 16 }}>
            {LINKS.legal.map((l) => (
              <Link key={l.href} href={l.href} className="footer-link">{l.label}</Link>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
