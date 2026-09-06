import api from './api';

export const getCommunities = async (skip = 0, limit = 100) => {
  const response = await api.get('/community/', { params: { skip, limit } });
  return response.data;
};

export const getCommunity = async (id) => {
  const response = await api.get(`/community/${id}`);
  return response.data;
};

export const createCommunity = async (communityData) => {
  const response = await api.post('/community/', communityData);
  return response.data;
};

export const updateCommunity = async (id, communityData) => {
  const response = await api.put(`/community/${id}`, communityData);
  return response.data;
};

export const uploadCommunityBanner = async (id, file) => {
  const formData = new FormData();
  formData.append('banner', file);
  const response = await api.post(`/community/${id}/banner`, formData);
  return response.data;
};

export const deleteCommunity = async (id) => {
  await api.delete(`/community/${id}`);
};
