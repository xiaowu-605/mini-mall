import { Router, Request, Response } from 'express'
import { requireAdmin } from '../middleware/admin'
import { prisma } from '../prisma'

const router = Router()
router.use(requireAdmin)

// GET /api/admin/dashboard - 统计数据概览
router.get('/', async (_req: Request, res: Response) => {
  try {
    // 今天 0 点（UTC+8 北京时间，部署时注意服务器时区设置）
    const now = new Date()
    const offsetMs = 8 * 60 * 60 * 1000 // UTC+8
    const chinaNow = new Date(now.getTime() + offsetMs)
    chinaNow.setUTCHours(0, 0, 0, 0)
    const todayStart = new Date(chinaNow.getTime() - offsetMs)

    // 并行查询所有统计数据
    const [
      totalOrders,
      revenueResult,
      pendingOrders,
      todayOrders,
      todayRevenueResult,
      totalUsers,
      totalProducts,
    ] = await Promise.all([
      prisma.order.count(),

      // 已支付/已发货/已完成订单的折后金额合计
      prisma.order.aggregate({
        _sum: { discountedTotal: true },
        where: { status: { in: ['paid', 'shipped', 'completed'] } },
      }),

      prisma.order.count({ where: { status: 'pending' } }),

      prisma.order.count({
        where: { createdAt: { gte: todayStart } },
      }),

      // 今日已支付/已发货/已完成订单的折后金额合计
      prisma.order.aggregate({
        _sum: { discountedTotal: true },
        where: {
          status: { in: ['paid', 'shipped', 'completed'] },
          createdAt: { gte: todayStart },
        },
      }),

      prisma.user.count(),

      prisma.product.count(),
    ])

    res.json({
      totalOrders,
      totalRevenue: revenueResult._sum.discountedTotal || 0,
      pendingOrders,
      todayOrders,
      todayRevenue: todayRevenueResult._sum.discountedTotal || 0,
      totalUsers,
      totalProducts,
    })
  } catch (error) {
    console.error('获取统计数据失败:', error)
    res.status(500).json({ error: '获取统计数据失败' })
  }
})

export default router
