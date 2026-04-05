'use client';
import { create } from 'zustand';
import api from '@/lib/api';

const useSettingsStore = create((set) => ({
  settings: null,
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/settings/public');
      set({ settings: data.data?.settings || data.data });
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useSettingsStore;
