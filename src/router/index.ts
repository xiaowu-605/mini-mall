import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomePage.vue'),
    },
    {
      path: '/products/:id',
      name: 'product-detail',
      component: () => import('@/pages/ProductDetailPage.vue'),
    },
  ],
})

export default router
