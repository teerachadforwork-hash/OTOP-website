import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { getAdminSummary, getSellerSummary } from '../services/dashboardService'

export const useDashboardStore = create(devtools((set, get) => ({
  adminData: null,
  sellerData: null,
  loading: false,
  error: null,
  fetchAdminData: async () => {
    set({ loading: true })
    try {
      const data = await getAdminSummary()
      set({ adminData: data, loading: false })
    } catch (e) {
      set({ error: e.message, loading: false })
    }
  },
  fetchSellerData: async (sellerId) => {
    set({ loading: true })
    try {
      const data = await getSellerSummary(sellerId)
      set({ sellerData: data, loading: false })
    } catch (e) {
      set({ error: e.message, loading: false })
    }
  },
})))
