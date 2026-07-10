<template>
  <div class="order-detail">
    <div class="order-detail__container">
      <router-link to="/orders" class="order-detail__back"> ← 返回订单列表 </router-link>

      <div v-if="loading" v-loading="loading" class="order-detail__loading" />

      <div v-else-if="!order" class="order-detail__empty">
        <el-empty description="订单不存在" />
      </div>

      <template v-else>
        <!-- 订单状态 -->
        <div class="order-detail__header">
          <h1 class="order-detail__title">订单 #{{ order.id }}</h1>
          <el-tag :type="statusType(order.status)">{{ statusLabel(order.status) }}</el-tag>
        </div>

        <!-- 收货信息 -->
        <div class="order-detail__section">
          <h3>收货信息</h3>
          <p>{{ order.address }}</p>
          <p class="order-detail__phone">{{ order.phone }}</p>
        </div>

        <!-- 商品明细 -->
        <div class="order-detail__section">
          <h3>商品明细</h3>
          <div v-for="item in order.items" :key="item.id" class="order-detail__item">
            <router-link
              v-if="item.product"
              :to="`/products/${item.productId}`"
              class="order-detail__item-name"
            >
              {{ item.product.name }}
            </router-link>
            <span class="order-detail__item-meta">× {{ item.quantity }}</span>
            <span class="order-detail__item-price">¥{{ item.price * item.quantity }}</span>
          </div>
        </div>

        <!-- 金额汇总 -->
        <div class="order-detail__section">
          <h3>金额明细</h3>
          <div class="order-detail__summary">
            <div class="order-detail__row">
              <span>商品合计</span>
              <span>¥{{ order.total }}</span>
            </div>
            <div class="order-detail__row" v-if="order.discount < 1">
              <span>会员折扣（{{ (order.discount * 10).toFixed(1) }} 折）</span>
              <span class="order-detail__discount"
                >-¥{{ (order.total - order.discountedTotal).toFixed(2) }}</span
              >
            </div>
            <div class="order-detail__row order-detail__row--total">
              <span>实付金额</span>
              <span class="order-detail__final">¥{{ order.discountedTotal }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div v-if="order.status === 'pending'" class="order-detail__actions">
          <el-button type="primary" size="large" @click="doPay">确认支付</el-button>
          <el-button size="large" @click="doCancel">取消订单</el-button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getOrderById, updateOrder } from '@/api/orders'
import { useCartStore } from '@/stores/cart'
import type { Order } from '@/types'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()
const order = ref<Order | null>(null)
const loading = ref(true)

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: '待付款',
    paid: '已支付',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消',
  }
  return map[status] || status
}

function statusType(status: string): '' | 'success' | 'warning' | 'info' | 'danger' {
  const map: Record<string, '' | 'success' | 'warning' | 'info' | 'danger'> = {
    pending: 'warning',
    paid: 'success',
    shipped: '',
    completed: '',
    cancelled: 'info',
  }
  return map[status] || 'info'
}

async function loadOrder() {
  loading.value = true
  try {
    const id = parseInt(route.params.id as string)
    const res = await getOrderById(id)
    order.value = res.data
  } catch (e) {
    console.error('加载订单失败:', e)
  } finally {
    loading.value = false
  }
}

async function doPay() {
  if (!order.value) return
  try {
    const res = await updateOrder(order.value.id, { action: 'pay' })
    order.value = res.data
    ElMessage.success('支付成功')
    // 刷新购物车（因为清空了）
    cart.fetchCart()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.error || '支付失败')
  }
}

async function doCancel() {
  if (!order.value) return
  try {
    await updateOrder(order.value.id, { action: 'cancel' })
    ElMessage.success('订单已取消')
    router.push('/orders')
  } catch (e: any) {
    ElMessage.error(e.response?.data?.error || '取消失败')
  }
}

onMounted(() => {
  loadOrder()
})
</script>

<style lang="less" scoped>
.order-detail {
  min-height: 100vh;
  background: @color-bg;

  &__container {
    max-width: 800px;
    margin: 0 auto;
    padding: @spacing-lg @spacing-md;
  }

  &__back {
    display: inline-flex;
    align-items: center;
    gap: @spacing-xs;
    font-size: 14px;
    color: @color-text-secondary;
    margin-bottom: @spacing-md;

    &:hover {
      color: @color-text;
    }
  }

  &__loading {
    padding: 80px 0;
  }

  &__empty {
    padding: 80px 0;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: @spacing-lg;
  }

  &__title {
    font-size: 22px;
    font-weight: 700;
    color: @color-text;
  }

  &__section {
    background: @color-bg-white;
    border-radius: @radius-lg;
    box-shadow: @shadow-sm;
    padding: @spacing-md;
    margin-bottom: @spacing-md;

    h3 {
      font-size: 14px;
      font-weight: 600;
      color: @color-text-secondary;
      margin-bottom: @spacing-sm;
      padding-bottom: @spacing-sm;
      border-bottom: 1px solid #f3f4f6;
    }

    p {
      font-size: 14px;
      color: @color-text;
      line-height: 2;
    }
  }

  &__phone {
    color: @color-text-secondary !important;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: @spacing-sm;
    padding: @spacing-xs 0;
  }

  &__item-name {
    flex: 1;
    font-size: 14px;
    color: @color-primary;
  }

  &__item-meta {
    font-size: 13px;
    color: @color-text-muted;
  }

  &__item-price {
    font-size: 14px;
    color: @color-danger;
    min-width: 80px;
    text-align: right;
  }

  &__summary {
    display: flex;
    flex-direction: column;
    gap: @spacing-xs;
  }

  &__row {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: @color-text-secondary;

    &--total {
      padding-top: @spacing-sm;
      border-top: 1px solid #f3f4f6;
      font-weight: 600;
      font-size: 16px;
      color: @color-text;
    }
  }

  &__discount {
    color: @color-success;
  }

  &__final {
    color: @color-danger;
    font-size: 20px;
    font-weight: 700;
  }

  &__actions {
    display: flex;
    gap: @spacing-md;
    margin-top: @spacing-lg;
  }
}
</style>
