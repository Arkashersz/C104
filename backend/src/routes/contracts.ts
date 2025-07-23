// backend/src/routes/contracts.ts
import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'
import { asyncHandler } from '../middleware/error-handler'

const router = Router()

// Schema de validação para criação/atualização de contratos
const contractSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(255, 'Título muito longo'),
  description: z.string().optional(),
  contract_number: z.string().min(1, 'Processo SEI é obrigatório').max(100, 'Processo SEI muito longo'),
  supplier: z.string().min(1, 'Fornecedor é obrigatório').max(255, 'Fornecedor muito longo'),
  value: z.number().positive('Valor deve ser positivo'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início deve estar no formato YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de término deve estar no formato YYYY-MM-DD'),
  status: z.enum(['active', 'expired', 'cancelled', 'renewed']).default('active'),
  notification_days: z.array(z.number()).default([90, 60, 30, 15, 7])
})

// Schema para validação de filtros
const filterSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('10'),
  status: z.enum(['active', 'expired', 'cancelled', 'renewed']).optional(),
  supplier: z.string().optional(),
  search: z.string().optional(),
  orderBy: z.enum(['created_at', 'title', 'contract_number', 'supplier', 'value', 'start_date', 'end_date']).default('created_at'),
  orderDirection: z.enum(['asc', 'desc']).default('desc')
})

// GET /api/contracts - Listar contratos
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const validatedFilters = filterSchema.parse(req.query)
  
  let query = supabase
    .from('contracts')
    .select(`
      *,
      created_by:users(name, email)
    `)

  // Aplicar ordenação
  query = query.order(validatedFilters.orderBy, { ascending: validatedFilters.orderDirection === 'asc' })

  // Aplicar filtros
  if (validatedFilters.status) {
    query = query.eq('status', validatedFilters.status)
  }
  
  if (validatedFilters.supplier) {
    query = query.ilike('supplier', `%${validatedFilters.supplier}%`)
  }
  
  if (validatedFilters.search) {
    query = query.or(`title.ilike.%${validatedFilters.search}%,contract_number.ilike.%${validatedFilters.search}%`)
  }

  // Paginação
  const from = (validatedFilters.page - 1) * validatedFilters.limit
  const to = from + validatedFilters.limit - 1
  
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    logger.error('Erro ao buscar contratos:', error)
    throw new Error(`Erro ao buscar contratos: ${error.message}`)
  }

  res.json({
    data: data || [],
    pagination: {
      page: validatedFilters.page,
      limit: validatedFilters.limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / validatedFilters.limit)
    }
  })
}))

