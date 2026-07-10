import { Request, Response, NextFunction } from 'express'
import { getCurrentUser } from '../lib/auth'

/** 验证当前用户是 ADMIN 角色（查数据库确保角色变更即时生效） */
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await getCurrentUser(req)
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: '无权限访问' })
      return
    }
    next()
  } catch {
    res.status(500).json({ error: '权限校验失败' })
  }
}
