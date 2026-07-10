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

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(cookieParser())

// 公开 API 路由
app.use('/api/products', productsRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/auth', authRouter)
app.use('/api/cart', cartRouter)
app.use('/api/orders', ordersRouter)

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
