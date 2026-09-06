import api from '../services/api';

export const getAdminSummary = async () => {
  const response = await api.get('/dashboard/admin/summary');
  return response.data;
};

export const getSellerSummary = async (sellerId) => {
  const response = await api.get(`/dashboard/seller/${sellerId}/summary`);
  return response.data;
};
