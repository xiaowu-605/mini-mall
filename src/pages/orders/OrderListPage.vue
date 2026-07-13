<template>
  <div class="order-list">
    <div class="order-list__container">
      <h1 class="order-list__title">我的订单</h1>

      <!-- 加载中 -->
      <div v-if="loading" v-loading="loading" class="order-list__loading" />

      <!-- 加载失败 -->
      <el-empty v-else-if="error" description="加载失败，请重试">
        <el-button type="primary" @click="loadOrders">重新加载</el-button>
      </el-empty>

      <!-- 空状态 -->
      <el-empty v-else-if="orders.length === 0" description="暂无订单" />

      <!-- 订单列表 -->
      <div v-else class="order-list__items">
        <div v-for="order in orders" :key="order.id" class="order-card">
          <router-link :to="`/orders/${order.id}`" class="order-card__header">
            <span class="order-card__id">订单号：{{ order.id }}</span>
            <el-tag :type="statusType(order.status)" size="small">{{
              statusLabel(order.status)
            }}</el-tag>
          </router-link>

          <div class="order-card__body">
            <div v-for="item in order.items" :key="item.id" class="order-card__item">
              <span class="order-card__item-name">{{ item.product?.name }}</span>
              <span class="order-card__item-meta">× {{ item.quantity }}</span>
              <span class="order-card__item-price">¥{{ item.price }}</span>
            </div>
          </div>

          <div class="order-card__footer">
            <span class="order-card__total"
              >合计：<strong>¥{{ order.discountedTotal }}</strong></span
            >
            <span class="order-card__time">{{ formatTime(order.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getMyOrders } from '@/api/orders'
import { statusLabel, statusType } from '@/utils/order'
import { formatTime } from '@/utils/format'
import { useAsyncData } from '@/hooks/useAsyncData'
import type { Order } from '@/types'

const orders = ref<Order[]>([])
const { loading, error, run } = useAsyncData()

/** 页面初始化：加载订单列表 */
onMounted(() => {
  loadOrders()
})

/** 加载订单列表 */
async function loadOrders() {
  const res = await run(() => getMyOrders())
  if (res) orders.value = res.data
}
</script>

<style lang="less" scoped>
.order-list {
  min-height: 100vh;
  background: @color-bg;

  &__container {
    max-width: 800px;
    margin: 0 auto;
    padding: @spacing-lg @spacing-md;
  }

  &__title {
    font-size: 24px;
    font-weight: 700;
    color: @color-text;
    margin-bottom: @spacing-lg;
  }

  &__loading {
    padding: 80px 0;
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: @spacing-md;
  }
}

.order-card {
  background: @color-bg-white;
  border-radius: @radius-lg;
  box-shadow: @shadow-sm;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: @spacing-md;
    border-bottom: 1px solid #f3f4f6;
  }

  &__id {
    font-size: 14px;
    color: @color-text-secondary;
  }

  &__body {
    padding: @spacing-md;
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
    color: @color-text;
  }

  &__item-meta {
    font-size: 13px;
    color: @color-text-muted;
  }

  &__item-price {
    font-size: 14px;
    color: @color-text-secondary;
    min-width: 60px;
    text-align: right;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: @spacing-sm @spacing-md @spacing-md;

    strong {
      color: @color-danger;
    }
  }

  &__total {
    font-size: 14px;
    color: @color-text-secondary;
  }

  &__time {
    font-size: 13px;
    color: @color-text-muted;
  }
}
</style>
