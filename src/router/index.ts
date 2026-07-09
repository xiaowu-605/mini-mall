import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/home/HomePage.vue'),
    },
    {
      path: '/products/:id',
      name: 'product-detail',
      component: () => import('@/pages/product-detail/ProductDetailPage.vue'),
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
  ],
})

// 应用启动时尝试获取当前用户
router.beforeEach(async (_to, _from, next) => {
  const { useAuthStore } = await import('@/stores/auth')
  const auth = useAuthStore()
  if (!auth.user && !auth.loading) {
    await auth.fetchUser()
  }
  next()
})

export default router
