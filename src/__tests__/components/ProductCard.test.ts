import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import ProductCard from '@/components/product/ProductCard.vue'

/** 创建测试用 router */
function mockRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [{ path: '/products/:id', name: 'product-detail', component: {} }],
  })
}

/** 测试用商品数据 */
const mockProduct = {
  id: 1,
  name: '测试商品',
  price: 99.9,
  image: '/test.jpg',
  stock: 10,
  categoryId: 1,
  description: '测试描述',
  category: { id: 1, name: '数码产品' },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
}

describe('ProductCard', () => {
  it('应正确渲染商品名称', () => {
    const wrapper = mount(ProductCard, {
      props: { product: mockProduct },
      global: { plugins: [mockRouter()] },
    })
    expect(wrapper.text()).toContain('测试商品')
  })

  it('应正确渲染商品价格', () => {
    const wrapper = mount(ProductCard, {
      props: { product: mockProduct },
      global: { plugins: [mockRouter()] },
    })
    expect(wrapper.text()).toContain('¥99.9')
  })

  it('应显示分类标签', () => {
    const wrapper = mount(ProductCard, {
      props: { product: mockProduct },
      global: { plugins: [mockRouter()] },
    })
    expect(wrapper.text()).toContain('数码产品')
  })

  it('库存为 0 时应显示已售罄', () => {
    const soldOut = { ...mockProduct, stock: 0 }
    const wrapper = mount(ProductCard, {
      props: { product: soldOut },
      global: { plugins: [mockRouter()] },
    })
    expect(wrapper.text()).toContain('已售罄')
  })

  it('应渲染 router-link 指向正确路径', () => {
    const wrapper = mount(ProductCard, {
      props: { product: mockProduct },
      global: { plugins: [mockRouter()] },
    })
    const link = wrapper.findComponent({ name: 'RouterLink' })
    expect(link.props('to')).toBe('/products/1')
  })
})
