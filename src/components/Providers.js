'use client';
import { useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import useCartStore from '@/store/cartStore';
import useWishlistStore from '@/store/wishlistStore';
import useSettingsStore from '@/store/settingsStore';
import Cookies from 'js-cookie';

export default function Providers({ children }) {
  const { fetchProfile, isAuthenticated } = useAuthStore();
  const { fetchCart } = useCartStore();
  const { fetchWishlist } = useWishlistStore();
  const { fetchSettings } = useSettingsStore();

  useEffect(() => {
    fetchSettings(); // Fetch global settings immediately
    const token = Cookies.get('printicom_token');
    if (token) {
      fetchProfile().then(() => {
        fetchCart();
        fetchWishlist();
      });
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
      fetchWishlist();
    }
  }, [isAuthenticated]);

  return <>{children}</>;
}
