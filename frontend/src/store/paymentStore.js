import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { getPayments, createPayment } from '../services/paymentService'

export const usePaymentStore = create(devtools((set, get) => ({
  payments: [],
  loading: false,
  error: null,
  fetchPayments: async () => {
    set({ loading: true })
    try {
      const data = await getPayments()
      set({ payments: data, loading: false })
    } catch (e) {
      set({ error: e.message, loading: false })
    }
  },
  submitPayment: async (orderId, amount, slipFile) => {
    set({ loading: true })
    try {
      const newPayment = await createPayment(orderId, amount, slipFile)
      set(state => ({ payments: [newPayment, ...state.payments], loading: false }))
    } catch (e) {
      set({ error: e.message, loading: false })
    }
  },
})))
