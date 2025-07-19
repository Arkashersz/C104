// backend/src/routes/bidding.ts
import { Router, Request, Response } from 'express'
import { supabase } from '../config/supabase'
import { asyncHandler } from '../middleware/error-handler'

const router = Router()

router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const { data, error } = await supabase
        .from('bidding_processes')
        .select(`
      *,
      current_status:process_statuses(name, color),
      created_by:users(name, email)
    `)
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(`Erro ao buscar processos licitatórios: ${error.message}`)
    }

    res.json({ data })
}))

router.post('/', asyncHandler(async (req: Request, res: Response) => {
    const processData = {
        ...req.body,
        created_by: req.user?.id
    }

    const { data, error } = await supabase
        .from('bidding_processes')
        .insert([processData])
        .select()
        .single()

    if (error) {
        throw new Error(`Erro ao criar processo licitatório: ${error.message}`)
    }

    res.status(201).json({
        data,
        message: 'Processo licitatório criado com sucesso'
    })
}))

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const { data, error } = await supabase
        .from('bidding_processes')
        .select(`
      *,
      current_status:process_statuses(name, color),
      created_by:users(name, email),
      status_history:process_status_history(
        *,
        status:process_statuses(name, color),
        changed_by:users(name, email)
      )
    `)
        .eq('id', id)
        .single()

    if (error) {
        if (error.code === 'PGRST116') {
            return res.status(404).json({
                error: 'Processo licitatório não encontrado'
            })
        }
        throw new Error(`Erro ao buscar processo licitatório: ${error.message}`)
    }

    res.json({ data })
}))

export default router