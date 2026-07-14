import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { requireAdmin, requirePermission } from '../middleware/admin'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 上传文件存储配置：保存到 public/uploads/ 目录
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, path.resolve(__dirname, '../../public/uploads'))
  },
  filename(_req, file, cb) {
    // 时间戳 + 随机数 + 原扩展名，避免文件名冲突
    const ext = path.extname(file.originalname)
    const baseName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${baseName}${ext}`)
  },
})

// 仅允许图片类型，限制 5MB
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('仅支持 JPEG、PNG、GIF、WebP 格式的图片'))
    }
  },
})

const router = Router()
router.use(requireAdmin)
router.use(requirePermission('manage_products'))

// POST /api/admin/upload - 上传图片，返回访问 URL
router.post('/', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: '请选择要上传的图片' })
      return
    }
    const url = `/uploads/${req.file.filename}`
    res.json({ url })
  } catch (error) {
    console.error('图片上传失败:', error)
    res.status(500).json({ error: '图片上传失败' })
  }
})

export default router
