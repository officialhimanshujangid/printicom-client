import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor: attach token ─────────────────
api.interceptors.request.use((config) => {
  const token = Cookies.get('printicom_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response Interceptor: handle 401 ──────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = Cookies.get('printicom_refresh');
        if (refreshToken) {
          const { data } = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`,
            { refreshToken }
          );
          if (data?.data?.accessToken) {
            Cookies.set('printicom_token', data.data.accessToken, { expires: 7 });
            original.headers.Authorization = `Bearer ${data.data.accessToken}`;
            return api(original);
          }
        }
      } catch {
        Cookies.remove('printicom_token');
        Cookies.remove('printicom_refresh');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
