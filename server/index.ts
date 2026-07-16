import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import productsRouter from './routes/products'
import categoriesRouter from './routes/categories'
import authRouter from './routes/auth'
import cartRouter from './routes/cart'
import ordersRouter from './routes/orders'
import adminProductsRouter from './routes/admin-products'
import adminOrdersRouter from './routes/admin-orders'
import adminCategoriesRouter from './routes/admin-categories'
import adminUploadRouter from './routes/admin-upload'
import adminDashboardRouter from './routes/admin-dashboard'
import adminUsersRouter from './routes/admin-users'
import adminAdminsRouter from './routes/admin-admins'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(cookieParser())

// 托管上传文件的 public 目录
app.use(express.static(path.resolve(__dirname, '../public')))

// 公开 API 路由
app.use('/api/products', productsRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/auth', authRouter)
app.use('/api/cart', cartRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/admin/products', adminProductsRouter)
app.use('/api/admin/orders', adminOrdersRouter)
app.use('/api/admin/categories', adminCategoriesRouter)
app.use('/api/admin/upload', adminUploadRouter)
app.use('/api/admin/dashboard', adminDashboardRouter)
app.use('/api/admin/users', adminUsersRouter)
app.use('/api/admin/admins', adminAdminsRouter)

// Production: serve static frontend files
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, '../dist')))
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist/index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Mini-Mall server running on http://localhost:${PORT}`)
})
