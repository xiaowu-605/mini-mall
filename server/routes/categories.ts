import { Router, Request, Response } from 'express'
import { prisma } from '../prisma'

const router = Router()

// GET /api/categories - 分类列表（含商品数量）
router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { id: 'asc' },
    })

    const data = categories.map((c) => ({
      id: c.id,
      name: c.name,
      productCount: c._count.products,
    }))

    res.json(data)
  } catch (error) {
    console.error('获取分类列表失败:', error)
    res.status(500).json({ error: '获取分类列表失败' })
  }
})

export default router
