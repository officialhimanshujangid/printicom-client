export function formatPrice(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

export function getDiscountPercent(base, disc) {
  if (!base || !disc || disc >= base) return 0;
  return Math.round(((base - disc) / base) * 100);
}

export function truncate(str, len = 80) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export function getImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return url;
}

export function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = [
    { label: 'year', s: 31536000 }, { label: 'month', s: 2592000 },
    { label: 'week', s: 604800 }, { label: 'day', s: 86400 },
    { label: 'hour', s: 3600 }, { label: 'minute', s: 60 },
  ];
  for (const i of intervals) {
    const c = Math.floor(seconds / i.s);
    if (c >= 1) return `${c} ${i.label}${c > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}

export const ORDER_STATUS_MAP = {
  pending: { label: 'Pending', color: '#FFB347' },
  confirmed: { label: 'Confirmed', color: '#4FC3F7' },
  processing: { label: 'Processing', color: '#7C4DFF' },
  ready_to_ship: { label: 'Ready to Ship', color: '#26C6DA' },
  shipped: { label: 'Shipped', color: '#42A5F5' },
  delivered: { label: 'Delivered', color: '#66BB6A' },
  cancelled: { label: 'Cancelled', color: '#EF5350' },
  refund_initiated: { label: 'Refund Initiated', color: '#FFA726' },
  refunded: { label: 'Refunded', color: '#AB47BC' },
  payment_failed: { label: 'Payment Failed', color: '#EF5350' },
};
