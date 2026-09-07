import api from './api';

export const getNews = async (includeDrafts = false) => {
  const response = await api.get('/news/', { params: includeDrafts ? { include_drafts: true } : {} });
  return response.data;
};

export const getNewsArticle = async (id) => {
  const response = await api.get(`/news/${id}`);
  return response.data;
};

export const getNewsComments = async (id) => {
  const response = await api.get(`/news/${id}/comments`);
  return response.data;
};

export const createNewsComment = async (id, content) => {
  const response = await api.post(`/news/${id}/comments`, { content });
  return response.data;
};

export const deleteNewsComment = async (newsId, commentId) => {
  await api.delete(`/news/${newsId}/comments/${commentId}`);
};

export const createNews = async (payload) => {
  const response = await api.post('/news/', payload);
  return response.data;
};

export const updateNews = async (id, payload) => {
  const response = await api.put(`/news/${id}`, payload);
  return response.data;
};

export const uploadNewsCover = async (id, file) => {
  const formData = new FormData();
  formData.append('cover', file);
  const response = await api.post(`/news/${id}/cover`, formData);
  return response.data;
};

export const deleteNews = async (id) => {
  await api.delete(`/news/${id}`);
};
