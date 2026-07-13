import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { Request, Response } from 'express'
import { prisma } from '../prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'mini-mall-dev-secret-key'
const COOKIE_NAME = 'mini-mall-session'
const TOKEN_EXPIRY = '24h'

/** 哈希密码 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

/** 验证密码 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/** 签发 JWT 并写入 httpOnly Cookie */
export function setSession(res: Response, userId: number, role: string): void {
  const token = jwt.sign({ userId, role }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  })
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 小时
    path: '/',
  })
}

/** 从 Cookie 读取并验证 JWT，返回 payload 或 null */
export function getSession(
  req: Request,
): { userId: number; role: string } | null {
  try {
    const token = req.cookies?.[COOKIE_NAME]
    if (!token) return null
    return jwt.verify(token, JWT_SECRET) as { userId: number; role: string }
  } catch {
    return null
  }
}

/** 获取当前登录用户的完整信息 */
export async function getCurrentUser(req: Request) {
  const session = getSession(req)
  if (!session) return null

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      permissions: true,
      memberLevel: true,
      totalSpent: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

/** 清除 Cookie（退出登录） */
export function clearSession(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: '/' })
}
