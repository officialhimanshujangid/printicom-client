'use client';

import { useEffect, useState } from 'react';
import useAuthStore from '@/store/authStore';
import api from '@/lib/api';

export default function AddressesPage() {
  const { user, isAuthenticated, openAuthModal } = useAuthStore();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: user?.name || '', phone: user?.phone || '',
    street: '', city: '', state: '', pincode: '', landmark: '', label: 'Home'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && !newAddress.fullName) {
      setNewAddress(prev => ({ ...prev, fullName: user.name || '', phone: user.phone || '' }));
    }
  }, [user]);

  const load = async () => {
    try {
      const { data } = await api.get('/addresses');
      setAddresses(data?.data?.addresses || data?.data || []);
    } catch {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    load();
  }, [isAuthenticated]);

  const fetchCityState = async (pin) => {
    if (pin.length !== 6) return;
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (data[0].Status === 'Success') {
        const info = data[0].PostOffice[0];
        setNewAddress(prev => ({ ...prev, city: info.District, state: info.State }));
      }
    } catch {}
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/addresses', { ...newAddress, isDefault: addresses.length === 0 });
      setShowAddForm(false);
      setNewAddress({ fullName: user?.name || '', phone: user?.phone || '', street: '', city: '', state: '', pincode: '', landmark: '', label: 'Home' });
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add address');
    } finally {
      setSaving(false);
    }
  };

  const makeDefault = async (id) => {
    try {
      await api.patch(`/addresses/${id}/set-default`);
      await load();
    } catch {}
  };

  const remove = async (id) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await api.delete(`/addresses/${id}`);
      await load();
    } catch {}
  };

  if (!isAuthenticated) {
    return (
      <div className="container section">
        <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
          <h1 className="section-title" style={{ fontSize: '1.3rem', marginBottom: 10 }}>Addresses</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
            Sign in to manage your delivery addresses.
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
          <h1 className="section-title">My Addresses</h1>
        </div>
        {!showAddForm && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(true)}>
            + Add New Address
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showAddForm ? '380px 1fr' : '1fr', gap: 32 }}>
        {showAddForm && (
          <div className="card">
            <h2 className="section-title" style={{ fontSize: '1.1rem', marginBottom: 16 }}>New Address</h2>
            <form onSubmit={handleAdd} className="form-grid" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Label</label>
                <select className="form-select" value={newAddress.label} onChange={e => setNewAddress({ ...newAddress, label: e.target.value })}>
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Office">Office</option>
                  <option value="Gift">Gift</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={newAddress.fullName} onChange={e => setNewAddress({ ...newAddress, fullName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={newAddress.phone} onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Pincode</label>
                <input className="form-input" value={newAddress.pincode} onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setNewAddress({ ...newAddress, pincode: val });
                  if (val.length === 6) fetchCityState(val);
                }} required />
              </div>
              <div className="form-group">
                <label className="form-label">Street Address</label>
                <input className="form-input" value={newAddress.street} onChange={e => setNewAddress({ ...newAddress, street: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input className="form-input" value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Landmark</label>
                <input className="form-input" value={newAddress.landmark} onChange={e => setNewAddress({ ...newAddress, landmark: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Address'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          {loading ? (
            <p>Loading addresses…</p>
          ) : addresses.length === 0 ? (
            <div className="empty-state">
              <h3 className="empty-title">No saved addresses</h3>
              <p className="empty-desc">You haven't added any delivery addresses yet.</p>
              {!showAddForm && (
                <button className="btn btn-primary" onClick={() => setShowAddForm(true)} style={{ marginTop: 20 }}>
                  Add Your First Address
                </button>
              )}
            </div>
          ) : (
            <ul className="address-list">
              {addresses.map((a) => (
                <li key={a._id} className="address-item">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="badge badge-default" style={{ fontSize: '0.7rem' }}>{a.label}</span>
                      {a.isDefault && <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>Default</span>}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{a.fullName}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{a.phone}</div>
                    <div style={{ fontSize: 13, marginTop: 8, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {a.street}, {a.landmark && `${a.landmark}, `}
                      {a.city}, {a.state} - {a.pincode}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 120 }}>
                    {!a.isDefault && (
                      <button className="btn btn-outline btn-sm" onClick={() => makeDefault(a._id)}>
                        Set Default
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => remove(a._id)}>
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

