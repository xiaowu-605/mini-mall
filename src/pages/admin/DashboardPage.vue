<template>
  <div
    class="dashboard"
    v-loading="loading"
  >
    <h2 class="dashboard__title">仪表盘</h2>

    <div
      v-if="error"
      class="dashboard__error"
    >
      <el-empty description="加载失败，请刷新重试" />
    </div>

    <!-- 统计卡片 -->
    <el-row
      v-else
      :gutter="20"
      class="dashboard__row"
    >
      <el-col
        v-for="card in statCards"
        :key="card.label"
        :xs="12"
        :sm="8"
        :md="6"
        :lg="4"
      >
        <div
          :class="['stat-card', { 'stat-card--clickable': card.route }]"
          @click="card.route && goTo(card.route)"
        >
          <div class="stat-card__icon">
            <el-icon :size="28">
              <component :is="card.icon" />
            </el-icon>
          </div>
          <div class="stat-card__value">{{ card.value }}</div>
          <div class="stat-card__label">{{ card.label }}</div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Tickets,
  Money,
  Clock,
  TrendCharts,
  UserFilled,
  GoodsFilled,
} from '@element-plus/icons-vue'
import { getDashboardStats } from '@/api/admin'
import { useAsyncData } from '@/hooks/useAsyncData'
import type { DashboardStats } from '@/types'

const router = useRouter()
const { loading, error, run } = useAsyncData()

let stats = ref<DashboardStats | null>(null)

/** 统计卡片配置：图标 / 显示值 / 标签 / 可选的跳转路由 */
interface StatCard {
  icon: any
  value: string | number
  label: string
  route?: string
}

/** 页面初始化：加载统计数据 */
onMounted(async () => {
  const res = await run(() => getDashboardStats())
  if (res) stats.value = res.data
})

/** 根据 stats 数据生成卡片列表 */
const statCards = computed<StatCard[]>(() => {
  const s = stats.value
  if (!s) return []

  return [
    {
      icon: Tickets,
      value: s.totalOrders,
      label: '订单总数',
      route: '/admin/orders',
    },
    { icon: Money, value: `¥${s.totalRevenue.toFixed(2)}`, label: '交易总额' },
    {
      icon: Clock,
      value: s.pendingOrders,
      label: '待处理订单',
      route: '/admin/orders',
    },
    {
      icon: TrendCharts,
      value: s.todayOrders,
      label: '今日订单',
      route: '/admin/orders',
    },
    {
      icon: Money,
      value: `¥${s.todayRevenue.toFixed(2)}`,
      label: '今日交易额',
    },
    { icon: UserFilled, value: s.totalUsers, label: '用户总数' },
    {
      icon: GoodsFilled,
      value: s.totalProducts,
      label: '商品总数',
      route: '/admin/products',
    },
  ]
})

/** 跳转到指定路由 */
function goTo(path: string) {
  router.push(path)
}
</script>

<style lang="less" scoped>
.dashboard {
  &__title {
    font-size: 20px;
    font-weight: 600;
    color: @color-text;
    margin-bottom: @spacing-lg;
  }

  &__row {
    margin-bottom: @spacing-md;
  }
}

.stat-card {
  background: @color-bg-white;
  border-radius: @radius-md;
  box-shadow: @shadow-sm;
  padding: @spacing-lg;
  text-align: center;
  margin-bottom: @spacing-md;
  cursor: default;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: @shadow-md;
  }

  &--clickable {
    cursor: pointer;

    &:hover {
      box-shadow: @shadow-md;
      transform: translateY(-2px);
    }
  }

  &__icon {
    color: @color-primary;
    margin-bottom: @spacing-sm;
  }

  &__value {
    font-size: 24px;
    font-weight: 700;
    color: @color-text;
    margin-bottom: @spacing-xs;
  }

  &__label {
    font-size: 13px;
    color: @color-text-secondary;
  }
}
</style>
