<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <h2>分类管理</h2>
      <el-button type="primary" @click="openAddDialog">新增分类</el-button>
    </div>

    <el-table :data="categories" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="名称" min-width="200" />
      <el-table-column label="商品数" width="100">
        <template #default="{ row }">{{ row._count?.products || 0 }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button size="small" type="danger" @click="doDelete(row.id, row.name)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增弹窗 -->
    <el-dialog v-model="dialogVisible" title="新增分类" width="400px">
      <el-input v-model="newName" placeholder="请输入分类名称" />
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="doCreate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminCategories, createAdminCategory, deleteAdminCategory } from '@/api/admin'

const categories = ref<any[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const submitting = ref(false)
const newName = ref('')

async function loadCategories() {
  loading.value = true
  try {
    const res = await getAdminCategories()
    categories.value = res.data
  } catch (e) {
    console.error('加载分类失败:', e)
  } finally {
    loading.value = false
  }
}

function openAddDialog() {
  newName.value = ''
  dialogVisible.value = true
}

async function doCreate() {
  if (!newName.value.trim()) {
    ElMessage.warning('请输入分类名称')
    return
  }
  submitting.value = true
  try {
    const createParams = { name: newName.value.trim() }
    await createAdminCategory(createParams.name)
    ElMessage.success('新增成功')
    dialogVisible.value = false
    await loadCategories()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.error || '新增失败')
  } finally {
    submitting.value = false
  }
}

async function doDelete(id: number, name: string) {
  try {
    await ElMessageBox.confirm(`确认删除分类「${name}」？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch {
    // 用户取消对话框
    return
  }

  try {
    await deleteAdminCategory(id)
    ElMessage.success('已删除')
    await loadCategories()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.error || '删除失败')
  }
}

onMounted(() => {
  loadCategories()
})
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
}
</style>
