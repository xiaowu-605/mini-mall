import { Router, Request, Response } from 'express'
import { requireAdmin } from '../middleware/admin'
import { prisma } from '../prisma'

const router = Router()
router.use(requireAdmin)

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
    if (!name || price == null || !categoryId) {
      res.status(400).json({ error: '请填写必填字段' })
      return
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || '',
        price: parseFloat(price),
        image: image || null,
        stock: parseInt(stock) || 0,
        categoryId: parseInt(categoryId),
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
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(image !== undefined && { image }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(categoryId !== undefined && { categoryId: parseInt(categoryId) }),
      },
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
  } catch (error) {
    console.error('删除商品失败:', error)
    res.status(500).json({ error: '删除商品失败' })
  }
})

export default router
