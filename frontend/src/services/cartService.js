import api from './api';

export const getCart = async () => {
  const response = await api.get('/cart/');
  return response.data;
};

export const getAdminCarts = async () => {
  const response = await api.get('/cart/admin');
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

export const addToCart = async (itemData) => {
  const response = await api.post('/cart/', itemData);
  return response.data;
};

export const updateCartItem = async (itemId, quantity) => {
  const response = await api.put(`/cart/${itemId}`, { quantity });
  return response.data;
};

export const removeCartItem = async (itemId) => {
  await api.delete(`/cart/${itemId}`);
};

export const clearCartApi = async () => {
  await api.delete('/cart/');
};
