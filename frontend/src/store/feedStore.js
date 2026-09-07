import { create } from 'zustand';
import api from '../utils/api';

export const useFeedStore = create((set, get) => ({
  posts: [],
  currentPostComments: [],
  loading: false,
  error: null,

  fetchPosts: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/feed/posts');
      set({ posts: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createPost: async (content, imageUrl = null) => {
    const { data } = await api.post('/feed/posts', { content, image_url: imageUrl });
    set((state) => ({ posts: [data, ...state.posts] }));
    return data;
  },

  updatePost: async (postId, content, imageUrl = null) => {
    const { data } = await api.put(`/feed/posts/${postId}`, { content, image_url: imageUrl });
    set((state) => ({
      posts: state.posts.map(p => p.id === postId ? data : p)
    }));
    return data;
  },

  deletePost: async (postId) => {
    await api.delete(`/feed/posts/${postId}`);
    set((state) => ({ posts: state.posts.filter(p => p.id !== postId) }));
  },

  fetchComments: async (postId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get(`/feed/posts/${postId}/comments`);
      set({ currentPostComments: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createComment: async (postId, content, parentId = null) => {
    const { data } = await api.post(`/feed/posts/${postId}/comments`, { content, parent_comment_id: parentId });
    
    if (parentId) {
      // It's a reply, update the specific comment
      set((state) => ({
        currentPostComments: state.currentPostComments.map(c => 
          c.id === parentId 
            ? { ...c, replies: [...(c.replies || []), data] }
            : c
        )
      }));
    } else {
      // Top level comment
      set((state) => ({ currentPostComments: [...state.currentPostComments, data] }));
    }
    
    // Also increment comment count on post
    set((state) => ({
      posts: state.posts.map(p => 
        p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
      )
    }));
    
    return data;
  }
}));
