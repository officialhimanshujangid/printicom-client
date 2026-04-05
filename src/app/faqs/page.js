'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function FAQsPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/faqs');
        if (!mounted) return;
        setFaqs(data?.data?.faqs || data?.data || []);
      } catch {
        if (mounted) setFaqs([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <div className="section-tag">Help</div>
          <h1 className="section-title">Frequently Asked Questions</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>
            Answers to common questions about orders, shipping, returns and more.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <p>Loading FAQs…</p>
        </div>
      ) : faqs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ fontSize: '2.5rem' }}>❓</div>
          <h3 className="empty-title">No FAQs found</h3>
          <p className="empty-desc">Please contact support if you have any questions.</p>
        </div>
      ) : (
        <div className="faq-list">
          {faqs.map((f) => (
            <details key={f._id} className="faq-item">
              <summary className="faq-question">{f.question}</summary>
              <div className="faq-answer">
                <p>{f.answer}</p>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

