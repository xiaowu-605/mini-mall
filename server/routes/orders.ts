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
    if (!address?.trim() || !phone?.trim()) {
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

    // 计算金额
    const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const discount = getMemberDiscount(user.memberLevel)
    const discountedTotal = Math.round(total * discount * 100) / 100

    // 事务：校验库存 + 创建订单 + 扣减库存 + 清空购物车
    const order = await prisma.$transaction(async (tx) => {
      // 在事务内重新检查库存（防止 TOCTOU 竞态）
      const insufficient: string[] = []
      for (const item of cartItems) {
        const currentProduct = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true, name: true },
        })
        if (!currentProduct || item.quantity > currentProduct.stock) {
          insufficient.push(
            `${currentProduct?.name || '未知商品'}（库存 ${currentProduct?.stock || 0} 件）`,
          )
        }
      }
      if (insufficient.length > 0) {
        throw { status: 400, message: `以下商品库存不足：${insufficient.join('、')}` }
      }

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
  } catch (error: any) {
    if (error.status && error.message) {
      res.status(error.status).json({ error: error.message })
      return
    }
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

    const id = parseInt(req.params.id, 10)
    if (Number.isNaN(id)) {
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

// PUT /api/orders/:id - 支付/取消
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      res.status(401).json({ error: '请先登录' })
      return
    }

    const id = parseInt(req.params.id, 10)
    if (Number.isNaN(id)) {
      res.status(400).json({ error: '无效的订单 ID' })
      return
    }

    const { action } = req.body

    // 模拟支付
    if (action === 'pay') {
      const updated = await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { id } })
        if (!order || order.userId !== user.id) {
          throw { status: 404, message: '订单不存在' }
        }
        if (order.status !== 'pending') {
          throw { status: 400, message: '该订单无法支付' }
        }

        const paid = await tx.order.update({
          where: { id },
          data: { status: 'paid' },
          include: { items: { include: { product: true } } },
        })

        // 在事务内读取最新的用户数据，防止并发支付时读到过期的 totalSpent
        const currentUser = await tx.user.findUnique({
          where: { id: user.id },
          select: { totalSpent: true, memberLevel: true },
        })

        const newTotalSpent = (currentUser?.totalSpent || 0) + paid.discountedTotal
        const newLevel = calcMemberLevel(newTotalSpent)
        const finalLevel = Math.max(currentUser?.memberLevel || 0, newLevel)

        await tx.user.update({
          where: { id: user.id },
          data: {
            totalSpent: newTotalSpent,
            memberLevel: finalLevel,
          },
        })

        return paid
      })

      res.json(updated)
      return
    }

    // 取消订单
    if (action === 'cancel') {
      await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id },
          include: { items: true },
        })
        if (!order || order.userId !== user.id) {
          throw { status: 404, message: '订单不存在' }
        }
        if (order.status !== 'pending') {
          throw { status: 400, message: '该订单无法取消' }
        }

        // 在事务内先更新状态，防止并发取消重复恢复库存
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
  } catch (error: any) {
    if (error.status && error.message) {
      res.status(error.status).json({ error: error.message })
      return
    }
    console.error('操作订单失败:', error)
    res.status(500).json({ error: '操作订单失败' })
  }
})

export default router
