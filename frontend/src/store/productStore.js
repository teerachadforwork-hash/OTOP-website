import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { getProducts, getProduct, createProduct, updateProductApi, deleteProductApi, getMyProducts } from '../services/productService'

export const useProductStore = create(devtools((set, get) => ({
  products: [],
  currentProduct: null,
  loading: false,
  error: null,

  fetchProducts: async (skip = 0, limit = 100) => {
    set({ loading: true, error: null })
    try {
      const apiData = await getProducts(skip, limit)
      set({ products: Array.isArray(apiData) ? apiData : [], loading: false })
    } catch (e) {
      set({ products: [], loading: false, error: e.message })
    }
  },

  fetchMyProducts: async () => {
    set({ loading: true, error: null })
    try {
      const apiData = await getMyProducts()
      set({ products: Array.isArray(apiData) ? apiData : [], loading: false })
    } catch (e) {
      set({ products: [], loading: false, error: e.message })
    }
  },

  fetchAdminProducts: async () => {
    set({ loading: true, error: null })
    try {
      const apiData = await getProducts(0, 200, { include_pending: true })
      set({ products: Array.isArray(apiData) ? apiData : [], loading: false })
    } catch (e) {
      set({ products: [], loading: false, error: e.message })
    }
  },

  fetchProductById: async (id) => {
    set({ loading: true, error: null })
    try {
      const product = await getProduct(id)
      const others = get().products.filter((p) => p.id !== product.id)
      set({ currentProduct: product, products: [product, ...others], loading: false })
      return product
    } catch (e) {
      set({ loading: false, error: e.message, currentProduct: null })
      throw e
    }
  },

  addProduct: async (productData) => {
    set({ loading: true, error: null })
    try {
      const newProduct = await createProduct(productData)
      set({ products: [newProduct, ...get().products], loading: false })
      return newProduct
    } catch (e) {
      set({ loading: false, error: e.message })
      throw e
    }
  },

  updateProduct: async (id, updatedFields) => {
    try {
      const updated = await updateProductApi(id, updatedFields)
      set({
        products: get().products.map((p) => (p.id === id ? { ...p, ...updated } : p)),
      })
      return updated
    } catch (e) {
      set({ error: e.message })
      throw e
    }
  },

  deleteProduct: async (id) => {
    try {
      await deleteProductApi(id)
      set({ products: get().products.filter((p) => p.id !== id) })
    } catch (e) {
      set({ error: e.message })
      throw e
    }
  },
})))
