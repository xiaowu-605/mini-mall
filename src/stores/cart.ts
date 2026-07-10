import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getCart, addToCart, updateCartItem, removeCartItem } from '@/api/cart'
import type { CartItem } from '@/types'
import type { AddCartParams, UpdateCartParams } from '@/api/cart'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const loading = ref(false)

  // 购物车商品总数
  const count = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))

  // 总价（原价合计）
  const totalPrice = computed(() =>
    items.value.reduce((sum, item) => {
      return sum + (item.product?.price || 0) * item.quantity
    }, 0),
  )

  /** 获取购物车 */
  async function fetchCart() {
    loading.value = true
    try {
      const res = await getCart()
      items.value = res.data
    } catch (e) {
      console.error('获取购物车失败:', e)
      items.value = []
    } finally {
      loading.value = false
    }
  }

  /** 加入购物车 */
  async function add(params: AddCartParams) {
    const res = await addToCart(params)
    // 如果是 upsert，更新本地列表
    const idx = items.value.findIndex((item) => item.id === res.data.id)
    if (idx >= 0) {
      items.value[idx] = res.data
    } else {
      // 新项需要完整刷新以保证 product 关联数据正确
      await fetchCart()
    }
  }

  /** 修改数量 */
  async function updateQuantity(id: number, params: UpdateCartParams) {
    if (params.quantity === 0) {
      const backup = items.value
      items.value = items.value.filter((item) => item.id !== id)
      try {
        await removeCartItem(id)
      } catch {
        items.value = backup
        throw new Error('删除失败')
      }
      return
    }
    const res = await updateCartItem(id, params)
    const idx = items.value.findIndex((item) => item.id === id)
    if (idx >= 0) {
      items.value[idx] = res.data
    }
  }

  /** 删除购物车项 */
  async function remove(id: number) {
    const backup = items.value
    items.value = items.value.filter((item) => item.id !== id)
    try {
      await removeCartItem(id)
    } catch {
      items.value = backup
      throw new Error('删除失败')
    }
  }

  return {
    items,
    loading,
    count,
    totalPrice,
    fetchCart,
    add,
    updateQuantity,
    remove,
  }
})
