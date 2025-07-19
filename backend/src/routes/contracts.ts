// backend/src/routes/contracts.ts
import { Router, Request, Response } from 'express'
import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'
import { asyncHandler } from '../middleware/error-handler'

const router = Router()

// GET /api/contracts - Listar contratos
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, status, supplier, search } = req.query
  
  let query = supabase
    .from('contracts')
    .select(`
      *,
      created_by:users(name, email)
    `)
    .order('created_at', { ascending: false })

  // Filtros
  if (status) {
    query = query.eq('status', status)
  }
  
  if (supplier) {
    query = query.ilike('supplier', `%${supplier}%`)
  }
  
  if (search) {
    query = query.or(`title.ilike.%${search}%,contract_number.ilike.%${search}%`)
  }

  // Paginação
  const from = (Number(page) - 1) * Number(limit)
  const to = from + Number(limit) - 1
  
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Erro ao buscar contratos: ${error.message}`)
  }

  res.json({
    data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / Number(limit))
    }
  })
}))

// GET /api/contracts/:id - Buscar contrato por ID
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params

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
    throw new Error(`Erro ao buscar contrato: ${error.message}`)
  }

  res.json({ data })
}))

// POST /api/contracts - Criar novo contrato
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const contractData = {
    ...req.body,
    created_by: req.user?.id
  }

  const { data, error } = await supabase
    .from('contracts')
    .insert([contractData])
    .select()
    .single()

  if (error) {
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
  
  const { data, error } = await supabase
    .from('contracts')
    .update(req.body)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ 
        error: 'Contrato não encontrado' 
      })
    }
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

  const { error } = await supabase
    .from('contracts')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Erro ao deletar contrato: ${error.message}`)
  }

  logger.info(`Contrato deletado: ${id} por ${req.user?.email}`)

  res.json({ 
    message: 'Contrato deletado com sucesso' 
  })
}))

// GET /api/contracts/expiring/:days - Contratos próximos ao vencimento
router.get('/expiring/:days', asyncHandler(async (req: Request, res: Response) => {
  const { days } = req.params
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + Number(days))

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
    throw new Error(`Erro ao buscar contratos próximos ao vencimento: ${error.message}`)
  }

  res.json({ data })
}))

export default router