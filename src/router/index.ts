import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(_to, _from, savedPosition) {
    // 浏览器后退/前进时恢复滚动位置，其他情况回到顶部
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/home/HomePage.vue'),
      meta: { guest: true, keepAlive: true },
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
    {
      path: '/admin',
      component: () => import('@/pages/admin/AdminLayout.vue'),
      meta: { requiresAdmin: true },
      children: [
        { path: '', redirect: '/admin/products' },
        {
          path: 'products',
          name: 'admin-products',
          component: () => import('@/pages/admin/ProductManage.vue'),
        },
        {
          path: 'orders',
          name: 'admin-orders',
          component: () => import('@/pages/admin/OrderManage.vue'),
        },
        {
          path: 'categories',
          name: 'admin-categories',
          component: () => import('@/pages/admin/CategoryManage.vue'),
        },
      ],
    },
  ],
})

// 应用启动时尝试获取当前用户
let initialAuthDone = false
let hadUser = false
let fetchFailCount = 0

router.beforeEach(async (to, _from, next) => {
  const { useAuthStore } = await import('@/stores/auth')
  const auth = useAuthStore()

  // 首次加载时获取，之前登录过但被 401 清空后重试，或短暂失败后重试
  const needFetch =
    !initialAuthDone || (!auth.user && (hadUser || fetchFailCount < 3))
  if (needFetch) {
    initialAuthDone = true
    await auth.fetchUser()
    if (auth.user) {
      hadUser = true
      fetchFailCount = 0
    } else {
      // 无论是否曾经登录过，fetch 失败都递增计数，防止无限重试
      fetchFailCount++
    }
  }

  // 未登录访问需认证的页面，跳转登录页
  if (!auth.user && to.meta.guest !== true) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }
  // 非 admin 访问后台页面，跳转首页
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    next('/')
    return
  }
  next()
})

export default router
