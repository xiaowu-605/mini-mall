import { Router, Request, Response } from 'express'
import { requireAdmin } from '../middleware/admin'
import { prisma } from '../prisma'

const router = Router()
router.use(requireAdmin)

// 合法的状态流转：pending → paid → shipped → completed，任意状态 → cancelled
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

function isValidTransition(from: string, to: string): boolean {
  if (from === to) return true
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

// GET /api/admin/orders - 所有订单列表
router.get('/', async (_req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(orders)
  } catch (error) {
    console.error('获取订单列表失败:', error)
    res.status(500).json({ error: '获取订单列表失败' })
  }
})

// PUT /api/admin/orders/:id - 更新订单状态
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (Number.isNaN(id)) {
      res.status(400).json({ error: '参数错误' })
      return
    }

    const { status } = req.body
    const validStatuses = [
      'pending',
      'paid',
      'shipped',
      'completed',
      'cancelled',
    ]
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: '无效的状态' })
      return
    }

    // 校验状态流转合法性
    const currentOrder = await prisma.order.findUnique({
      where: { id },
      select: { status: true },
    })
    if (!currentOrder) {
      res.status(404).json({ error: '订单不存在' })
      return
    }
    if (!isValidTransition(currentOrder.status, status)) {
      const labels: Record<string, string> = {
        pending: '待付款',
        paid: '已支付',
        shipped: '已发货',
        completed: '已完成',
        cancelled: '已取消',
      }
      res.status(400).json({
        error: `不能将订单从「${labels[currentOrder.status] || currentOrder.status}」改为「${labels[status] || status}」`,
      })
      return
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
      },
    })

    res.json(order)
  } catch (error) {
    console.error('更新订单状态失败:', error)
    res.status(500).json({ error: '更新订单状态失败' })
  }
})

export default router
