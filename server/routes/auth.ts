import { Router, Request, Response } from 'express'
import {
  hashPassword,
  verifyPassword,
  setSession,
  getCurrentUser,
  clearSession,
} from '../lib/auth'
import { prisma } from '../prisma'

const router = Router()

// POST /api/auth/register - 注册
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body

    // 参数校验
    if (!email || !password || !name) {
      res.status(400).json({ error: '请填写完整信息' })
      return
    }

    // 邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: '邮箱格式不正确' })
      return
    }

    // 密码长度
    if (password.length < 6) {
      res.status(400).json({ error: '密码长度不能少于 6 位' })
      return
    }

    // 检查邮箱唯一性
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      res.status(409).json({ error: '该邮箱已被注册' })
      return
    }

    // 创建用户
    const hashed = await hashPassword(password)
    const user = await prisma.user.create({
      data: { email, password: hashed, name },
    })

    // 写入 session
    setSession(res, user.id, user.role)

    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
  } catch (error) {
    console.error('注册失败:', error)
    res.status(500).json({ error: '注册失败，请稍后重试' })
  }
})

// POST /api/auth/login - 登录
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      // 不区分"用户不存在"和"密码错误"，统一返回模糊提示防止撞库
      res.status(401).json({ error: '邮箱或密码不正确' })
      return
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      res.status(401).json({ error: '邮箱或密码不正确' })
      return
    }

    const valid = await verifyPassword(password, user.password)
    if (!valid) {
      res.status(401).json({ error: '邮箱或密码不正确' })
      return
    }

    // 写入 session
    setSession(res, user.id, user.role)

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
  } catch (error) {
    console.error('登录失败:', error)
    res.status(500).json({ error: '登录失败，请稍后重试' })
  }
})

// GET /api/auth/me - 获取当前用户
router.get('/me', async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      res.status(401).json({ error: '未登录' })
      return
    }
    res.json(user)
  } catch (error) {
    console.error('获取用户信息失败:', error)
    res.status(500).json({ error: '获取用户信息失败' })
  }
})

// GET /api/auth/demo-accounts - 演示账号列表（仅开发环境一键填入）
router.get('/demo-accounts', async (_req: Request, res: Response) => {
  try {
    // 已知演示账号密码映射（与 seed.ts 保持一致）
    const DEMO_PASSWORDS: Record<string, string> = {
      'admin@mini-mall.com': 'admin123',
      'user@mini-mall.com': 'user123',
      'vip@mini-mall.com': 'vip123',
    }

    const users = await prisma.user.findMany({
      where: { email: { in: Object.keys(DEMO_PASSWORDS) } },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        memberLevel: true,
      },
    })

    const accounts = users.map((u) => ({
      ...u,
      password: DEMO_PASSWORDS[u.email] || '',
      roleLabel: u.role === 'admin' ? '管理员' : `会员 Lv.${u.memberLevel}`,
    }))

    res.json(accounts)
  } catch (error) {
    console.error('获取演示账号失败:', error)
    res.status(500).json({ error: '获取演示账号失败' })
  }
})

// POST /api/auth/logout - 退出登录
router.post('/logout', (_req: Request, res: Response) => {
  clearSession(res)
  res.json({ message: '已退出登录' })
})

export default router