// GET /api/contracts/:id - Buscar contrato por ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      error: 'ID do contrato é obrigatório' 
    })
  }

  const { data, error } = await supabase
    .from('contracts')
    .select(`
      *,
      created_by:users(name, email),
      documents(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ 
        error: 'Contrato não encontrado' 
      })
    }
    logger.error('Erro ao buscar contrato:', error)
    throw new Error(`Erro ao buscar contrato: ${error.message}`)
  }

  res.json({ data })
}))

// POST /api/contracts - Criar novo contrato
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = contractSchema.parse(req.body)
  
  // Validar se a data de término é posterior à data de início
  if (new Date(validatedData.end_date) <= new Date(validatedData.start_date)) {
    return res.status(400).json({
      error: 'Data de término deve ser posterior à data de início'
    })
  }

  // Verificar se já existe um contrato com o mesmo número
  const { data: existingContract } = await supabase
    .from('contracts')
    .select('id')
    .eq('contract_number', validatedData.contract_number)
    .single()

  if (existingContract) {
    return res.status(400).json({
      error: 'Já existe um contrato com este processo SEI'
    })
  }

  const contractData = {
    ...validatedData,
    created_by: req.user?.id
  }

  const { data, error } = await supabase
    .from('contracts')
    .insert([contractData])
    .select(`
      *,
      created_by:users(name, email)
    `)
    .single()

  if (error) {
    logger.error('Erro ao criar contrato:', error)
    throw new Error(`Erro ao criar contrato: ${error.message}`)
  }

  logger.info(`Contrato criado: ${data.contract_number} por ${req.user?.email}`)

  res.status(201).json({ 
    data,
    message: 'Contrato criado com sucesso'
  })
}))

// PUT /api/contracts/:id - Atualizar contrato
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      error: 'ID do contrato é obrigatório' 
    })
  }

  const validatedData = contractSchema.partial().parse(req.body)
  
  // Se estiver atualizando datas, validar se a data de término é posterior à data de início
  if (validatedData.end_date && validatedData.start_date) {
    if (new Date(validatedData.end_date) <= new Date(validatedData.start_date)) {
      return res.status(400).json({
        error: 'Data de término deve ser posterior à data de início'
      })
    }
  }

  // Se estiver atualizando o número do contrato, verificar se já existe
  if (validatedData.contract_number) {
    const { data: existingContract } = await supabase
      .from('contracts')
      .select('id')
      .eq('contract_number', validatedData.contract_number)
      .neq('id', id)
      .single()

    if (existingContract) {
      return res.status(400).json({
        error: 'Já existe um contrato com este processo SEI'
      })
    }
  }
  
  const { data, error } = await supabase
    .from('contracts')
    .update({
      ...validatedData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ 
        error: 'Contrato não encontrado' 
      })
    }
    logger.error('Erro ao atualizar contrato:', error)
    throw new Error(`Erro ao atualizar contrato: ${error.message}`)
  }

  logger.info(`Contrato atualizado: ${data.contract_number} por ${req.user?.email}`)

  res.json({ 
    data,
    message: 'Contrato atualizado com sucesso'
  })
}))

// DELETE /api/contracts/:id - Deletar contrato
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      error: 'ID do contrato é obrigatório' 
    })
  }

  // Verificar se o contrato existe antes de deletar
  const { data: existingContract } = await supabase
    .from('contracts')
    .select('contract_number')
    .eq('id', id)
    .single()

  if (!existingContract) {
    return res.status(404).json({ 
      error: 'Contrato não encontrado' 
    })
  }

  const { error } = await supabase
    .from('contracts')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('Erro ao deletar contrato:', error)
    throw new Error(`Erro ao deletar contrato: ${error.message}`)
  }

  logger.info(`Contrato deletado: ${existingContract.contract_number} por ${req.user?.email}`)

  res.json({ 
    message: 'Contrato deletado com sucesso' 
  })
}))

// GET /api/contracts/expiring/:days - Contratos próximos ao vencimento
router.get('/expiring/:days', asyncHandler(async (req: Request, res: Response) => {
  const { days } = req.params
  const daysNumber = parseInt(days)

  if (isNaN(daysNumber) || daysNumber < 1) {
    return res.status(400).json({
      error: 'Número de dias deve ser um número positivo'
    })
  }

  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + daysNumber)

  const { data, error } = await supabase
    .from('contracts')
    .select(`
      *,
      created_by:users(name, email)
    `)
    .eq('status', 'active')
    .lte('end_date', targetDate.toISOString().split('T')[0])
    .order('end_date', { ascending: true })

  if (error) {
    logger.error('Erro ao buscar contratos próximos ao vencimento:', error)
    throw new Error(`Erro ao buscar contratos próximos ao vencimento: ${error.message}`)
  }

  res.json({ data: data || [] })
}))

// GET /api/contracts/stats - Estatísticas dos contratos
router.get('/stats/overview', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Total de contratos
    const { count: total } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })

    // Contratos ativos
    const { count: active } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Contratos expirados
    const { count: expired } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'expired')

    // Contratos cancelados
    const { count: cancelled } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'cancelled')

    // Contratos renovados
    const { count: renewed } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'renewed')

    // Contratos próximos ao vencimento (30 dias)
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + 30)
    
    const { count: expiringSoon } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .lte('end_date', targetDate.toISOString().split('T')[0])

    res.json({
      data: {
        total: total || 0,
        active: active || 0,
        expired: expired || 0,
        cancelled: cancelled || 0,
        renewed: renewed || 0,
        expiringSoon: expiringSoon || 0
      }
    })
  } catch (error) {
    logger.error('Erro ao buscar estatísticas:', error)
    throw new Error('Erro ao buscar estatísticas dos contratos')
  }
}))

export default router