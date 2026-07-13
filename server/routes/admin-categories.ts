import { Router, Request, Response } from 'express'
import { requireAdmin, requirePermission } from '../middleware/admin'
import { prisma } from '../prisma'

const router = Router()
router.use(requireAdmin)
router.use(requirePermission('manage_categories'))

// GET /api/admin/categories - 分类列表
router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { id: 'asc' },
    })
    res.json(categories)
  } catch (error) {
    console.error('获取分类列表失败:', error)
    res.status(500).json({ error: '获取分类列表失败' })
  }
})

// POST /api/admin/categories - 新增分类
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name } = req.body
    if (!name) {
      res.status(400).json({ error: '请输入分类名称' })
      return
    }

    const category = await prisma.category.create({ data: { name } })
    res.status(201).json(category)
  } catch (error) {
    console.error('新增分类失败:', error)
    res.status(500).json({ error: '新增分类失败' })
  }
})

// DELETE /api/admin/categories/:id - 删除分类
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (Number.isNaN(id)) {
      res.status(400).json({ error: '参数错误' })
      return
    }

    await prisma.category.delete({ where: { id } })
    res.json({ message: '已删除' })
  } catch (error) {
    console.error('删除分类失败:', error)
    res.status(500).json({ error: '删除分类失败，请确保该分类下无商品' })
  }
})

export default router
