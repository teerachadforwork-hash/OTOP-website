import api from './api';

export const getPayments = async () => {
  const response = await api.get('/payments/');
  return response.data;
};

export const createPayment = async (orderId, amount, slipFile, paymentMethod = 'promptpay') => {
  const formData = new FormData();
  formData.append('order_id', orderId);
  formData.append('amount', amount);
  formData.append('payment_method', paymentMethod);
  if (slipFile) {
    formData.append('slip', slipFile);
  }
  const response = await api.post('/payments/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const verifyPaymentApi = async (paymentId, approved) => {
  const response = await api.put(`/payments/${paymentId}/verify`, { approved });
  return response.data;
};
