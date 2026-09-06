import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { getCart, addToCart, updateCartItem, removeCartItem, clearCartApi } from '../services/cartService'
import { getProductImage } from '../utils/catalog'

const mapCartItem = (item) => {
  const product = item.product || item.product_snapshot || null
  return {
    ...item,
    product_id: item.product_id || product?.id,
    product: product
      ? { ...product, image_url: getProductImage(product), hero_image: getProductImage(product) }
      : item.product,
  }
}

export const useCartStore = create(devtools((set, get) => ({
  items: [],
  loading: false,
  error: null,

  reloadForUser: () => {
    get().fetchCart()
  },

  fetchCart: async () => {
    set({ loading: true, error: null })
    try {
      const apiData = await getCart()
      const items = Array.isArray(apiData) ? apiData.map(mapCartItem) : []
      set({ items, loading: false })
    } catch (e) {
      set({ items: [], loading: false, error: e.message })
    }
  },

  addItem: async (itemData) => {
    const addedQty = Math.max(1, Number(itemData.quantity || 1))
    const productId = Number(itemData.product_id)
    set({ loading: true, error: null })
    try {
      await addToCart({ product_id: productId, quantity: addedQty })
      await get().fetchCart()
    } catch (e) {
      set({ loading: false, error: e.message })
      throw e
    }
  },

  updateItem: async (itemId, newQuantity) => {
    const qty = Number(newQuantity)
    if (qty <= 0) {
      return get().removeItem(itemId)
    }
    try {
      await updateCartItem(itemId, qty)
      await get().fetchCart()
    } catch (e) {
      set({ error: e.message })
      throw e
    }
  },

  removeItem: async (itemId) => {
    try {
      await removeCartItem(itemId)
      await get().fetchCart()
    } catch (e) {
      set({ error: e.message })
      throw e
    }
  },

  clearCart: async () => {
    try {
      await clearCartApi()
    } catch (e) {
      // Order creation already clears the server cart
    }
    set({ items: [] })
  },

  getTotalItemCount: () => {
    return get().items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
  },
})))
