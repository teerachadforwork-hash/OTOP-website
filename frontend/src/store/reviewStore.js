import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getProductReviews, createReviewApi } from '../services/reviewService';

export const useReviewStore = create(devtools((set, get) => ({
  reviews: [],
  loading: false,

  fetchReviewsForProduct: async (productId) => {
    set({ loading: true });
    try {
      const apiReviews = await getProductReviews(productId);
      set({ reviews: Array.isArray(apiReviews) ? apiReviews : [], loading: false });
    } catch (e) {
      set({ reviews: [], loading: false });
    }
  },

  addReview: async (reviewData) => {
    const created = await createReviewApi({
      order_id: reviewData.order_id,
      product_id: reviewData.product_id,
      rating: reviewData.rating,
      comment: reviewData.comment,
    });
    set({ reviews: [created, ...get().reviews] });
    return created;
  },

  getReviewsByProduct: (productId) => {
    const pId = Number(productId);
    return get().reviews.filter((r) => Number(r.product_id) === pId);
  },

  getProductRatingSummary: (productId) => {
    const pReviews = get().reviews.filter((r) => Number(r.product_id) === Number(productId));
    if (pReviews.length === 0) {
      return { average: 0, count: 0, stars: 0 };
    }
    const sum = pReviews.reduce((acc, r) => acc + Number(r.rating || 5), 0);
    const avg = Math.round((sum / pReviews.length) * 10) / 10;
    return { average: avg, count: pReviews.length, stars: Math.round(avg) };
  },
})));
