import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// API routes will be mounted here in later phases

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
