import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { getCommunities, getCommunity, createCommunity } from '../services/communityService'

export const useCommunityStore = create(devtools((set) => ({
  communities: [],
  current: null,
  loading: false,
  error: null,
  fetchCommunities: async (skip = 0, limit = 100) => {
    set({ loading: true, error: null })
    try {
      const data = await getCommunities(skip, limit)
      set({ communities: Array.isArray(data) ? data : [], loading: false })
    } catch (e) {
      set({ error: e?.response?.data?.detail || e.message, loading: false, communities: [] })
    }
  },
  fetchCommunity: async (id) => {
    set({ loading: true, error: null, current: null })
    try {
      const data = await getCommunity(id)
      set({ current: data, loading: false })
      return data
    } catch (e) {
      set({ error: e?.response?.data?.detail || e.message, loading: false, current: null })
      return null
    }
  },
  addCommunity: async (communityData) => {
    set({ loading: true, error: null })
    try {
      const newCommunity = await createCommunity(communityData)
      set((state) => ({ communities: [newCommunity, ...state.communities], loading: false }))
      return newCommunity
    } catch (e) {
      set({ error: e?.response?.data?.detail || e.message, loading: false })
      throw e
    }
  },
})))
