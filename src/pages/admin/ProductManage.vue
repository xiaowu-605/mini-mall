<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <h2>商品管理</h2>
      <el-button
        type="primary"
        v-permission="'manage_products'"
        @click="openDialog(null)"
        >新增商品</el-button
      >
    </div>

    <!-- 筛选栏 -->
    <div class="admin-page__filters">
      <el-input
        v-model="searchQuery"
        placeholder="搜索商品名称..."
        clearable
        style="width: 220px"
        @input="onSearch"
        @clear="onSearch"
      />
      <el-select
        v-model="filterCategoryId"
        placeholder="全部分类"
        clearable
        style="width: 160px"
        @change="onFilterChange"
      >
        <el-option
          v-for="cat in categories"
          :key="cat.id"
          :label="cat.name"
          :value="cat.id"
        />
      </el-select>
      <el-checkbox
        v-model="filterZeroStock"
        @change="onFilterChange"
      >
        仅显示库存为 0
      </el-checkbox>
    </div>

    <el-table
      :data="products"
      :border="true"
      stripe
      v-loading="loading"
    >
      <template #empty>
        <span v-if="error">加载失败，请刷新重试</span>
        <span v-else>暂无商品</span>
      </template>
      <el-table-column
        prop="id"
        label="ID"
        width="60"
      />
      <el-table-column
        label="图片"
        width="80"
      >
        <template #default="{ row }">
          <el-image
            v-if="row.image"
            :src="row.image"
            :preview-src-list="[row.image]"
            fit="cover"
            preview-teleported
            style="width: 60px; height: 60px; border-radius: 4px"
          />
          <span
            v-else
            class="admin-page__no-image"
            >-</span
          >
        </template>
      </el-table-column>
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
            v-permission="'manage_products'"
            @click="openDialog(row)"
            >编辑</el-button
          >
          <el-button
            size="small"
            type="danger"
            v-permission="'manage_products'"
            @click="doDelete(row.id)"
            >删除</el-button
          >
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
        <el-form-item label="商品图片">
          <div class="admin-page__upload">
            <el-upload
              :action="UPLOAD_URL"
              :show-file-list="false"
              :on-success="onUploadSuccess"
              :on-error="onUploadError"
              :before-upload="beforeUpload"
              accept="image/jpeg,image/png,image/gif,image/webp"
              drag
            >
              <img
                v-if="form.image"
                :src="form.image"
                class="admin-page__upload-preview"
              />
              <div
                v-else
                class="admin-page__upload-placeholder"
              >
                <el-icon :size="32"><UploadFilled /></el-icon>
                <span>点击或拖拽上传图片</span>
              </div>
            </el-upload>
            <el-input
              v-model="form.image"
              placeholder="或手动输入图片 URL"
              clearable
            />
          </div>
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
import { UploadFilled } from '@element-plus/icons-vue'
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  getAdminCategories,
} from '@/api/admin'
import { useDeleteConfirm } from '@/hooks/useDeleteConfirm'
import { createDebounce } from '@/utils/debounce'
import type { Product, ProductQueryParams } from '@/types'

/** 图片上传接口地址 */
const UPLOAD_URL = '/api/admin/upload'

let products = ref<Product[]>([])
let categories = ref<any[]>([])
let loading = ref(false)
const error = ref(false)
let dialogVisible = ref(false)
let submitting = ref(false)
const editingProduct = ref<Product | null>(null)

/** 分页状态 */
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

/** 筛选状态 */
let searchQuery = ref('')
let filterCategoryId = ref<number | null>(null)
let filterZeroStock = ref(false)

const debounce = createDebounce(300)

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

/** 页面初始化：加载分类和商品 */
onMounted(() => {
  loadCategories()
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

/** 构建商品查询参数 */
function buildQueryParams(): ProductQueryParams {
  const queryParams: ProductQueryParams = {
    page: page.value,
    pageSize: pageSize.value,
  }
  if (searchQuery.value) queryParams.search = searchQuery.value
  if (filterCategoryId.value) queryParams.categoryId = filterCategoryId.value
  if (filterZeroStock.value) queryParams.stockZero = true
  return queryParams
}

/** 加载分类列表（仅页面初始化时调用一次） */
async function loadCategories() {
  try {
    const cRes = await getAdminCategories()
    categories.value = cRes.data
  } catch (e) {
    console.error('加载分类失败:', e)
  }
}

/** 加载商品数据 */
async function loadData() {
  loading.value = true
  error.value = false
  try {
    const productParams = buildQueryParams()
    const pRes = await getAdminProducts(productParams)
    products.value = pRes.data.list
    total.value = pRes.data.total
  } catch (e) {
    error.value = true
    console.error('加载数据失败:', e)
  } finally {
    loading.value = false
  }
}

/** pageSize 变更时重置到第一页 */
function onPageSizeChange() {
  page.value = 1
  loadData()
}

/** 搜索防抖处理：重置页码并重新加载 */
function onSearch() {
  debounce(() => {
    page.value = 1
    loadData()
  })
}

/** 分类筛选或零库存筛选变更时重置页码并重新加载 */
function onFilterChange() {
  page.value = 1
  loadData()
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
  } catch (e) {
    console.error(e)
    // 错误提示已由拦截器统一处理
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

/** 上传前校验文件类型和大小 */
function beforeUpload(file: File) {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowed.includes(file.type)) {
    ElMessage.error('仅支持 JPEG、PNG、GIF、WebP 格式的图片')
    return false
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  return true
}

/** 上传成功回调：将返回的 URL 填入表单 */
function onUploadSuccess(res: { url: string }) {
  if (!res?.url) {
    ElMessage.error('上传返回数据异常')
    return
  }
  form.image = res.url
  ElMessage.success('图片上传成功')
}

/** 上传失败回调 */
function onUploadError() {
  ElMessage.error('图片上传失败，请重试')
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
    display: flex;
    align-items: center;
    gap: @spacing-sm;
    margin-bottom: @spacing-md;
  }

  &__no-image {
    color: @color-text-secondary;
    font-size: 13px;
  }

  &__pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: @spacing-md;
  }

  &__upload {
    width: 100%;
  }

  &__upload-preview {
    max-width: 100%;
    max-height: 180px;
    object-fit: contain;
  }

  &__upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: @spacing-sm;
    color: @color-text-secondary;
    font-size: 14px;
    padding: @spacing-md 0;
  }
}
</style>
