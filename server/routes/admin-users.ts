import { Router, Request, Response } from 'express'
import { requireAdmin, requirePermission } from '../middleware/admin'
import { prisma } from '../prisma'

const router = Router()
router.use(requireAdmin)

// GET /api/admin/users - 普通用户列表（所有管理员可查看）
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(req.query.pageSize as string) || 10),
    )
    const skip = (page - 1) * pageSize
    const { search } = req.query

    const where: any = { role: 'user' }

    // 按邮箱或用户名模糊搜索
    if (search) {
      const escaped = (search as string).replace(/[%_]/g, '\\$&')
      where.OR = [
        { email: { contains: escaped } },
        { name: { contains: escaped } },
      ]
    }

    const [list, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          memberLevel: true,
          totalSpent: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ])

    res.json({ list, total, page, pageSize })
  } catch (error) {
    console.error('获取用户列表失败:', error)
    res.status(500).json({ error: '获取用户列表失败' })
  }
})

// PUT /api/admin/users/:id/status - 拉黑/解除拉黑用户
router.put(
  '/:id/status',
  requirePermission('manage_users'),
  async (req: Request, res: Response) => {
    try {
      const targetId = parseInt(req.params.id, 10)
      if (Number.isNaN(targetId)) {
        res.status(400).json({ error: '参数错误' })
        return
      }

      const { status } = req.body
      if (!['active', 'blocked'].includes(status)) {
        res.status(400).json({ error: '状态值无效，仅允许 active 或 blocked' })
        return
      }

      const user = await prisma.user.update({
        where: { id: targetId },
        data: { status },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          memberLevel: true,
          totalSpent: true,
          createdAt: true,
        },
      })

      const label = status === 'blocked' ? '已拉黑' : '已解除拉黑'
      res.json({ ...user, message: `${label}用户「${user.name}」` })
    } catch (error) {
      console.error('更新用户状态失败:', error)
      res.status(500).json({ error: '更新用户状态失败' })
    }
  },
)

export default router
