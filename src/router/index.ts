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
      name: 'admin',
      component: () => import('@/pages/admin/AdminLayout.vue'),
      meta: { requiresAdmin: true },
      children: [
        { path: '', redirect: '/admin/dashboard' },
        {
          path: 'dashboard',
          name: 'admin-dashboard',
          component: () => import('@/pages/admin/DashboardPage.vue'),
        },
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
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('@/pages/admin/UserManage.vue'),
        },
        // 后台 404 重定向到仪表盘
        { path: ':pathMatch(.*)*', redirect: '/admin/dashboard' },
      ],
    },
    // 前台 404
    { path: '/:pathMatch(.*)*', redirect: '/', meta: { guest: true } },
  ],
})

// 应用启动时尝试获取当前用户
let initialAuthDone = false
let hadUser = false
let fetchFailCount = 0

/**
 * 动态路由配置
 * 每项定义：权限要求 + 路由定义（注入到 admin 父路由下）
 * 新增动态路由只需在此数组中追加即可
 */
const DYNAMIC_ROUTES = [
  {
    permission: 'super_admin',
    route: {
      path: 'admins',
      name: 'admin-admins',
      component: () => import('@/pages/admin/AdminManage.vue'),
    },
  },
]

/** 动态路由是否已注入（每次用户登录后重置）*/
let dynamicRoutesInjected = false

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
    // 用户变更后重置动态路由，下次重新注入
    dynamicRoutesInjected = false
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

  // 按权限动态注入路由
  if (auth.isAdmin && !dynamicRoutesInjected) {
    for (const item of DYNAMIC_ROUTES) {
      if (
        auth.hasPermission(item.permission) &&
        !router.hasRoute(item.route.name as string)
      ) {
        router.addRoute('admin', item.route)
      }
    }
    dynamicRoutesInjected = true
  }

  next()
})

export default router
