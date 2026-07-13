import { Request, Response, NextFunction } from 'express'
import { getCurrentUser } from '../lib/auth'

/** 验证当前用户是 ADMIN 角色（查数据库确保角色变更即时生效） */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await getCurrentUser(req)
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: '无权限访问' })
      return
    }
    // 将用户信息挂载到 request，供后续权限检查使用
    ;(req as any).currentUser = user
    next()
  } catch {
    res.status(500).json({ error: '权限校验失败' })
  }
}

/**
 * 创建需要特定权限的中间件
 * super_admin 拥有所有权限，无需额外指定
 * 用法：router.use(requirePermission('manage_products'))
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).currentUser
    if (!user) {
      res.status(403).json({ error: '无权限访问' })
      return
    }
    // 解析 permissions JSON 字段
    let perms: string[] = []
    try {
      perms = user.permissions
        ? typeof user.permissions === 'string'
          ? JSON.parse(user.permissions)
          : user.permissions
        : []
    } catch {
      perms = []
    }
    // super_admin 拥有所有权限
    if (perms.includes('super_admin') || perms.includes(permission)) {
      next()
      return
    }
    res.status(403).json({ error: '无权限执行此操作' })
  }
}
