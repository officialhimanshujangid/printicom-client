'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import useAuthStore from './authStore';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      coupon: null,
      isLoading: false,

      fetchCart: async () => {
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) return;
        try {
          set({ isLoading: true });
          const { data } = await api.get('/cart');
          const cart = data.data?.cart || data.data || {};
          set({
            items: cart.items || [],
            total: cart.total || 0,
            coupon: cart.appliedCoupon || null,
            isLoading: false,
          });
        } catch { set({ isLoading: false }); }
      },

      addToCart: async (productId, quantity = 1, variantId = null, customization = {}) => {
        const { requireAuth } = useAuthStore.getState();
        if (!requireAuth()) return false;
        try {
          await api.post('/cart/add', { productId, quantity, variantId, customization });
          await get().fetchCart();
          return true;
        } catch (e) {
          return e.response?.data?.message || 'Failed to add to cart';
        }
      },

      removeItem: async (itemId) => {
        try {
          await api.delete(`/cart/item/${itemId}`);
          await get().fetchCart();
        } catch {}
      },

      updateItem: async (itemId, quantity) => {
        try {
          await api.put(`/cart/item/${itemId}`, { quantity });
          await get().fetchCart();
        } catch {}
      },

      clearCart: async () => {
        try {
          await api.delete('/cart/clear');
          set({ items: [], total: 0, coupon: null });
        } catch {}
      },

      applyCoupon: async (code) => {
        try {
          const { data } = await api.post('/cart/apply-coupon', { code });
          await get().fetchCart();
          return { success: true, message: data.message };
        } catch (e) {
          return { success: false, message: e.response?.data?.message || 'Invalid coupon' };
        }
      },

      removeCoupon: async () => {
        try {
          await api.delete('/cart/remove-coupon');
          await get().fetchCart();
        } catch {}
      },

      get cartCount() {
        return get().items.reduce((acc, i) => acc + i.quantity, 0);
      },
    }),
    {
      name: 'printicom-cart',
      partialize: () => ({}),
    }
  )
);

export default useCartStore;
