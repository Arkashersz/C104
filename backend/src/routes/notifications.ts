// backend/src/routes/notifications.ts
import { Router, Request, Response } from 'express'
import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'
import { asyncHandler } from '../middleware/error-handler'

const router = Router()

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

export default router
