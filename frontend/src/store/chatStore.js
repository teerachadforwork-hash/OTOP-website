import { create } from 'zustand';
import api from '../utils/api';

export const useChatStore = create((set, get) => ({
  groups: [],
  privateRooms: [],
  currentChatMessages: [],
  loading: false,
  error: null,

  fetchGroups: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/chat/groups');
      set({ groups: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createGroup: async (name) => {
    const { data } = await api.post('/chat/groups', { name });
    set((state) => ({ groups: [...state.groups, data] }));
    return data;
  },

  updateGroup: async (groupId, name) => {
    const { data } = await api.put(`/chat/groups/${groupId}`, { name });
    set((state) => ({
      groups: state.groups.map(g => g.id === groupId ? data : g)
    }));
    return data;
  },

  deleteGroup: async (groupId) => {
    await api.delete(`/chat/groups/${groupId}`);
    set((state) => ({
      groups: state.groups.filter(g => g.id !== groupId)
    }));
  },

  fetchGroupMembers: async (groupId) => {
    const { data } = await api.get(`/chat/groups/${groupId}/members`);
    return data;
  },

  addGroupMember: async (groupId, email) => {
    const { data } = await api.post(`/chat/groups/${groupId}/members`, { email });
    return data;
  },

  leaveGroup: async (groupId, userId) => {
    await api.delete(`/chat/groups/${groupId}/members/${userId}`);
    set((state) => ({
      groups: state.groups.filter(g => g.id !== groupId)
    }));
  },

  fetchPrivateRooms: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/chat/private');
      set({ privateRooms: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  startPrivateChat: async (user2_id) => {
    const { data } = await api.post('/chat/private', { user2_id });
    // check if exists
    const exists = get().privateRooms.find(r => r.id === data.id);
    if (!exists) {
      set((state) => ({ privateRooms: [...state.privateRooms, data] }));
    }
    return data;
  },

  fetchGroupMessages: async (groupId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get(`/chat/groups/${groupId}/messages`);
      set({ currentChatMessages: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  sendGroupMessage: async (groupId, content, imageUrl = null) => {
    const { data } = await api.post(`/chat/groups/${groupId}/messages`, { content, image_url: imageUrl });
    set((state) => ({ currentChatMessages: [...state.currentChatMessages, data] }));
    return data;
  },

  fetchPrivateMessages: async (roomId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get(`/chat/private/${roomId}/messages`);
      set({ currentChatMessages: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  sendPrivateMessage: async (roomId, content, imageUrl = null) => {
    const { data } = await api.post(`/chat/private/${roomId}/messages`, { content, image_url: imageUrl });
    set((state) => ({ currentChatMessages: [...state.currentChatMessages, data] }));
    return data;
  }
}));
