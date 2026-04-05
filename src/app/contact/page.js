'use client';

import { useState } from 'react';
import api from '@/lib/api';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      const payload = {
        name: form.name,
        email: form.email,
        subject: form.subject || 'General query',
        message: form.message,
      };
      await api.post('/contact/submit', payload);
      setSuccess('Your message has been sent! Our team will get back to you soon.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <div className="section-tag">Support</div>
          <h1 className="section-title">Contact Us</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>
            Have a question about your order or need help? Send us a message.
          </p>
        </div>
      </div>

      <div className="page-grid">
        <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 540 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="c-name">Full Name</label>
            <input
              id="c-name"
              className="form-input"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="c-email">Email</label>
            <input
              id="c-email"
              type="email"
              className="form-input"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="c-subject">Subject</label>
            <input
              id="c-subject"
              className="form-input"
              value={form.subject}
              onChange={(e) => setField('subject', e.target.value)}
              placeholder="Order issue, product query, feedback…"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="c-message">Message</label>
            <textarea
              id="c-message"
              className="form-input"
              style={{ minHeight: 140, resize: 'vertical' }}
              value={form.message}
              onChange={(e) => setField('message', e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Sending…' : 'Send Message'}
          </button>
          {success && (
            <p style={{ color: '#4CAF50', fontSize: '0.9rem', marginTop: 10 }}>{success}</p>
          )}
          {error && (
            <p style={{ color: '#f44336', fontSize: '0.9rem', marginTop: 10 }}>{error}</p>
          )}
        </form>

        <aside className="card" style={{ maxWidth: 420 }}>
          <h2 className="section-title" style={{ fontSize: '1.05rem', marginBottom: 10 }}>
            Other ways to reach us
          </h2>
          <ul className="footer-links">
            <li>Email: support@printicom.in</li>
            <li>Phone: +91 98765 43210</li>
            <li>Location: Jaipur, Rajasthan, India</li>
          </ul>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: 12 }}>
            Support timings: 10:00 AM – 7:00 PM, Mon–Sat (IST)
          </p>
        </aside>
      </div>
    </div>
  );
}

