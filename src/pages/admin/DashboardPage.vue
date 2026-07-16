<template>
  <div
    class="dashboard"
    v-loading="loading"
  >
    <h2 class="dashboard__title">仪表盘</h2>

    <!-- 统计卡片 -->
    <el-row
      :gutter="16"
      class="dashboard__row"
    >
      <el-col
        v-for="card in statCards"
        :key="card.label"
        :xs="12"
        :sm="8"
        :md="6"
        :lg="card.route ? 6 : 8"
        :xl="card.route ? 4 : 6"
      >
        <div
          :class="['stat-card', { 'stat-card--clickable': card.route }]"
          @click="card.route && goTo(card.route)"
        >
          <div class="stat-card__icon">
            <el-icon :size="24">
              <component :is="card.icon" />
            </el-icon>
          </div>
          <div class="stat-card__value">{{ card.value }}</div>
          <div class="stat-card__label">{{ card.label }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区 -->
    <el-row :gutter="16">
      <el-col
        :xs="24"
        :lg="14"
      >
        <div class="chart-card">
          <h3 class="chart-card__title">近 7 天订单趋势</h3>
          <div
            ref="trendChartRef"
            class="chart-card__body"
          />
        </div>
      </el-col>
      <el-col
        :xs="24"
        :lg="10"
      >
        <div class="chart-card">
          <h3 class="chart-card__title">订单状态分布</h3>
          <div
            ref="statusChartRef"
            class="chart-card__body"
          />
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="24">
        <div class="chart-card">
          <h3 class="chart-card__title">分类商品数量</h3>
          <div
            ref="categoryChartRef"
            class="chart-card__body chart-card__body--bar"
          />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  Tickets,
  Money,
  Clock,
  TrendCharts,
  UserFilled,
  GoodsFilled,
} from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
import { LineChart, PieChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getDashboardStats } from '@/api/admin'
import type { DashboardStats } from '@/types'

// ECharts 按需注册
echarts.use([
  LineChart,
  PieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  CanvasRenderer,
])

const router = useRouter()
let loading = ref(true)
let stats = ref<DashboardStats | null>(null)

// 图表 DOM 引用
const trendChartRef = ref<HTMLElement | null>(null)
const statusChartRef = ref<HTMLElement | null>(null)
const categoryChartRef = ref<HTMLElement | null>(null)

// 图表实例
let trendChart: echarts.ECharts | null = null
let statusChart: echarts.ECharts | null = null
let categoryChart: echarts.ECharts | null = null

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: '待付款',
  paid: '已支付',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
}

interface StatCard {
  icon: any
  value: string | number
  label: string
  route?: string
}

onMounted(async () => {
  try {
    const res = await getDashboardStats()
    stats.value = res.data
    await nextTick()
    initCharts()
  } catch (e) {
    console.error('加载统计数据失败:', e)
  } finally {
    loading.value = false
  }
})

/** 统计卡片 */
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
    {
      icon: Money,
      value: `¥${s.totalRevenue.toFixed(2)}`,
      label: '交易总额',
    },
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

/** 初始化三个图表 */
function initCharts() {
  if (!stats.value) return

  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: stats.value.orderTrend.map((d) => d.date.slice(5)),
      },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          name: '订单数',
          type: 'line',
          data: stats.value.orderTrend.map((d) => d.count),
          smooth: true,
          areaStyle: { opacity: 0.15 },
          lineStyle: { color: '#409EFF', width: 2 },
          itemStyle: { color: '#409EFF' },
        },
      ],
    })
  }

  if (statusChartRef.value) {
    statusChart = echarts.init(statusChartRef.value)
    const colors = ['#E6A23C', '#67C23A', '#409EFF', '#909399', '#F56C6C']
    statusChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      series: [
        {
          type: 'pie',
          radius: ['45%', '75%'],
          center: ['50%', '55%'],
          label: { show: true, formatter: '{b}\n{d}%' },
          data: stats.value.orderStatusDistribution
            .filter((d) => d.count > 0)
            .map((d, i) => ({
              value: d.count,
              name: ORDER_STATUS_LABELS[d.status] || d.status,
              itemStyle: { color: colors[i] },
            })),
        },
      ],
    })
  }

  if (categoryChartRef.value) {
    categoryChart = echarts.init(categoryChartRef.value)
    categoryChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 40, right: 20, top: 10, bottom: 20 },
      xAxis: {
        type: 'category',
        data: stats.value.categoryDistribution.map((d) => d.name),
        axisLabel: { rotate: 15 },
      },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          name: '商品数',
          type: 'bar',
          data: stats.value.categoryDistribution.map((d) => d.value),
          itemStyle: { borderRadius: [4, 4, 0, 0], color: '#409EFF' },
          barMaxWidth: 60,
        },
      ],
    })
  }
}

/** 跳转路由 */
function goTo(path: string) {
  router.push(path)
}

/** 窗口 resize 时自适应 */
window.addEventListener('resize', () => {
  trendChart?.resize()
  statusChart?.resize()
  categoryChart?.resize()
})
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
    font-size: 22px;
    font-weight: 700;
    color: @color-text;
    margin-bottom: @spacing-xs;
  }

  &__label {
    font-size: 12px;
    color: @color-text-secondary;
  }
}

.chart-card {
  background: @color-bg-white;
  border-radius: @radius-md;
  box-shadow: @shadow-sm;
  padding: @spacing-lg;
  margin-bottom: @spacing-md;

  &__title {
    font-size: 15px;
    font-weight: 600;
    color: @color-text;
    margin: 0 0 @spacing-md;
  }

  &__body {
    width: 100%;
    height: 320px;

    &--bar {
      height: 240px;
    }
  }
}
</style>
