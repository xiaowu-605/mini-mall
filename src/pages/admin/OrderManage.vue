<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <h2>订单管理</h2>
    </div>

    <!-- 筛选栏 -->
    <div class="admin-page__filters">
      <el-input
        v-model="searchQuery"
        placeholder="订单号 / 用户名..."
        clearable
        style="width: 200px"
        @input="onSearch"
        @clear="onSearch"
      />
      <el-select
        v-model="filterStatus"
        placeholder="全部状态"
        clearable
        style="width: 130px"
        @change="onFilterChange"
      >
        <el-option
          label="待付款"
          value="pending"
        />
        <el-option
          label="已支付"
          value="paid"
        />
        <el-option
          label="已发货"
          value="shipped"
        />
        <el-option
          label="已完成"
          value="completed"
        />
        <el-option
          label="已取消"
          value="cancelled"
        />
      </el-select>
      <div class="admin-page__date-picker">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="onFilterChange"
        />
      </div>
      <el-button
        type="primary"
        @click="onFilterChange"
      >
        查询
      </el-button>
    </div>

    <el-table
      :data="orders"
      border
      stripe
      v-loading="loading"
      show-summary
      :summary-method="getSummary"
    >
      <template #empty>
        <span v-if="error">加载失败，请刷新重试</span>
        <span v-else>暂无订单</span>
      </template>
      <el-table-column
        prop="id"
        label="订单号"
        width="80"
      />
      <el-table-column
        label="用户"
        width="120"
      >
        <template #default="{ row }">{{ row.user?.name }}</template>
      </el-table-column>
      <el-table-column
        prop="discountedTotal"
        label="金额"
        width="100"
      >
        <template #default="{ row }"
          >¥{{ (row.discountedTotal ?? 0).toFixed(2) }}</template
        >
      </el-table-column>
      <el-table-column
        label="状态"
        width="120"
      >
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{
            statusLabel(row.status)
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="收货信息"
        min-width="150"
      >
        <template #default="{ row }"
          >{{ row.address }} / {{ row.phone }}</template
        >
      </el-table-column>
      <el-table-column
        label="时间"
        width="160"
      >
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column
        label="操作"
        width="180"
      >
        <template #default="{ row }">
          <el-select
            :model-value="row.status"
            size="small"
            @change="(val: string) => doChangeStatus(row.id, val)"
          >
            <el-option
              label="待付款"
              value="pending"
            />
            <el-option
              label="已支付"
              value="paid"
            />
            <el-option
              label="已发货"
              value="shipped"
            />
            <el-option
              label="已完成"
              value="completed"
            />
            <el-option
              label="已取消"
              value="cancelled"
            />
          </el-select>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="admin-page__pagination">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @current-change="loadOrders"
        @size-change="onPageSizeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAdminOrders, updateAdminOrderStatus } from '@/api/admin'
import { statusLabel, statusType } from '@/utils/order'
import { formatTime } from '@/utils/format'
import { useAsyncData } from '@/hooks/useAsyncData'
import { createDebounce } from '@/utils/debounce'
import type { Order } from '@/types'

const orders = ref<Order[]>([])
const { loading, error, run } = useAsyncData()

/** 分页状态 */
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

/** 筛选状态 */
let searchQuery = ref('')
let filterStatus = ref('')
let dateRange = ref<[string, string] | null>(null)

const debounce = createDebounce(300)

/** 页面初始化：加载订单列表 */
onMounted(() => {
  loadOrders()
})

/** 构建订单查询参数 */
function buildQueryParams(): Record<string, string | number> {
  const queryParams: Record<string, string | number> = {
    page: page.value,
    pageSize: pageSize.value,
  }
  if (searchQuery.value) queryParams.search = searchQuery.value
  if (filterStatus.value) queryParams.status = filterStatus.value
  if (dateRange.value) {
    queryParams.startDate = dateRange.value[0]
    queryParams.endDate = dateRange.value[1]
  }
  return queryParams
}

/** 加载订单列表 */
async function loadOrders() {
  const queryParams = buildQueryParams()
  const res = await run(() => getAdminOrders(queryParams))
  if (res) {
    orders.value = res.data.list
    total.value = res.data.total
  }
}

/** 搜索防抖处理：重置到第一页并重新加载 */
function onSearch() {
  debounce(() => {
    page.value = 1
    loadOrders()
  })
}

/** 筛选条件变更时重置到第一页并重新加载 */
function onFilterChange() {
  page.value = 1
  loadOrders()
}

/** pageSize 变更时重置到第一页 */
function onPageSizeChange() {
  page.value = 1
  loadOrders()
}

/** 表格合计行：汇总订单数和折后总金额 */
function getSummary({ columns, data }: { columns: any[]; data: Order[] }) {
  const sums: string[] = []
  columns.forEach((col, index) => {
    if (index === 0) {
      sums[index] = `共 ${data.length} 笔`
    } else if (col.property === 'discountedTotal') {
      const total = data.reduce((sum, row) => sum + row.discountedTotal, 0)
      sums[index] = `¥${total.toFixed(2)}`
    } else {
      sums[index] = ''
    }
  })
  return sums
}

/** 更新订单状态 */
async function doChangeStatus(orderId: number, status: string) {
  const orderParams = { status }
  try {
    await updateAdminOrderStatus(orderId, orderParams.status)
    ElMessage.success('状态已更新')
    await loadOrders()
  } catch (e) {
    console.error(e)
    // 错误提示已由拦截器统一处理
  }
}
</script>

<style lang="less" scoped>
.admin-page {
  &__header {
    margin-bottom: @spacing-md;

    h2 {
      font-size: 20px;
      font-weight: 600;
      color: @color-text;
    }
  }

  &__filters {
    display: flex;
    align-items: center;
    gap: @spacing-sm;
    margin-bottom: @spacing-md;
    flex-wrap: wrap;
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: @spacing-md;
  }
}
</style>

<style lang="less">
/* 订单管理-日期范围选择器宽度覆写 */
.admin-page__date-picker {
  width: 240px;
  flex-shrink: 0;

  .el-date-editor {
    width: 100% !important;
  }
}
</style>
