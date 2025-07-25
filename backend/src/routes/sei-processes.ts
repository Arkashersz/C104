import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'
import { asyncHandler } from '../middleware/error-handler'
import { emailService } from '../services/email'

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
  const { data, error } = await supabase
    .from('group_users')
    .select('user_id, users(email, name)')
    .eq('group_id', group_id)
  if (error) throw error
  return (data || []).map((gu: any) => gu.users)
}

// Função para registrar log
async function logProcessAction(process_id: string, user_id: string, action: string, details?: any) {
  await supabase.from('sei_process_logs').insert([{ process_id, user_id, action, details }])
}

// POST /api/sei-processes - Criar novo processo
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const validated = processSchema.parse(req.body)
  const userId = req.user?.id
  const groupId = validated.group_id

  // Inserir processo
  const { data: process, error } = await supabase
    .from('sei_processes')
    .insert([{ ...validated, created_by: userId }])
    .select('*')
    .single()
  if (error) throw new Error(error.message)

  // Log de criação
  await logProcessAction(process.id, userId, 'create', { process })

  // Enviar e-mail para todos do grupo
  if (groupId) {
    const groupUsers = await getGroupEmails(groupId)
    for (const user of groupUsers) {
      await emailService.sendProcessReminderNotification({
        to: user.email,
        processNumber: process.process_number,
        processTitle: process.title,
        statusName: process.status,
        recipientName: user.name,
        daysWaiting: 0,
      })
    }
  }

  res.status(201).json({ data: process, message: 'Processo criado com sucesso' })
}))

// PUT /api/sei-processes/:id - Editar processo
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const validated = processSchema.partial().parse(req.body)
  const userId = req.user?.id
  const groupId = validated.group_id

  // Atualizar processo
  const { data: process, error } = await supabase
    .from('sei_processes')
    .update({ ...validated, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)

  // Log de edição
  await logProcessAction(id, userId, 'update', { changes: validated })

  // Se mudou o grupo, enviar e-mail para todos do grupo
  if (groupId) {
    const groupUsers = await getGroupEmails(groupId)
    for (const user of groupUsers) {
      await emailService.sendProcessReminderNotification({
        to: user.email,
        processNumber: process.process_number,
        processTitle: process.title,
        statusName: process.status,
        recipientName: user.name,
        daysWaiting: 0,
      })
    }
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