import { Router, Request, Response } from 'express'
import { requireAdmin, requirePermission } from '../middleware/admin'
import { prisma } from '../prisma'

const router = Router()
router.use(requireAdmin)
router.use(requirePermission('manage_orders'))

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

// GET /api/admin/orders - 订单列表（搜索 + 筛选）
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, status, startDate, endDate } = req.query

    // 构建筛选条件
    const where: any = {}

    // 按订单号精确匹配 或 用户名模糊搜索
    if (search) {
      const searchStr = search as string
      const orderId = parseInt(searchStr)
      if (!Number.isNaN(orderId)) {
        where.id = orderId
      } else {
        // 非数字则按用户名搜索
        where.user = { name: { contains: searchStr } }
      }
    }

    // 按订单状态筛选
    if (status) {
      where.status = status as string
    }

    // 按时间范围筛选
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string)
      }
      if (endDate) {
        // 结束日期包含当天全天
        const end = new Date(endDate as string)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    const orders = await prisma.order.findMany({
      where,
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

    // 取消订单时恢复库存（事务保证原子性）
    if (status === 'cancelled') {
      const order = await prisma.$transaction(async (tx) => {
        // 先更新状态，防止并发重复恢复库存
        const updated = await tx.order.update({
          where: { id },
          data: { status: 'cancelled' },
          include: {
            user: { select: { id: true, name: true, email: true } },
            items: { include: { product: true } },
          },
        })

        // 逐项恢复库存
        for (const item of updated.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          })
        }

        return updated
      })

      res.json(order)
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
