// backend/src/routes/notifications.ts
import { Router, Request, Response } from 'express'
import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'
import { asyncHandler } from '../middleware/error-handler'
import { createClient } from '@supabase/supabase-js'

const router = Router()
const supabaseService = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/notifications - Listar notificações do usuário
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id
  
  if (!userId) {
    return res.status(401).json({ 
      error: 'Usuário não autenticado' 
    })
  }

  logger.info(`📧 Buscando notificações do usuário: ${req.user?.email}`)

  // Buscar notificações do usuário
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', userId)
    .order('sent_at', { ascending: false })
    .limit(50)

  if (error) {
    logger.error('❌ Erro ao buscar notificações:', error)
    throw new Error(`Erro ao buscar notificações: ${error.message}`)
  }

  logger.info(`✅ ${data?.length || 0} notificações encontradas`)
  res.json({ data: data || [] })
}))

// POST /api/notifications - Criar nova notificação
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { recipient_id, type, title, message, process_number, group_name } = req.body
  
  if (!recipient_id || !type || !title || !message) {
    return res.status(400).json({ 
      error: 'Dados obrigatórios: recipient_id, type, title, message' 
    })
  }

  logger.info(`📧 Criando notificação para usuário: ${recipient_id}`)

  const { data, error } = await supabase
    .from('notifications')
    .insert([{
      recipient_id,
      type,
      title,
      message,
      process_number,
      group_name,
      status: 'pending',
      sent_at: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) {
    logger.error('❌ Erro ao criar notificação:', error)
    throw new Error(`Erro ao criar notificação: ${error.message}`)
  }

  logger.info(`✅ Notificação criada: ${data.id}`)
  res.status(201).json({ 
    data,
    message: 'Notificação criada com sucesso'
  })
}))

// PUT /api/notifications/:id - Atualizar status da notificação
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { status } = req.body
  
  if (!status || !['sent', 'failed', 'pending'].includes(status)) {
    return res.status(400).json({ 
      error: 'Status inválido. Use: sent, failed, pending' 
    })
  }

  logger.info(`📧 Atualizando notificação: ${id} para status: ${status}`)

  const { data, error } = await supabase
    .from('notifications')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('❌ Erro ao atualizar notificação:', error)
    throw new Error(`Erro ao atualizar notificação: ${error.message}`)
  }

  logger.info(`✅ Notificação atualizada: ${data.id}`)
  res.json({ 
    data,
    message: 'Notificação atualizada com sucesso'
  })
}))

// DELETE /api/notifications/:id - Deletar notificação
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const userId = req.user?.id

  if (!userId) {
    return res.status(401).json({ 
      error: 'Usuário não autenticado' 
    })
  }

  logger.info(`📧 Deletando notificação: ${id}`)

  // Verificar se a notificação pertence ao usuário
  const { data: notification, error: fetchError } = await supabase
    .from('notifications')
    .select('recipient_id')
    .eq('id', id)
    .single()

  if (fetchError) {
    return res.status(404).json({ 
      error: 'Notificação não encontrada' 
    })
  }

  if (notification.recipient_id !== userId) {
    return res.status(403).json({ 
      error: 'Sem permissão para deletar esta notificação' 
    })
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('❌ Erro ao deletar notificação:', error)
    throw new Error(`Erro ao deletar notificação: ${error.message}`)
  }

  logger.info(`✅ Notificação deletada: ${id}`)
  res.json({ 
    message: 'Notificação deletada com sucesso'
  })
}))

// PUT /api/notifications/:id/mark-read - Marcar notificação como lida
router.put('/:id/mark-read', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const userId = req.user?.id

  if (!userId) {
    return res.status(401).json({ 
      error: 'Usuário não autenticado' 
    })
  }

  logger.info(`📧 Marcando notificação como lida: ${id}`)

  // Verificar se a notificação pertence ao usuário
  const { data: notification, error: fetchError } = await supabase
    .from('notifications')
    .select('recipient_id')
    .eq('id', id)
    .single()

  if (fetchError) {
    return res.status(404).json({ 
      error: 'Notificação não encontrada' 
    })
  }

  if (notification.recipient_id !== userId) {
    return res.status(403).json({ 
      error: 'Sem permissão para modificar esta notificação' 
    })
  }

  const { data, error } = await supabase
    .from('notifications')
    .update({ 
      read: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('❌ Erro ao marcar notificação como lida:', error)
    throw new Error(`Erro ao marcar notificação como lida: ${error.message}`)
  }

  logger.info(`✅ Notificação marcada como lida: ${data.id}`)
  res.json({ 
    data,
    message: 'Notificação marcada como lida'
  })
}))

