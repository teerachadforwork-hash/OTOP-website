import api from './api';

export const getProductReviews = async (productId) => {
  const res = await api.get(`/api/reviews/product/${productId}`);
  return res.data;
};

export const createReviewApi = async (reviewData) => {
  try {
    const res = await api.post('/api/reviews/', reviewData);
    return res.data;
  } catch (err) {
    throw err;
  }
};
