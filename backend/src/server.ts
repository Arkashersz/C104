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
import { startEmailReportsJob } from './jobs/email-reports'

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

// Rota de teste sem autenticação
app.post('/api/test-email', async (req, res) => {
  try {
    const { email, name } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email é obrigatório'
      })
    }

    // Gerar relatório de teste
    let reportContent = `<h2>📊 Relatório de Teste</h2>`
    reportContent += `<p>Olá <strong>${name || 'Usuário'}</strong>,</p>`
    reportContent += `<p>Este é um relatório de teste enviado em ${new Date().toLocaleString('pt-BR')}.</p>`
    reportContent += `<p>✅ Sistema de notificações funcionando corretamente!</p>`

    // Enviar email de teste
    try {
      const { sendEmail } = await import('./services/email')
      await sendEmail({
        to: email,
        subject: '🧪 Teste de Sistema - C104',
        html: reportContent
      })

      logger.info(`Email de teste enviado para ${email}`)

      res.json({
        success: true,
        message: 'Email de teste enviado com sucesso',
        email: email
      })
    } catch (emailError) {
      logger.error('Erro ao enviar email:', emailError)
      
      // Retornar sucesso mesmo se email falhar (para teste)
      res.json({
        success: true,
        message: 'Email de teste processado (simulado)',
        email: email,
        error: emailError.message
      })
    }
  } catch (error) {
    logger.error('Erro no teste de email:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    })
  }
})

// Rota para sincronizar configurações do usuário
app.post('/api/sync-user-settings', async (req, res) => {
  try {
    const { userId, settings } = req.body

    if (!userId || !settings) {
      return res.status(400).json({
        success: false,
        error: 'userId e settings são obrigatórios'
      })
    }

    // Salvar configurações em uma tabela temporária ou cache
    // Por enquanto, vamos usar um Map em memória (em produção seria uma tabela)
    if (!global.userSettings) {
      global.userSettings = new Map()
    }

    global.userSettings.set(userId, settings)

    logger.info(`Configurações sincronizadas para usuário ${userId}:`, settings)

    res.json({
      success: true,
      message: 'Configurações sincronizadas com sucesso'
    })
  } catch (error) {
    logger.error('Erro ao sincronizar configurações:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    })
  }
})

// Rota para buscar configurações do usuário
app.get('/api/user-settings/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    
    // Buscar configurações do cache/banco
    if (global.userSettings && global.userSettings.has(userId)) {
      const settings = global.userSettings.get(userId)
      res.json(settings)
    } else {
      // Configurações padrão se não encontradas
      const defaultSettings = {
        daily_reports: true,
        process_updates: true,
        group_assignments: true,
        reminders: true,
        email_frequency: 'daily',
        daily_time: '09:00',
        weekly_day: 'monday',
        weekly_time: '09:00',
        monthly_day: 1,
        monthly_time: '09:00',
        report_processes_near_expiry: true,
        report_group_processes: true,
        report_expiry_days: 7
      }
      res.json(defaultSettings)
    }
  } catch (error) {
    logger.error('Erro ao buscar configurações do usuário:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
})

// Rota para testar agendamento manualmente
app.post('/api/test-scheduled-email', async (req, res) => {
  try {
    const { userId, settings } = req.body

    if (!userId || !settings) {
      return res.status(400).json({
        success: false,
        error: 'userId e settings são obrigatórios'
      })
    }

    // Buscar dados do usuário
    const { data: user } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', userId)
      .single()

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      })
    }

    // Simular envio de relatório agendado
    try {
      const { sendEmail } = await import('./services/email')
      
      let reportContent = `<h2>📊 Relatório Agendado</h2>`
      reportContent += `<p>Olá <strong>${user.name}</strong>,</p>`
      reportContent += `<p>Este é um relatório agendado enviado em ${new Date().toLocaleString('pt-BR')}.</p>`
      reportContent += `<p>⚙️ Configurações: ${settings.email_frequency} às ${settings.daily_time || settings.weekly_time || settings.monthly_time}</p>`
      reportContent += `<p>✅ Sistema de agendamento funcionando!</p>`

      await sendEmail({
        to: user.email,
        subject: '📅 Relatório Agendado - C104',
        html: reportContent
      })

      logger.info(`Relatório agendado enviado para ${user.email}`)

      res.json({
        success: true,
        message: 'Relatório agendado enviado com sucesso',
        email: user.email,
        settings: settings
      })
    } catch (emailError) {
      logger.error('Erro ao enviar relatório agendado:', emailError)
      
      res.json({
        success: true,
        message: 'Relatório agendado processado (simulado)',
        email: user.email,
        settings: settings,
        error: emailError.message
      })
    }
  } catch (error) {
    logger.error('Erro no teste de agendamento:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    })
  }
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
  
  // Iniciar jobs
  startEmailReportsJob()
})

export default app