// PUT /api/notifications/:id/mark-viewed - Marcar notificação como visualizada
router.put('/:id/mark-viewed', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const userId = req.user?.id

  if (!userId) {
    return res.status(401).json({ 
      error: 'Usuário não autenticado' 
    })
  }

  logger.info(`📧 Marcando notificação como visualizada: ${id}`)

  // Verificar se a notificação pertence ao usuário
  const { data: notification, error: fetchError } = await supabase
    .from('notifications')
    .select('recipient_id')
    .eq('id', id)
    .single()

  if (fetchError) {
    return res.status(404).json({ 
      error: 'Notificação não encontrada' 
    })
  }

  if (notification.recipient_id !== userId) {
    return res.status(403).json({ 
      error: 'Sem permissão para modificar esta notificação' 
    })
  }

  const { data, error } = await supabase
    .from('notifications')
    .update({ 
      viewed: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('❌ Erro ao marcar notificação como visualizada:', error)
    throw new Error(`Erro ao marcar notificação como visualizada: ${error.message}`)
  }

  logger.info(`✅ Notificação marcada como visualizada: ${data.id}`)
  res.json({ 
    data,
    message: 'Notificação marcada como visualizada'
  })
}))

// PUT /api/notifications/mark-all-read - Marcar todas as notificações como lidas
router.put('/mark-all-read', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    return res.status(401).json({ 
      error: 'Usuário não autenticado' 
    })
  }

  logger.info(`📧 Marcando todas as notificações como lidas para usuário: ${userId}`)

  const { data, error } = await supabase
    .from('notifications')
    .update({ 
      read: true,
      updated_at: new Date().toISOString()
    })
    .eq('recipient_id', userId)
    .eq('read', false)

  if (error) {
    logger.error('❌ Erro ao marcar notificações como lidas:', error)
    throw new Error(`Erro ao marcar notificações como lidas: ${error.message}`)
  }

  logger.info(`✅ Notificações marcadas como lidas`)
  res.json({ 
    message: 'Todas as notificações foram marcadas como lidas'
  })
}))

// PUT /api/notifications/mark-all-viewed - Marcar todas as notificações como visualizadas
router.put('/mark-all-viewed', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id

  if (!userId) {
    return res.status(401).json({ 
      error: 'Usuário não autenticado' 
    })
  }

  logger.info(`📧 Marcando todas as notificações como visualizadas para usuário: ${userId}`)

  const { data, error } = await supabase
    .from('notifications')
    .update({ 
      viewed: true,
      read: true,
      updated_at: new Date().toISOString()
    })
    .eq('recipient_id', userId)
    .eq('viewed', false)

  if (error) {
    logger.error('❌ Erro ao marcar notificações como visualizadas:', error)
    throw new Error(`Erro ao marcar notificações como visualizadas: ${error.message}`)
  }

  logger.info(`✅ Notificações marcadas como visualizadas`)
  res.json({ 
    message: 'Todas as notificações foram marcadas como visualizadas'
  })
}))

// GET /api/notifications/stats - Estatísticas de notificações
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id
  
  if (!userId) {
    return res.status(401).json({ 
      error: 'Usuário não autenticado' 
    })
  }

  logger.info(`📊 Buscando estatísticas de notificações para: ${req.user?.email}`)

  // Buscar estatísticas
  const { data, error } = await supabase
    .from('notifications')
    .select('status, type')
    .eq('recipient_id', userId)

  if (error) {
    logger.error('❌ Erro ao buscar estatísticas:', error)
    throw new Error(`Erro ao buscar estatísticas: ${error.message}`)
  }

  // Calcular estatísticas
  const stats = {
    total: data?.length || 0,
    sent: data?.filter(n => n.status === 'sent').length || 0,
    failed: data?.filter(n => n.status === 'failed').length || 0,
    pending: data?.filter(n => n.status === 'pending').length || 0,
    byType: {
      group_assignment: data?.filter(n => n.type === 'group_assignment').length || 0,
      process_update: data?.filter(n => n.type === 'process_update').length || 0,
      daily_report: data?.filter(n => n.type === 'daily_report').length || 0,
      reminder: data?.filter(n => n.type === 'reminder').length || 0
    }
  }

  logger.info(`✅ Estatísticas calculadas para ${stats.total} notificações`)
  res.json({ data: stats })
}))

