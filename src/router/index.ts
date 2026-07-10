import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/home/HomePage.vue'),
      meta: { guest: true },
    },
    {
      path: '/products/:id',
      name: 'product-detail',
      component: () => import('@/pages/product-detail/ProductDetailPage.vue'),
      meta: { guest: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/login/LoginPage.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/pages/register/RegisterPage.vue'),
      meta: { guest: true },
    },
    {
      path: '/cart',
      name: 'cart',
      component: () => import('@/pages/cart/CartPage.vue'),
    },
    {
      path: '/orders',
      name: 'orders',
      component: () => import('@/pages/orders/OrderListPage.vue'),
    },
    {
      path: '/orders/:id',
      name: 'order-detail',
      component: () => import('@/pages/orders/OrderDetailPage.vue'),
    },
  ],
})

// 应用启动时尝试获取当前用户
let initialAuthDone = false

router.beforeEach(async (to, _from, next) => {
  const { useAuthStore } = await import('@/stores/auth')
  const auth = useAuthStore()

  // 首次加载时获取用户信息
  if (!initialAuthDone) {
    initialAuthDone = true
    await auth.fetchUser()
  }

  // 未登录访问需认证的页面，跳转登录页
  if (!auth.user && to.meta.guest !== true) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }
  next()
})

export default router
