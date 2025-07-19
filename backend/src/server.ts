// backend/src/server.ts
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import { config } from './config/env'
import { logger } from './utils/logger'
import { errorHandler, notFoundHandler } from './middleware/error-handler'
import { authMiddleware } from './middleware/auth'

// Routes
import contractsRouter from './routes/contracts'

const app = express()

// Middleware básico
app.use(helmet())
app.use(cors({
  origin: config.NODE_ENV === 'production'
    ? [config.APP_URL]
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}))
app.use(compression())
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    version: '1.0.0'
  })
})

// API Routes (com autenticação)
app.use('/api/contracts', authMiddleware, contractsRouter)

// Rotas simples para outros módulos
app.use('/api/bidding', authMiddleware, (req, res) => {
  res.json({ message: 'Bidding routes - Em desenvolvimento' })
})

app.use('/api/notifications', authMiddleware, (req, res) => {
  res.json({ message: 'Notifications routes - Em desenvolvimento' })
})

app.use('/api/users', authMiddleware, (req, res) => {
  res.json({ message: 'Users routes - Em desenvolvimento' })
})

// Middleware de erro 404
app.use(notFoundHandler)

// Middleware de tratamento de erros
app.use(errorHandler)

const PORT = config.PORT || 3001

app.listen(PORT, () => {
  logger.info(`🚀 Servidor rodando na porta ${PORT}`)
  logger.info(`📝 Ambiente: ${config.NODE_ENV}`)
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`)
})

export default app