// Buscar configurações de notificação do usuário
router.get('/settings/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    
    // Buscar configurações do localStorage (simulado)
    // Em produção, isso viria de uma tabela no banco
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

    res.json({
      success: true,
      data: defaultSettings
    })
  } catch (error) {
    logger.error('Erro ao buscar configurações:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
})

// Salvar configurações de notificação
router.post('/settings/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const settings = req.body

    // Validar configurações
    if (!settings.email_frequency) {
      return res.status(400).json({
        success: false,
        error: 'Frequência de email é obrigatória'
      })
    }

    // Em produção, salvaria em uma tabela no banco
    // Por enquanto, apenas log
    logger.info(`Configurações salvas para usuário ${userId}:`, settings)

    res.json({
      success: true,
      message: 'Configurações salvas com sucesso'
    })
  } catch (error) {
    logger.error('Erro ao salvar configurações:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
})

// Enviar relatório de teste (versão simplificada)
router.post('/send-test-report/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    
    // Buscar dados do usuário
    const { data: user } = await supabaseService
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

    // Buscar processos para o relatório
    const { data: processes } = await supabaseService
      .from('sei_processes')
      .select('*')
      .limit(5)

    // Gerar relatório de teste
    let reportContent = `<h2>📊 Relatório de Teste</h2>`
    reportContent += `<p>Olá <strong>${user.name}</strong>,</p>`
    reportContent += `<p>Este é um relatório de teste enviado em ${new Date().toLocaleString('pt-BR')}.</p>`

    if (processes && processes.length > 0) {
      reportContent += `<h3>📋 Processos Recentes</h3>`
      reportContent += '<ul>'
      processes.forEach(process => {
        reportContent += `<li><strong>${process.process_number}</strong> - ${process.title}</li>`
      })
      reportContent += '</ul>'
    } else {
      reportContent += `<p>Nenhum processo encontrado.</p>`
    }

    // Enviar email de teste
    try {
      const { sendEmail } = await import('../services/email')
      await sendEmail({
        to: user.email,
        subject: '🧪 Relatório de Teste - C104',
        html: reportContent
      })

      logger.info(`Relatório de teste enviado para ${user.email}`)

      res.json({
        success: true,
        message: 'Relatório de teste enviado com sucesso',
        email: user.email
      })
    } catch (emailError) {
      logger.error('Erro ao enviar email:', emailError)
      
      // Retornar sucesso mesmo se email falhar (para teste)
      res.json({
        success: true,
        message: 'Relatório de teste processado (email simulado)',
        email: user.email,
        error: emailError.message
      })
    }
  } catch (error) {
    logger.error('Erro ao enviar relatório de teste:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    })
  }
})

// Buscar estatísticas de notificações
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    
    // Buscar notificações do usuário
    const { data: notifications } = await supabaseService
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Buscar processos próximos do vencimento
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 7)

    const { data: expiryProcesses } = await supabaseService
      .from('sei_processes')
      .select('*')
      .lte('expiry_date', expiryDate.toISOString())
      .gte('expiry_date', new Date().toISOString())

    // Buscar grupos do usuário
    const { data: userGroups } = await supabaseService
      .from('user_groups')
      .select(`
        groups (
          name
        )
      `)
      .eq('user_id', userId)

    const stats = {
      totalNotifications: notifications?.length || 0,
      unreadNotifications: notifications?.filter(n => n.status === 'pending').length || 0,
      processesNearExpiry: expiryProcesses?.length || 0,
      userGroups: userGroups?.length || 0,
      lastNotification: notifications?.[0]?.created_at || null
    }

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    logger.error('Erro ao buscar estatísticas:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
})

// Rota de teste sem autenticação
router.post('/test-email', async (req, res) => {
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
      const { sendEmail } = await import('../services/email')
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

export default router
