<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <h2>用户管理</h2>
    </div>

    <!-- 搜索栏 -->
    <div class="admin-page__filters">
      <el-input
        v-model="searchQuery"
        placeholder="搜索邮箱 / 用户名..."
        clearable
        style="width: 260px"
        @input="onSearch"
        @clear="onSearch"
      />
    </div>

    <el-table
      :data="users"
      border
      stripe
      v-loading="loading"
    >
      <template #empty>
        <span v-if="error">加载失败，请刷新重试</span>
        <span v-else>暂无用户</span>
      </template>
      <el-table-column
        prop="id"
        label="ID"
        width="60"
      />
      <el-table-column
        prop="email"
        label="邮箱"
        min-width="160"
      />
      <el-table-column
        prop="name"
        label="用户名"
        width="120"
      />
      <el-table-column
        label="状态"
        width="90"
      >
        <template #default="{ row }">
          <el-tag
            :type="row.status === 'blocked' ? 'danger' : 'success'"
            size="small"
          >
            {{ row.status === 'blocked' ? '已拉黑' : '正常' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="会员等级"
        width="90"
      >
        <template #default="{ row }">
          <el-tag
            v-if="row.memberLevel > 0"
            type="warning"
            size="small"
          >
            Lv.{{ row.memberLevel }}
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column
        label="消费金额"
        width="110"
      >
        <template #default="{ row }">
          ¥{{ row.totalSpent.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column
        label="注册时间"
        width="160"
      >
        <template #default="{ row }">
          {{ formatTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        width="100"
      >
        <template #default="{ row }">
          <el-button
            v-if="row.status !== 'blocked'"
            size="small"
            type="danger"
            v-permission="'manage_users'"
            @click="doToggleStatus(row)"
          >
            拉黑
          </el-button>
          <el-button
            v-else
            size="small"
            type="success"
            v-permission="'manage_users'"
            @click="doToggleStatus(row)"
          >
            解除
          </el-button>
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
        @current-change="loadData"
        @size-change="onPageSizeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminUsers, updateUserStatus } from '@/api/admin'
import { formatTime } from '@/utils/format'
import { createDebounce } from '@/utils/debounce'
import type { User } from '@/types'

let users = ref<User[]>([])
let loading = ref(false)
let error = ref(false)

/** 分页状态 */
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

/** 搜索状态 */
let searchQuery = ref('')

const debounce = createDebounce(300)

/** 页面初始化 */
onMounted(() => {
  loadData()
})

/** 加载用户列表（仅普通用户） */
async function loadData() {
  loading.value = true
  error.value = false
  try {
    const queryParams: Record<string, string | number> = {
      page: page.value,
      pageSize: pageSize.value,
    }
    if (searchQuery.value) queryParams.search = searchQuery.value
    const res = await getAdminUsers(queryParams)
    users.value = res.data.list
    total.value = res.data.total
  } catch (e) {
    error.value = true
    console.error('加载用户列表失败:', e)
  } finally {
    loading.value = false
  }
}

/** 搜索防抖 */
function onSearch() {
  debounce(() => {
    page.value = 1
    loadData()
  })
}

/** pageSize 变更时重置到第一页 */
function onPageSizeChange() {
  page.value = 1
  loadData()
}

/** 拉黑 / 解除拉黑 */
async function doToggleStatus(user: User) {
  const newStatus = user.status === 'blocked' ? 'active' : 'blocked'
  const actionLabel = newStatus === 'blocked' ? '拉黑' : '解除拉黑'

  try {
    await ElMessageBox.confirm(
      `确认${actionLabel}用户「${user.name}」？${newStatus === 'blocked' ? '拉黑后该用户将无法下单。' : ''}`,
      `${actionLabel}用户`,
      { type: 'warning' },
    )
  } catch {
    return
  }

  try {
    await updateUserStatus(user.id, newStatus)
    ElMessage.success(`${actionLabel}成功`)
    await loadData()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.error || `${actionLabel}失败`)
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
    margin-bottom: @spacing-md;
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: @spacing-md;
  }
}
</style>
