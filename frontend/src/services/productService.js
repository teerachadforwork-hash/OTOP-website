import api from './api';

export const getProducts = async (skip = 0, limit = 100, extra = {}) => {
  const response = await api.get('/products/', { params: { skip, limit, ...extra } });
  return response.data;
};

export const getProduct = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const getMyProducts = async () => {
  const response = await api.get('/products/mine');
  return response.data;
};

export const updateProductStatusApi = async (id, status) => {
  const response = await api.put(`/products/${id}/status`, { status });
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await api.post('/products/', productData);
  return response.data;
};

export const updateProductApi = async (id, productData) => {
  const response = await api.put(`/products/${id}`, productData);
  return response.data;
};

export const deleteProductApi = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};
