import { Router, Request, Response } from 'express'
import { requireAdmin } from '../middleware/admin'
import { prisma } from '../prisma'

const router = Router()
router.use(requireAdmin)

/** 生成近 7 天日期数组（UTC+8）*/
function last7Days(): Date[] {
  const now = new Date()
  const offsetMs = 8 * 60 * 60 * 1000
  const days: Date[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() + offsetMs - i * 86400000)
    d.setUTCHours(0, 0, 0, 0)
    days.push(new Date(d.getTime() - offsetMs))
  }
  return days
}

// GET /api/admin/dashboard - 统计数据概览 + 图表数据
router.get('/', async (_req: Request, res: Response) => {
  try {
    const offsetMs = 8 * 60 * 60 * 1000
    const now = new Date()
    const chinaNow = new Date(now.getTime() + offsetMs)
    chinaNow.setUTCHours(0, 0, 0, 0)
    const todayStart = new Date(chinaNow.getTime() - offsetMs)

    const days = last7Days()

    const [
      totalOrders,
      revenueResult,
      pendingOrders,
      todayOrders,
      todayRevenueResult,
      totalUsers,
      totalProducts,
      // 近 7 天每日订单数
      orderTrendQuery,
      // 各分类商品数
      categoryDistribution,
      // 各状态订单数
      orderStatusDistribution,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { discountedTotal: true },
        where: { status: { in: ['paid', 'shipped', 'completed'] } },
      }),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.order.aggregate({
        _sum: { discountedTotal: true },
        where: {
          status: { in: ['paid', 'shipped', 'completed'] },
          createdAt: { gte: todayStart },
        },
      }),
      prisma.user.count(),
      prisma.product.count(),

      // 近 7 天订单趋势
      Promise.all(
        days.map(async (dayStart) => {
          const dayEnd = new Date(dayStart.getTime() + 86400000)
          const count = await prisma.order.count({
            where: { createdAt: { gte: dayStart, lt: dayEnd } },
          })
          return { date: dayStart.toISOString().slice(0, 10), count }
        }),
      ),

      // 分类商品分布
      prisma.category.findMany({
        select: { name: true, _count: { select: { products: true } } },
      }),

      // 订单状态分布
      Promise.all(
        ['pending', 'paid', 'shipped', 'completed', 'cancelled'].map(
          async (status) => {
            const count = await prisma.order.count({ where: { status } })
            return { status, count }
          },
        ),
      ),
    ])

    res.json({
      totalOrders,
      totalRevenue: revenueResult._sum.discountedTotal || 0,
      pendingOrders,
      todayOrders,
      todayRevenue: todayRevenueResult._sum.discountedTotal || 0,
      totalUsers,
      totalProducts,
      // 图表数据
      orderTrend: orderTrendQuery,
      categoryDistribution: categoryDistribution.map((c) => ({
        name: c.name,
        value: c._count.products,
      })),
      orderStatusDistribution,
    })
  } catch (error) {
    console.error('获取统计数据失败:', error)
    res.status(500).json({ error: '获取统计数据失败' })
  }
})

export default router
