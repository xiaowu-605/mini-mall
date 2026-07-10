import { Router, Request, Response } from 'express'
import { prisma } from '../prisma'

const router = Router()

// GET /api/products - 商品列表（搜索、分类筛选、分页）
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, categoryId, page = '1', pageSize = '9' } = req.query

    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const size = Math.max(1, Math.min(50, parseInt(pageSize as string) || 9))
    const skip = (pageNum - 1) * size

    // 构建查询条件
    const where: any = {}

    if (search) {
      where.name = { contains: search as string }
    }

    if (categoryId) {
      const parsed = parseInt(categoryId as string)
      if (!Number.isNaN(parsed)) {
        where.categoryId = parsed
      }
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        skip,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ])

    res.json({
      data: products,
      total,
      page: pageNum,
      pageSize: size,
      totalPages: Math.ceil(total / size),
    })
  } catch (error) {
    console.error('获取商品列表失败:', error)
    res.status(500).json({ error: '获取商品列表失败' })
  }
})

// GET /api/products/:id - 商品详情
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      res.status(400).json({ error: '无效的商品 ID' })
      return
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    })

    if (!product) {
      res.status(404).json({ error: '商品不存在' })
      return
    }

    res.json(product)
  } catch (error) {
    console.error('获取商品详情失败:', error)
    res.status(500).json({ error: '获取商品详情失败' })
  }
})

export default router
