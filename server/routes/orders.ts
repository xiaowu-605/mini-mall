import { Router, Request, Response } from 'express'
import { getCurrentUser } from '../lib/auth'
import { prisma } from '../prisma'

const router = Router()

// 会员折扣率
function getMemberDiscount(level: number): number {
  if (level >= 3) return 0.9
  if (level >= 2) return 0.95
  if (level >= 1) return 0.98
  return 1.0
}

// 累计消费 → 会员等级（只升不降）
function calcMemberLevel(totalSpent: number): number {
  if (totalSpent >= 3000) return 3
  if (totalSpent >= 2000) return 2
  if (totalSpent >= 1000) return 1
  return 0
}

// POST /api/orders - 从购物车创建订单
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      res.status(401).json({ error: '请先登录' })
      return
    }

    const { address, phone } = req.body
    if (!address || !phone) {
      res.status(400).json({ error: '请填写收货地址和联系电话' })
      return
    }

    // 获取购物车（含商品信息）
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: { product: true },
    })

    if (cartItems.length === 0) {
      res.status(400).json({ error: '购物车为空' })
      return
    }

    // 检查库存，找出缺货商品
    const insufficient: string[] = []
    for (const item of cartItems) {
      if (item.quantity > item.product.stock) {
        insufficient.push(`${item.product.name}（库存 ${item.product.stock} 件）`)
      }
    }
    if (insufficient.length > 0) {
      res.status(400).json({ error: `以下商品库存不足：${insufficient.join('、')}` })
      return
    }

    // 计算金额
    const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const discount = getMemberDiscount(user.memberLevel)
    const discountedTotal = Math.round(total * discount * 100) / 100

    // 事务：创建订单 + 扣减库存 + 清空购物车
    const order = await prisma.$transaction(async (tx) => {
      // 创建订单
      const created = await tx.order.create({
        data: {
          userId: user.id,
          status: 'pending',
          total,
          discount,
          discountedTotal,
          address,
          phone,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      })

      // 扣减库存
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      }

      // 清空购物车
      await tx.cartItem.deleteMany({ where: { userId: user.id } })

      return created
    })

    res.status(201).json(order)
  } catch (error) {
    console.error('创建订单失败:', error)
    res.status(500).json({ error: '创建订单失败，请稍后重试' })
  }
})

// GET /api/orders - 我的订单列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      res.status(401).json({ error: '请先登录' })
      return
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
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

// GET /api/orders/:id - 订单详情
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      res.status(401).json({ error: '请先登录' })
      return
    }

    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      res.status(400).json({ error: '无效的订单 ID' })
      return
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
      },
    })

    if (!order || order.userId !== user.id) {
      res.status(404).json({ error: '订单不存在' })
      return
    }

    res.json(order)
  } catch (error) {
    console.error('获取订单详情失败:', error)
    res.status(500).json({ error: '获取订单详情失败' })
  }
})

// PUT /api/orders/:id - 模拟支付（PENDING → PAID）
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      res.status(401).json({ error: '请先登录' })
      return
    }

    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      res.status(400).json({ error: '无效的订单 ID' })
      return
    }

    const { action } = req.body

    // 模拟支付
    if (action === 'pay') {
      const order = await prisma.order.findUnique({ where: { id } })
      if (!order || order.userId !== user.id) {
        res.status(404).json({ error: '订单不存在' })
        return
      }
      if (order.status !== 'pending') {
        res.status(400).json({ error: '该订单无法支付' })
        return
      }

      // 事务：更新订单状态 + 累加消费金额 + 升级会员
      const updated = await prisma.$transaction(async (tx) => {
        const paid = await tx.order.update({
          where: { id },
          data: { status: 'paid' },
          include: { items: { include: { product: true } } },
        })

        // 累加消费并计算新等级
        const newTotalSpent = user.totalSpent + paid.discountedTotal
        const newLevel = calcMemberLevel(newTotalSpent)
        await tx.user.update({
          where: { id: user.id },
          data: {
            totalSpent: newTotalSpent,
            memberLevel: Math.max(user.memberLevel, newLevel),
          },
        })

        return paid
      })

      res.json(updated)
      return
    }

    // 取消订单
    if (action === 'cancel') {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { items: true },
      })
      if (!order || order.userId !== user.id) {
        res.status(404).json({ error: '订单不存在' })
        return
      }
      if (order.status === 'cancelled') {
        res.status(400).json({ error: '订单已取消' })
        return
      }

      // 事务：取消订单 + 恢复库存
      await prisma.$transaction(async (tx) => {
        await tx.order.update({ where: { id }, data: { status: 'cancelled' } })
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          })
        }
      })

      res.json({ message: '订单已取消' })
      return
    }

    res.status(400).json({ error: '无效操作' })
  } catch (error) {
    console.error('操作订单失败:', error)
    res.status(500).json({ error: '操作订单失败' })
  }
})

export default router
