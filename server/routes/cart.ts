import { Router, Request, Response } from 'express'
import { getCurrentUser } from '../lib/auth'
import { prisma } from '../prisma'

const router = Router()

// GET /api/cart - 获取当前用户的购物车
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      res.status(401).json({ error: '请先登录' })
      return
    }

    const items = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: { product: true },
    })

    res.json(items)
  } catch (error) {
    console.error('获取购物车失败:', error)
    res.status(500).json({ error: '获取购物车失败' })
  }
})

// POST /api/cart - 加入购物车
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      res.status(401).json({ error: '请先登录' })
      return
    }

    const { productId, quantity = 1 } = req.body

    if (!productId) {
      res.status(400).json({ error: '请指定商品' })
      return
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      res.status(400).json({ error: '数量不合法' })
      return
    }

    // 检查商品是否存在且有库存
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      res.status(404).json({ error: '商品不存在' })
      return
    }

    // 查出已有的购物车项
    const existing = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    })

    const newQuantity = (existing?.quantity || 0) + quantity
    if (newQuantity > product.stock) {
      res.status(400).json({ error: `库存不足，当前库存 ${product.stock} 件` })
      return
    }

    const item = await prisma.cartItem.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      create: { userId: user.id, productId, quantity },
      update: { quantity: newQuantity },
      include: { product: true },
    })

    res.status(201).json(item)
  } catch (error) {
    console.error('加入购物车失败:', error)
    res.status(500).json({ error: '加入购物车失败' })
  }
})

// PUT /api/cart/:id - 修改数量
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      res.status(401).json({ error: '请先登录' })
      return
    }

    const id = parseInt(req.params.id, 10)
    if (Number.isNaN(id)) {
      res.status(400).json({ error: '参数错误' })
      return
    }

    const { quantity } = req.body
    if (!Number.isInteger(quantity) || quantity < 0) {
      res.status(400).json({ error: '数量不合法' })
      return
    }

    // 查找该购物车项
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: { product: true },
    })

    if (!cartItem) {
      res.status(404).json({ error: '购物车项不存在' })
      return
    }

    if (cartItem.userId !== user.id) {
      res.status(403).json({ error: '无权操作' })
      return
    }

    // quantity 为 0 时删除
    if (quantity === 0) {
      await prisma.cartItem.delete({ where: { id } })
      res.json({ message: '已删除' })
      return
    }

    // 检查库存
    if (quantity > cartItem.product.stock) {
      res.status(400).json({ error: `库存不足，当前库存 ${cartItem.product.stock} 件` })
      return
    }

    const updated = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
      include: { product: true },
    })

    res.json(updated)
  } catch (error) {
    console.error('修改购物车失败:', error)
    res.status(500).json({ error: '修改购物车失败' })
  }
})

// DELETE /api/cart/:id - 删除某项
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      res.status(401).json({ error: '请先登录' })
      return
    }

    const id = parseInt(req.params.id, 10)
    if (Number.isNaN(id)) {
      res.status(400).json({ error: '参数错误' })
      return
    }

    const cartItem = await prisma.cartItem.findUnique({ where: { id } })
    if (!cartItem) {
      res.status(404).json({ error: '购物车项不存在' })
      return
    }

    if (cartItem.userId !== user.id) {
      res.status(403).json({ error: '无权操作' })
      return
    }

    await prisma.cartItem.delete({ where: { id } })
    res.json({ message: '已删除' })
  } catch (error) {
    console.error('删除购物车项失败:', error)
    res.status(500).json({ error: '删除购物车项失败' })
  }
})

export default router
