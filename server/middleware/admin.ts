import { Request, Response, NextFunction } from 'express'
import { getSession } from '../lib/auth'

/** 验证当前用户是 ADMIN 角色 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const session = getSession(req)
  if (!session || session.role !== 'admin') {
    res.status(403).json({ error: '无权限访问' })
    return
  }
  next()
}
