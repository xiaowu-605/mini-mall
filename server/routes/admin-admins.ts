import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { requireAdmin, requirePermission } from '../middleware/admin'
import { prisma } from '../prisma'

/** 允许分配的权限白名单 */
const VALID_PERMISSIONS = [
  'super_admin',
  'manage_products',
  'manage_orders',
  'manage_categories',
  'manage_users',
]

const router = Router()
router.use(requireAdmin)
router.use(requirePermission('super_admin'))

// GET /api/admin/admins - 管理员列表（搜索 + 分页），仅 role='admin'
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(req.query.pageSize as string) || 10),
    )
    const skip = (page - 1) * pageSize
    const { search } = req.query

    const where: any = { role: 'admin' }

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
          permissions: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ])

    // 解析 permissions JSON 字符串
    const parsedList = list.map((u) => {
      let perms: string[] = []
      try {
        perms = u.permissions ? JSON.parse(u.permissions) : []
      } catch {
        perms = []
      }
      return { ...u, permissions: perms }
    })

    res.json({ list: parsedList, total, page, pageSize })
  } catch (error) {
    console.error('获取管理员列表失败:', error)
    res.status(500).json({ error: '获取管理员列表失败' })
  }
})

// POST /api/admin/admins - 新增管理员
router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, password, name, permissions } = req.body

    if (!email || !password || !name) {
      res.status(400).json({ error: '请填写完整信息' })
      return
    }

    if (password.length < 6) {
      res.status(400).json({ error: '密码长度不能少于 6 位' })
      return
    }

    // 校验邮箱唯一性
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      res.status(409).json({ error: '该邮箱已被注册' })
      return
    }

    // 校验权限白名单
    if (permissions) {
      if (!Array.isArray(permissions)) {
        res.status(400).json({ error: '权限格式错误' })
        return
      }
      for (const p of permissions) {
        if (!VALID_PERMISSIONS.includes(p)) {
          res.status(400).json({ error: `无效的权限值: ${p}` })
          return
        }
      }
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        role: 'admin',
        permissions: JSON.stringify(permissions || []),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: true,
        createdAt: true,
      },
    })

    let perms: string[] = []
    try {
      perms = user.permissions ? JSON.parse(user.permissions) : []
    } catch {
      perms = []
    }

    res.status(201).json({ ...user, permissions: perms })
  } catch (error) {
    console.error('新增管理员失败:', error)
    res.status(500).json({ error: '新增管理员失败' })
  }
})

// PUT /api/admin/admins/:id - 编辑管理员权限
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const targetId = parseInt(req.params.id, 10)
    if (Number.isNaN(targetId)) {
      res.status(400).json({ error: '参数错误' })
      return
    }

    const currentUser = (req as any).currentUser

    if (targetId === currentUser.id) {
      res.status(400).json({ error: '不能修改自己的权限' })
      return
    }

    const { permissions } = req.body

    if (!Array.isArray(permissions)) {
      res.status(400).json({ error: '权限格式错误' })
      return
    }
    for (const p of permissions) {
      if (!VALID_PERMISSIONS.includes(p)) {
        res.status(400).json({ error: `无效的权限值: ${p}` })
        return
      }
    }

    const user = await prisma.user.update({
      where: { id: targetId },
      data: { permissions: JSON.stringify(permissions) },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: true,
        createdAt: true,
      },
    })

    let perms: string[] = []
    try {
      perms = user.permissions ? JSON.parse(user.permissions) : []
    } catch {
      perms = []
    }

    res.json({ ...user, permissions: perms })
  } catch (error) {
    console.error('更新管理员失败:', error)
    res.status(500).json({ error: '更新管理员失败' })
  }
})

// DELETE /api/admin/admins/:id - 删除管理员
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const targetId = parseInt(req.params.id, 10)
    if (Number.isNaN(targetId)) {
      res.status(400).json({ error: '参数错误' })
      return
    }

    const currentUser = (req as any).currentUser

    if (targetId === currentUser.id) {
      res.status(400).json({ error: '不能删除自己的账号' })
      return
    }

    await prisma.user.delete({ where: { id: targetId } })
    res.json({ message: '已删除' })
  } catch (error) {
    console.error('删除管理员失败:', error)
    res.status(500).json({ error: '删除管理员失败' })
  }
})

export default router
