import api from './api';

export const getCategories = async () => {
  const response = await api.get('/categories/');
  return response.data;
};

export const createCategory = async (payload) => {
  const response = await api.post('/categories/', payload);
  return response.data;
};

export const getAdminUsers = async () => {
  const response = await api.get('/api/auth/users');
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

export const setUserActive = async (userId, isActive) => {
  const response = await api.put(`/auth/users/${userId}/active`, { is_active: isActive });
  return response.data;
};

export const setUserRole = async (userId, role) => {
  const response = await api.put(`/auth/users/${userId}/role`, { role });
  return response.data;
};

export const adminDeleteUser = async (userId) => {
  const response = await api.delete(`/auth/users/${userId}`);
  return response.data;
};

export const deleteOwnAccount = async (password) => {
  const response = await api.delete('/auth/account', { data: { password } });
  return response.data;
};

export const updateCategory = async (id, payload) => {
  const response = await api.put(`/categories/${id}`, payload);
  return response.data;
};

export const deleteCategory = async (id) => {
  await api.delete(`/categories/${id}`);
};
