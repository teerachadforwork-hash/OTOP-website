import api from './api';

export const getOrders = async () => {
  const response = await api.get('/orders/');
  return response.data;
};

export const createOrder = async (orderData) => {
  const response = await api.post('/orders/', orderData);
  return response.data;
};

export const updateOrderStatusApi = async (orderId, payload) => {
  const response = await api.put(`/orders/${orderId}/status`, payload);
  return response.data;
};

export const getOrderInvoice = async (orderId) => {
  const response = await api.get(`/orders/${orderId}/invoice`);
  return response.data;
};

export const downloadOrderInvoiceHtml = async (orderId, filename = 'invoice.html') => {
  const response = await api.get(`/orders/${orderId}/invoice.html`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const openOrderInvoiceHtml = async (orderId) => {
  // Open window synchronously to avoid mobile popup blockers
  const newWindow = window.open('about:blank', '_blank');
  try {
    const response = await api.get(`/orders/${orderId}/invoice.html`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/html' }));
    if (newWindow) {
      newWindow.location.href = url;
    } else {
      // Fallback if window.open was totally blocked
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  } catch (err) {
    if (newWindow) newWindow.close();
    throw err;
  }
};
