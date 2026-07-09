/** 分类 */
export interface Category {
  id: number
  name: string
  productCount?: number
}

/** 商品 */
export interface Product {
  id: number
  name: string
  description: string
  price: number
  image: string | null
  stock: number
  categoryId: number
  category?: Category
  createdAt: string
  updatedAt: string
}
