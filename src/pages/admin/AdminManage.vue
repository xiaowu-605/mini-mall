<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <h2>管理员管理</h2>
      <el-button
        type="primary"
        v-permission="'super_admin'"
        @click="openCreateDialog"
      >
        新增管理员
      </el-button>
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
      :data="admins"
      border
      stripe
      v-loading="loading"
    >
      <template #empty>
        <span v-if="error">加载失败，请刷新重试</span>
        <span v-else>暂无管理员</span>
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
        label="权限"
        min-width="200"
      >
        <template #default="{ row }">
          <template v-if="row.permissions.length > 0">
            <el-tag
              v-for="perm in row.permissions"
              :key="perm"
              :type="perm === 'super_admin' ? 'danger' : ''"
              size="small"
              class="admin-page__perm-tag"
            >
              {{ permLabel(perm) }}
            </el-tag>
          </template>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        width="160"
      >
        <template #default="{ row }">
          {{ formatTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        width="160"
      >
        <template #default="{ row }">
          <el-button
            size="small"
            @click="openEditDialog(row)"
          >
            编辑权限
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="doDelete(row)"
          >
            删除
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

    <!-- 新增管理员弹窗 -->
    <el-dialog
      v-model="createVisible"
      title="新增管理员"
      width="440px"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="80px"
      >
        <el-form-item
          label="邮箱"
          prop="email"
        >
          <el-input v-model="createForm.email" />
        </el-form-item>
        <el-form-item
          label="用户名"
          prop="name"
        >
          <el-input v-model="createForm.name" />
        </el-form-item>
        <el-form-item
          label="密码"
          prop="password"
        >
          <el-input
            v-model="createForm.password"
            type="password"
            show-password
          />
        </el-form-item>
        <el-form-item label="权限">
          <el-checkbox-group
            v-model="createForm.permissions"
            class="admin-page__perm-group"
          >
            <el-checkbox
              v-for="p in allPermissions"
              :key="p.value"
              :label="p.value"
            >
              {{ p.label }}
              <span
                v-if="p.value === 'super_admin'"
                class="admin-page__perm-hint"
                >（全部权限）</span
              >
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="doCreate"
        >
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 编辑权限弹窗 -->
    <el-dialog
      v-model="editVisible"
      title="编辑管理员权限"
      width="440px"
    >
      <el-form
        v-if="editingAdmin"
        label-width="80px"
      >
        <el-form-item label="管理员">
          <span>{{ editingAdmin.name }}（{{ editingAdmin.email }}）</span>
        </el-form-item>
        <el-form-item label="权限分配">
          <el-checkbox-group
            v-model="editPermissions"
            class="admin-page__perm-group"
          >
            <el-checkbox
              v-for="p in allPermissions"
              :key="p.value"
              :label="p.value"
            >
              {{ p.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="doUpdate"
        >
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  getAdminAdmins,
  createAdminAccount,
  updateAdminAccount,
  deleteAdminAccount,
} from '@/api/admin'
import { formatTime } from '@/utils/format'
import { createDebounce } from '@/utils/debounce'
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm'
import type { User } from '@/types'

/** 所有可选权限项 */
const allPermissions = [
  { value: 'super_admin', label: '超级管理员' },
  { value: 'manage_products', label: '商品管理' },
  { value: 'manage_orders', label: '订单管理' },
  { value: 'manage_categories', label: '分类管理' },
  { value: 'manage_users', label: '用户管理' },
]

const permLabelMap: Record<string, string> = Object.fromEntries(
  allPermissions.map((p) => [p.value, p.label]),
)

let admins = ref<User[]>([])
let loading = ref(false)
let error = ref(false)
let createVisible = ref(false)
let editVisible = ref(false)
let submitting = ref(false)

const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

let searchQuery = ref('')

/** 正在编辑的管理员 */
let editingAdmin = ref<User | null>(null)
let editPermissions = ref<string[]>([])

const createFormRef = ref<FormInstance>()

// 新增表单
const createForm = reactive({
  email: '',
  name: '',
  password: '',
  permissions: [] as string[],
})

const createRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  name: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' },
  ],
}

const debounce = createDebounce(300)
const { confirm: confirmDelete } = useDeleteConfirm()

onMounted(() => {
  loadData()
})

function permLabel(perm: string): string {
  return permLabelMap[perm] || perm
}

/** 加载管理员列表 */
async function loadData() {
  loading.value = true
  error.value = false
  try {
    const queryParams: Record<string, string | number> = {
      page: page.value,
      pageSize: pageSize.value,
    }
    if (searchQuery.value) queryParams.search = searchQuery.value
    const res = await getAdminAdmins(queryParams)
    admins.value = res.data.list
    total.value = res.data.total
  } catch (e) {
    error.value = true
    console.error('加载管理员列表失败:', e)
  } finally {
    loading.value = false
  }
}

function onSearch() {
  debounce(() => {
    page.value = 1
    loadData()
  })
}

function onPageSizeChange() {
  page.value = 1
  loadData()
}

/** 打开新增弹窗 */
function openCreateDialog() {
  createForm.email = ''
  createForm.name = ''
  createForm.password = ''
  createForm.permissions = []
  createVisible.value = true
}

/** 新增管理员 */
async function doCreate() {
  const valid = await createFormRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const createParams = {
      email: createForm.email,
      password: createForm.password,
      name: createForm.name,
      permissions: createForm.permissions,
    }
    await createAdminAccount(createParams)
    ElMessage.success('新增管理员成功')
    createVisible.value = false
    await loadData()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.error || '新增管理员失败')
  } finally {
    submitting.value = false
  }
}

/** 打开编辑弹窗 */
function openEditDialog(admin: User) {
  editingAdmin.value = admin
  editPermissions.value = [...admin.permissions!]
  editVisible.value = true
}

/** 保存权限修改 */
async function doUpdate() {
  if (!editingAdmin.value) return

  submitting.value = true
  try {
    const updateParams = { permissions: editPermissions.value }
    await updateAdminAccount(editingAdmin.value.id, updateParams)
    ElMessage.success('权限已更新')
    editVisible.value = false
    await loadData()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.error || '更新权限失败')
  } finally {
    submitting.value = false
  }
}

/** 删除管理员 */
async function doDelete(admin: User) {
  await confirmDelete({
    message: `确认删除管理员「${admin.name}」？`,
    onDelete: () => deleteAdminAccount(admin.id),
    onSuccess: loadData,
  })
}
</script>

<style lang="less" scoped>
.admin-page {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
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

  &__perm-tag {
    margin-right: 4px;
    margin-bottom: 2px;
  }

  &__perm-group {
    display: flex;
    flex-direction: column;
    gap: @spacing-sm;
  }

  &__perm-hint {
    font-size: 12px;
    color: @color-text-secondary;
  }
}
</style>
