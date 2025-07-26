import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'
import { asyncHandler } from '../middleware/error-handler'
import { emailService } from '../services/email'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// Schema de validação para criação/edição de processo
const processSchema = z.object({
  process_number: z.string().min(1),
  type: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  supplier: z.string().optional(),
  value: z.number().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  estimated_value: z.number().optional(),
  opening_date: z.string().optional(),
  status: z.string().default('em_andamento'),
  notification_days: z.array(z.number()).optional(),
  group_id: z.string().uuid().optional(),
})

// Função para buscar e-mails dos usuários do grupo
async function getGroupEmails(group_id: string): Promise<{email: string, name: string}[]> {
  logger.info(`🔍 Buscando emails do grupo: ${group_id}`)
  
  // Primeiro, buscar os IDs dos usuários no grupo
  const { data: userGroups, error: userGroupsError } = await supabase
    .from('user_groups')
    .select('user_id')
    .eq('group_id', group_id)
  
  if (userGroupsError) {
    logger.error(`❌ Erro ao buscar user_groups para grupo ${group_id}:`, userGroupsError)
    throw userGroupsError
  }
  
  if (!userGroups || userGroups.length === 0) {
    logger.info(`⚠️ Nenhum usuário encontrado no grupo ${group_id}`)
    return []
  }
  
  // Extrair os IDs dos usuários
  const userIds = userGroups.map(ug => ug.user_id)
  logger.info(`👥 IDs dos usuários no grupo: ${userIds.join(', ')}`)
  
  // Buscar os dados dos usuários
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, name')
    .in('id', userIds)
  
  if (usersError) {
    logger.error(`❌ Erro ao buscar usuários:`, usersError)
    throw usersError
  }
  
  const validUsers = (users || []).filter(user => user.email && user.name)
  logger.info(`📧 Encontrados ${validUsers.length} usuários no grupo ${group_id}:`, validUsers.map(u => u.email))
  
  return validUsers.map(user => ({
    email: user.email,
    name: user.name
  }))
}

// Função para buscar nome do grupo
async function getGroupName(group_id: string): Promise<string> {
  logger.info(`🔍 Buscando nome do grupo: ${group_id}`)
  
  const { data, error } = await supabase
    .from('groups')
    .select('name')
    .eq('id', group_id)
    .single()
  
  if (error) {
    logger.error(`❌ Erro ao buscar nome do grupo ${group_id}:`, error)
    throw error
  }
  
  const groupName = data?.name || 'Grupo'
  logger.info(`📋 Nome do grupo ${group_id}: ${groupName}`)
  
  return groupName
}

// Função para registrar log
async function logProcessAction(process_id: string, user_id: string, action: string, details?: any) {
  await supabase.from('sei_process_logs').insert([{ process_id, user_id, action, details }])
}

// Aplicar middleware de autenticação para todas as rotas EXCETO config
router.use(authMiddleware)

// GET /api/sei-processes/config - Verificar configuração (PÚBLICO)
router.get('/config', asyncHandler(async (req: Request, res: Response) => {
  const config = {
    supabaseUrl: process.env.SUPABASE_URL ? 'Configurado' : 'Não configurado',
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurado' : 'Não configurado',
    gmailUser: process.env.GMAIL_USER ? 'Configurado' : 'Não configurado',
    gmailPassword: process.env.GMAIL_APP_PASSWORD ? 'Configurado' : 'Não configurado',
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3001
  }
  
  res.json({ 
    message: 'Configuração do sistema',
    config,
    timestamp: new Date().toISOString()
  })
}))

