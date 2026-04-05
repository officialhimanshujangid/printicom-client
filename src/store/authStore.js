'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import api from '@/lib/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      showAuthModal: false,
      authModalTab: 'login',

      openAuthModal: (tab = 'login') => set({ showAuthModal: true, authModalTab: tab }),
      closeAuthModal: () => set({ showAuthModal: false }),

      setAuth: (user, token, refreshToken) => {
        Cookies.set('printicom_token', token, { expires: 7, sameSite: 'lax' });
        if (refreshToken) Cookies.set('printicom_refresh', refreshToken, { expires: 30, sameSite: 'lax' });
        set({ user, token, isAuthenticated: true });
      },

      logout: async () => {
        try { await api.post('/auth/logout'); } catch { /* ignore */ }
        Cookies.remove('printicom_token');
        Cookies.remove('printicom_refresh');
        set({ user: null, token: null, isAuthenticated: false });
      },

      fetchProfile: async () => {
        try {
          const { data } = await api.get('/auth/profile');
          set({ user: data.data?.user || data.data, isAuthenticated: true });
        } catch {
          set({ user: null, isAuthenticated: false });
        }
      },

      requireAuth: (action) => {
        const { isAuthenticated, openAuthModal } = get();
        if (!isAuthenticated) { openAuthModal('login'); return false; }
        if (action) action();
        return true;
      },
    }),
    {
      name: 'printicom-auth',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
    }
  )
);

export default useAuthStore;
