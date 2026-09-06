import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { getOrders, createOrder, updateOrderStatusApi } from '../services/orderService'
import { verifyPaymentApi } from '../services/paymentService'
import { normalizeOrderStatus } from '../utils/catalog'

const mapOrder = (order) => ({
  ...order,
  order_status: normalizeOrderStatus(order.order_status),
  items: (order.items || []).map((item) => ({
    ...item,
    name: item.name,
    image_url: item.image_url,
    price: item.unit_price ?? item.price,
  })),
})

export const useOrderStore = create(devtools((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  reloadForUser: () => {
    get().fetchOrders()
  },

  fetchOrders: async () => {
    set({ loading: true, error: null })
    try {
      const apiData = await getOrders()
      const orders = Array.isArray(apiData) ? apiData.map(mapOrder) : []
      set({ orders, loading: false })
    } catch (e) {
      set({ orders: [], loading: false, error: e?.response?.data?.detail || e.message })
    }
  },

  placeOrder: async (orderData) => {
    set({ loading: true, error: null })
    const payload = {
      shipping_address: orderData.shipping_address,
      shipping_cost: orderData.shipping_cost,
      payment_method: orderData.payment_method,
      coupon_code: orderData.coupon_code || null,
      items: (orderData.items || []).map((item) => ({
        product_id: item.product_id || item.id,
        quantity: Number(item.quantity || 1),
      })),
    }
    try {
      const newOrder = await createOrder(payload)
      const mapped = mapOrder(newOrder)
      set({ orders: [mapped, ...get().orders], loading: false })
      return mapped
    } catch (e) {
      set({ loading: false, error: e?.response?.data?.detail || e.message })
      throw e
    }
  },

  updateOrderStatus: async (orderId, newStatus, trackingNo = '') => {
    const updated = await updateOrderStatusApi(orderId, {
      order_status: normalizeOrderStatus(newStatus),
      tracking_number: trackingNo || undefined,
    })
    const mapped = mapOrder(updated)
    set({
      orders: get().orders.map((o) => (String(o.id) === String(orderId) ? mapped : o)),
    })
    return mapped
  },

  submitPaymentSlip: async () => {
    await get().fetchOrders()
  },

  verifyPayment: async (orderId, isApproved) => {
    const order = get().orders.find((o) => String(o.id) === String(orderId))
    const paymentId = order?.payment_id
    if (!paymentId) {
      await get().fetchOrders()
      return
    }
    await verifyPaymentApi(paymentId, isApproved)
    await get().fetchOrders()
  },
})))
