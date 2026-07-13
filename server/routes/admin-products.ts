import { Router, Request, Response } from 'express'
import { requireAdmin, requirePermission } from '../middleware/admin'
import { prisma } from '../prisma'

const router = Router()
router.use(requireAdmin)
router.use(requirePermission('manage_products'))

// GET /api/admin/products - 商品列表
router.get('/', async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(products)
  } catch (error) {
    console.error('获取商品列表失败:', error)
    res.status(500).json({ error: '获取商品列表失败' })
  }
})

// POST /api/admin/products - 新增商品
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, price, image, stock, categoryId } = req.body

    // 必填字段校验
    if (!name || !name.trim()) {
      res.status(400).json({ error: '请输入商品名称' })
      return
    }
    if (
      price == null ||
      price === '' ||
      isNaN(parseFloat(price)) ||
      !isFinite(Number(price))
    ) {
      res.status(400).json({ error: '请输入有效价格' })
      return
    }
    if (!categoryId || isNaN(parseInt(categoryId))) {
      res.status(400).json({ error: '请选择有效分类' })
      return
    }

    // 校验分类是否存在
    const parsedCategoryId = parseInt(categoryId)
    const category = await prisma.category.findUnique({
      where: { id: parsedCategoryId },
    })
    if (!category) {
      res.status(400).json({ error: '所选分类不存在' })
      return
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description || '',
        price: parseFloat(price),
        image: image || null,
        stock: Math.max(0, parseInt(stock) || 0),
        categoryId: parsedCategoryId,
      },
      include: { category: true },
    })

    res.status(201).json(product)
  } catch (error) {
    console.error('新增商品失败:', error)
    res.status(500).json({ error: '新增商品失败' })
  }
})

// PUT /api/admin/products/:id - 更新商品
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (Number.isNaN(id)) {
      res.status(400).json({ error: '参数错误' })
      return
    }

    const { name, description, price, image, stock, categoryId } = req.body
    const data: any = {}

    // 按字段校验并构建更新数据
    if (name !== undefined) {
      if (!name.trim()) {
        res.status(400).json({ error: '商品名称不能为空' })
        return
      }
      data.name = name.trim()
    }
    if (description !== undefined) data.description = description
    if (price !== undefined) {
      if (
        price === '' ||
        isNaN(parseFloat(price)) ||
        !isFinite(Number(price))
      ) {
        res.status(400).json({ error: '请输入有效价格' })
        return
      }
      data.price = parseFloat(price)
    }
    if (image !== undefined) data.image = image || null
    if (stock !== undefined) {
      const parsed = parseInt(stock)
      if (isNaN(parsed) || parsed < 0) {
        res.status(400).json({ error: '库存不能为负数' })
        return
      }
      data.stock = parsed
    }
    if (categoryId !== undefined) {
      const parsedCid = parseInt(categoryId)
      if (isNaN(parsedCid)) {
        res.status(400).json({ error: '请选择有效分类' })
        return
      }
      const cat = await prisma.category.findUnique({ where: { id: parsedCid } })
      if (!cat) {
        res.status(400).json({ error: '所选分类不存在' })
        return
      }
      data.categoryId = parsedCid
    }

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    })

    res.json(product)
  } catch (error) {
    console.error('更新商品失败:', error)
    res.status(500).json({ error: '更新商品失败' })
  }
})

// DELETE /api/admin/products/:id - 删除商品
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (Number.isNaN(id)) {
      res.status(400).json({ error: '参数错误' })
      return
    }

    await prisma.product.delete({ where: { id } })
    res.json({ message: '已删除' })
  } catch (error: any) {
    console.error('删除商品失败:', error)
    // 外键约束：商品被订单引用
    if (error?.code === 'P2003') {
      res.status(400).json({ error: '该商品有关联订单，无法删除' })
      return
    }
    res.status(500).json({ error: '删除商品失败' })
  }
})

export default router
