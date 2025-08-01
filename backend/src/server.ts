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
import seiProcessesRouter from './routes/sei-processes'
import groupsRouter from './routes/groups'
import notificationsRouter from './routes/notifications'

// Jobs
import './jobs/process-reminders'

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
app.use('/api/sei-processes', seiProcessesRouter) // Removido authMiddleware global
app.use('/api/groups', authMiddleware, groupsRouter)
app.use('/api/notifications', authMiddleware, notificationsRouter)

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