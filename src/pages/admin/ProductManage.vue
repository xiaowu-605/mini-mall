<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <h2>商品管理</h2>
      <el-button
        type="primary"
        @click="openDialog(null)"
        >新增商品</el-button
      >
    </div>

    <el-table
      :data="products"
      :border="true"
      stripe
      v-loading="loading"
    >
      <el-table-column
        prop="id"
        label="ID"
        width="60"
      />
      <el-table-column
        prop="name"
        label="名称"
        min-width="150"
      />
      <el-table-column
        label="分类"
        width="100"
      >
        <template #default="{ row }">{{ row.category?.name }}</template>
      </el-table-column>
      <el-table-column
        prop="price"
        label="价格"
        width="100"
      />
      <el-table-column
        prop="stock"
        label="库存"
        width="80"
      />
      <el-table-column
        label="操作"
        width="160"
      >
        <template #default="{ row }">
          <el-button
            size="small"
            @click="openDialog(row)"
            >编辑</el-button
          >
          <el-button
            size="small"
            type="danger"
            @click="doDelete(row.id)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      :model-value="dialogVisible"
      :title="editingProduct ? '编辑商品' : '新增商品'"
      width="500px"
      @close="dialogVisible = false"
    >
      <el-form
        :model="form"
        label-width="80px"
      >
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select
            v-model="form.categoryId"
            placeholder="请选择分类"
          >
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="价格">
          <el-input-number
            v-model="form.price"
            :min="0"
            :precision="2"
          />
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number
            v-model="form.stock"
            :min="0"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
          />
        </el-form-item>
        <el-form-item label="图片URL">
          <el-input
            v-model="form.image"
            placeholder="可选"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="doSave"
          >保存</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
} from '@/api/admin'
import { getAdminCategories } from '@/api/admin'
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm'
import type { Product } from '@/types'

let products = ref<Product[]>([])
let categories = ref<any[]>([])
let loading = ref(false)
let dialogVisible = ref(false)
let submitting = ref(false)
const editingProduct = ref<Product | null>(null)

const { confirm: confirmDelete } = useDeleteConfirm()

// 商品编辑表单：名称/分类/价格/库存/描述/图片
const form = reactive({
  name: '',
  description: '',
  price: 0,
  stock: 0,
  image: '',
  categoryId: null as number | null,
})

/** 页面初始化：加载数据 */
onMounted(() => {
  loadData()
})

/** 重置表单 */
function resetForm() {
  form.name = ''
  form.description = ''
  form.price = 0
  form.stock = 0
  form.image = ''
  form.categoryId = null
}

/** 打开新增/编辑弹窗 */
function openDialog(product: Product | null) {
  editingProduct.value = product
  if (product) {
    form.name = product.name
    form.description = product.description
    form.price = product.price
    form.stock = product.stock
    form.image = product.image || ''
    form.categoryId = product.categoryId
  } else {
    resetForm()
  }
  dialogVisible.value = true
}

/** 加载商品和分类数据 */
async function loadData() {
  loading.value = true
  try {
    const [pRes, cRes] = await Promise.all([getAdminProducts(), getAdminCategories()])
    products.value = pRes.data
    categories.value = cRes.data
  } catch (e) {
    console.error('加载数据失败:', e)
  } finally {
    loading.value = false
  }
}

/** 保存商品 */
async function doSave() {
  if (!form.name || !form.categoryId) {
    ElMessage.warning('请填写名称和分类')
    return
  }
  submitting.value = true
  try {
    if (editingProduct.value) {
      await updateAdminProduct(editingProduct.value.id, form)
      ElMessage.success('更新成功')
    } else {
      await createAdminProduct(form)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    await loadData()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  } finally {
    submitting.value = false
  }
}

/** 删除商品 */
async function doDelete(id: number) {
  await confirmDelete({
    message: '确认删除该商品？',
    onDelete: () => deleteAdminProduct(id),
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
}
</style>