// POST /api/sei-processes - Criar novo processo
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const validated = processSchema.parse(req.body)
  const userId = req.user?.id
  const groupId = validated.group_id

  logger.info(`📋 Criando processo SEI: ${validated.process_number}`)
  logger.info(`👤 Usuário: ${userId}`)
  logger.info(`👥 Grupo: ${groupId}`)
  logger.info(`📝 Dados completos:`, validated)

  // Inserir processo
  const { data: process, error } = await supabase
    .from('sei_processes')
    .insert([{ ...validated, created_by: userId }])
    .select('*')
    .single()
  if (error) throw new Error(error.message)

  logger.info(`✅ Processo criado com ID: ${process.id}`)

  // Log de criação
  await logProcessAction(process.id, userId, 'create', { process })

  // Enviar e-mail para todos do grupo
  if (groupId) {
    logger.info(`📧 Enviando notificações para o grupo: ${groupId}`)
    
    try {
      const groupUsers = await getGroupEmails(groupId)
      const groupName = await getGroupName(groupId)
      
      logger.info(`📧 Enviando emails para ${groupUsers.length} usuários do grupo ${groupName}`)
      
      if (groupUsers.length === 0) {
        logger.warn(`⚠️ Nenhum usuário encontrado no grupo ${groupName} (${groupId})`)
      }
      
      for (const user of groupUsers) {
        try {
          logger.info(`📧 Tentando enviar email para: ${user.email}`)
          await emailService.sendGroupAssignmentNotification({
            to: user.email,
            processNumber: process.process_number,
            processTitle: process.title,
            groupName: groupName,
            recipientName: user.name,
          })
          logger.info(`✅ Email enviado para: ${user.email}`)
        } catch (emailError) {
          logger.error(`❌ Erro ao enviar email para ${user.email}:`, emailError)
        }
      }
    } catch (groupError) {
      logger.error(`❌ Erro ao processar grupo ${groupId}:`, groupError)
    }
  } else {
    logger.info(`⚠️ Nenhum grupo atribuído ao processo ${process.process_number}`)
  }

  res.status(201).json({ data: process, message: 'Processo criado com sucesso' })
}))

// PUT /api/sei-processes/:id - Editar processo
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const validated = processSchema.partial().parse(req.body)
  const userId = req.user?.id
  const groupId = validated.group_id

  logger.info(`📝 Atualizando processo SEI: ${id}`)
  logger.info(`👤 Usuário: ${userId}`)
  logger.info(`👥 Novo grupo: ${groupId}`)

  // Buscar processo atual para verificar se mudou o grupo
  const { data: currentProcess, error: currentError } = await supabase
    .from('sei_processes')
    .select('group_id, process_number, title')
    .eq('id', id)
    .single()
  if (currentError) throw new Error(currentError.message)

  logger.info(`📋 Processo atual - Grupo: ${currentProcess.group_id}`)
  logger.info(`📋 Mudança de grupo: ${currentProcess.group_id} → ${groupId}`)

  // Atualizar processo
  const { data: process, error } = await supabase
    .from('sei_processes')
    .update({ ...validated, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)

  logger.info(`✅ Processo atualizado com sucesso`)

  // Log de edição
  await logProcessAction(id, userId, 'update', { changes: validated })

  // Se mudou o grupo, enviar e-mail para todos do novo grupo
  if (groupId && groupId !== currentProcess.group_id) {
    logger.info(`📧 Enviando notificações para o novo grupo: ${groupId}`)
    
    try {
      const groupUsers = await getGroupEmails(groupId)
      const groupName = await getGroupName(groupId)
      
      logger.info(`📧 Enviando emails para ${groupUsers.length} usuários do grupo ${groupName}`)
      
      for (const user of groupUsers) {
        try {
          await emailService.sendGroupAssignmentNotification({
            to: user.email,
            processNumber: process.process_number,
            processTitle: process.title,
            groupName: groupName,
            recipientName: user.name,
          })
          logger.info(`✅ Email enviado para: ${user.email}`)
        } catch (emailError) {
          logger.error(`❌ Erro ao enviar email para ${user.email}:`, emailError)
        }
      }
    } catch (groupError) {
      logger.error(`❌ Erro ao processar grupo ${groupId}:`, groupError)
    }
  } else {
    logger.info(`ℹ️ Nenhuma mudança de grupo detectada`)
  }

  res.json({ data: process, message: 'Processo atualizado com sucesso' })
}))

// GET /api/sei-processes - Listar processos
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('sei_processes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  res.json({ data })
}))

// GET /api/sei-processes/:id - Buscar processo por ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { data, error } = await supabase
    .from('sei_processes')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  res.json({ data })
}))

export default router 