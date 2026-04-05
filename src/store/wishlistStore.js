'use client';
import { create } from 'zustand';
import api from '@/lib/api';
import useAuthStore from './authStore';

const useWishlistStore = create((set, get) => ({
  items: [],
  isLoading: false,
  hasFetched: false,

  fetchWishlist: async (force = false) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) return;
    if (get().hasFetched && !force) return;

    set({ isLoading: true });
    try {
      const { data } = await api.get('/wishlist');
      set({ items: data.data?.wishlist?.products || [], hasFetched: true });
    } catch {
      set({ hasFetched: false });
    } finally {
      set({ isLoading: false });
    }
  },

  toggle: async (productId) => {
    const { requireAuth } = useAuthStore.getState();
    if (!requireAuth()) return;
    try {
      const { data } = await api.post('/wishlist/toggle', { productId });
      await get().fetchWishlist(true);
      return data;
    } catch {}
  },

  isWishlisted: (productId) => {
    return get().items.some((item) => (item.product?._id || item.product || item._id || item) === productId);
  },
}));

export default useWishlistStore;
