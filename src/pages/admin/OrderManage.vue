<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <h2>订单管理</h2>
    </div>

    <el-table :data="orders" border stripe v-loading="loading">
      <el-table-column prop="id" label="订单号" width="80" />
      <el-table-column label="用户" width="120">
        <template #default="{ row }">{{ row.user?.name }}</template>
      </el-table-column>
      <el-table-column label="金额" width="100">
        <template #default="{ row }">¥{{ row.discountedTotal }}</template>
      </el-table-column>
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="收货信息" min-width="150">
        <template #default="{ row }">{{ row.address }} / {{ row.phone }}</template>
      </el-table-column>
      <el-table-column label="时间" width="160">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-select
            :model-value="row.status"
            size="small"
            @change="(val: string) => doChangeStatus(row.id, val)"
          >
            <el-option label="待付款" value="pending" />
            <el-option label="已支付" value="paid" />
            <el-option label="已发货" value="shipped" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAdminOrders, updateAdminOrderStatus } from '@/api/admin'
import { statusLabel, statusType } from '@/utils/order'
import { formatTime } from '@/utils/format'
import { useAsyncData } from '@/hooks/useAsyncData'
import type { Order } from '@/types'

const orders = ref<Order[]>([])
const { loading, run } = useAsyncData()

/** 页面初始化：加载订单列表 */
onMounted(() => {
  loadOrders()
})

/** 加载订单列表 */
async function loadOrders() {
  const res = await run(() => getAdminOrders())
  if (res) orders.value = res.data
}

/** 更新订单状态 */
async function doChangeStatus(orderId: number, status: string) {
  const orderParams = { status }
  try {
    await updateAdminOrderStatus(orderId, orderParams.status)
    ElMessage.success('状态已更新')
    await loadOrders()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.error || '更新失败')
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
}
</style>
