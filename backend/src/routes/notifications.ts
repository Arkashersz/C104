// backend/src/routes/notifications.ts
import { Router, Request, Response } from 'express'
import { supabase } from '../config/supabase'
import { asyncHandler } from '../middleware/error-handler'

const router = Router()

router.get('/', asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, read } = req.query

    let query = supabase
        .from('notifications')
        .select(`
      *,
      contract:contracts(contract_number, title),
      bidding_process:bidding_processes(process_number, title)
    `)
        .eq('recipient_id', req.user?.id)
        .order('created_at', { ascending: false })

    // Filtrar por status de leitura
    if (read === 'true') {
        query = query.not('read_at', 'is', null)
    } else if (read === 'false') {
        query = query.is('read_at', null)
    }

    // Paginação
    const from = (Number(page) - 1) * Number(limit)
    const to = from + Number(limit) - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
        throw new Error(`Erro ao buscar notificações: ${error.message}`)
    }

    res.json({
        data,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: count || 0,
            unread: data?.filter(n => !n.read_at).length || 0
        }
    })
}))

// Marcar notificação como lida
router.patch('/:id/read', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const { data, error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
        .eq('recipient_id', req.user?.id)
        .select()
        .single()

    if (error) {
        if (error.code === 'PGRST116') {
            return res.status(404).json({
                error: 'Notificação não encontrada'
            })
        }
        throw new Error(`Erro ao marcar notificação como lida: ${error.message}`)
    }

    res.json({
        data,
        message: 'Notificação marcada como lida'
    })
}))

// Marcar todas como lidas
router.patch('/mark-all-read', asyncHandler(async (req: Request, res: Response) => {
    const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_id', req.user?.id)
        .is('read_at', null)

    if (error) {
        throw new Error(`Erro ao marcar todas as notificações como lidas: ${error.message}`)
    }

    res.json({
        message: 'Todas as notificações foram marcadas como lidas'
    })
}))

export default router
