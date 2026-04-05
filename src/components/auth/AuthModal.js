'use client';
import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Loader2 } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

export default function AuthModal() {
  const { showAuthModal, authModalTab, closeAuthModal, setAuth } = useAuthStore();
  const [tab, setTab] = useState(authModalTab);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => { setTab(authModalTab); }, [authModalTab]);

  if (!showAuthModal) return null;

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const validate = () => {
    const e = {};
    if (tab === 'register' && !form.name.trim()) e.name = 'Name is required';
    if (!form.email.includes('@')) e.email = 'Valid email required';
    if (form.password.length < 8) e.password = 'Min 8 characters';
    if (tab === 'register' && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) e.password = 'Must contain upper, lower & number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (tab === 'login') {
        const { data } = await api.post('/auth/login', { email: form.email, password: form.password });
        const { accessToken, refreshToken, user } = data.data;
        setAuth(user, accessToken, refreshToken);
        toast.success(`Welcome back, ${user.name}! 👋`);
        closeAuthModal();
      } else {
        const payload = { name: form.name, email: form.email, password: form.password };
        if (form.phone) payload.phone = form.phone;
        const { data } = await api.post('/auth/register', payload);
        toast.success('Account created! Please verify your email. 📧');
        setTab('login');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!form.email.includes('@')) { toast.error('Enter your email first'); return; }
    try {
      await api.post('/auth/forgot-password', { email: form.email });
      toast.success('Password reset link sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeAuthModal()} role="dialog" aria-modal="true" aria-label="Sign in or Register">
      <div className="modal">
        <button className="modal-close" onClick={closeAuthModal} aria-label="Close"><X size={16} /></button>
        <div className="modal-logo">Printicom</div>
        <p className="modal-subtitle">{tab === 'login' ? 'Welcome back! Sign in to continue.' : 'Create your account to get started.'}</p>

        <div className="auth-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'login'} className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>Sign In</button>
          <button role="tab" aria-selected={tab === 'register'} className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => setTab('register')}>Register</button>
        </div>

        <form onSubmit={submit} noValidate>
          {tab === 'register' && (
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label" htmlFor="auth-name">Full Name</label>
              <input id="auth-name" className={`form-input${errors.name ? ' error' : ''}`} placeholder="Your full name" value={form.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>
          )}
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label" htmlFor="auth-email">Email Address</label>
            <input id="auth-email" type="email" className={`form-input${errors.email ? ' error' : ''}`} placeholder="you@example.com" value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>
          {tab === 'register' && (
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label" htmlFor="auth-phone">Phone (Optional)</label>
              <input id="auth-phone" type="tel" className="form-input" placeholder="10-digit mobile" value={form.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" />
            </div>
          )}
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label" htmlFor="auth-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input id="auth-password" type={showPw ? 'text' : 'password'} className={`form-input${errors.password ? ' error' : ''}`} placeholder={tab === 'register' ? 'Min 8 chars, upper+lower+number' : '••••••••'} value={form.password} onChange={(e) => set('password', e.target.value)} autoComplete={tab === 'login' ? 'current-password' : 'new-password'} style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPw((p) => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none' }} aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password}</span>}
            {tab === 'login' && (
              <button type="button" onClick={handleForgot} style={{ alignSelf: 'flex-end', fontSize: '0.8rem', color: 'var(--primary)', background: 'none', marginTop: 6 }}>Forgot password?</button>
            )}
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading} id="auth-submit-btn">
            {loading ? <Loader2 size={18} className="spin" /> : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setTab(tab === 'login' ? 'register' : 'login')} style={{ color: 'var(--primary)', fontWeight: 600, background: 'none' }}>
            {tab === 'login' ? 'Register' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
