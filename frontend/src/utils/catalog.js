export const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=600&auto=format&fit=crop&q=80';

export const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'https://otop-website-api-hujf.onrender.com';

export const resolveMediaUrl = (url) => {
  if (!url) return PLACEHOLDER_IMAGE;
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads')) return `${API_BASE}${url}`;
  return url;
};

export const getProductImage = (product) => {
  if (!product) return PLACEHOLDER_IMAGE;
  return resolveMediaUrl(product.hero_image || product.image_url || PLACEHOLDER_IMAGE);
};

export const getCommunityImage = (community) => {
  if (!community) return PLACEHOLDER_IMAGE;
  return resolveMediaUrl(community.banner_image || community.cover_image || PLACEHOLDER_IMAGE);
};

export const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PAYMENT_VERIFICATION: 'payment_verification',
  PREPARING: 'preparing',
  SHIPPED: 'shipped',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const normalizeOrderStatus = (status) => {
  const raw = String(status || '').trim();
  const key = raw.toLowerCase().replace(/[\s-]+/g, '_');
  const aliases = {
    pending: ORDER_STATUS.PENDING_PAYMENT,
    pending_payment: ORDER_STATUS.PENDING_PAYMENT,
    payment_verification: ORDER_STATUS.PAYMENT_VERIFICATION,
    waiting_verification: ORDER_STATUS.PAYMENT_VERIFICATION,
    processing: ORDER_STATUS.PREPARING,
    preparing: ORDER_STATUS.PREPARING,
    shipped: ORDER_STATUS.SHIPPED,
    completed: ORDER_STATUS.COMPLETED,
    cancelled: ORDER_STATUS.CANCELLED,
    canceled: ORDER_STATUS.CANCELLED,
  };
  return aliases[key] || key;
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING_PAYMENT]: 'รอการชำระเงิน',
  [ORDER_STATUS.PAYMENT_VERIFICATION]: 'รอตรวจสอบสลิป',
  [ORDER_STATUS.PREPARING]: 'กำลังเตรียมจัดส่ง',
  [ORDER_STATUS.SHIPPED]: 'อยู่ระหว่างจัดส่ง',
  [ORDER_STATUS.COMPLETED]: 'สำเร็จแล้ว',
  [ORDER_STATUS.CANCELLED]: 'ยกเลิกแล้ว',
};

export const apiErrorMessage = (error, fallback = 'เกิดข้อผิดพลาด กรุณาลองใหม่') => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  return error?.message || fallback;
};
