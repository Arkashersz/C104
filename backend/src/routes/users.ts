// backend/src/routes/users.ts
import { Router, Request, Response } from 'express'
import { supabase } from '../config/supabase'
import { asyncHandler } from '../middleware/error-handler'

const router = Router()

// Listar usuários (apenas admin)
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  // Verificar se é admin
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Acesso negado',
      message: 'Apenas administradores podem listar usuários'
    })
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, role, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Erro ao buscar usuários: ${error.message}`)
  }

  res.json({ data })
}))

// Buscar perfil do usuário atual
router.get('/profile', asyncHandler(async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, role, created_at, updated_at')
    .eq('id', req.user?.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ 
        error: 'Perfil não encontrado' 
      })
    }
    throw new Error(`Erro ao buscar perfil: ${error.message}`)
  }

  res.json({ data })
}))

// Atualizar perfil do usuário atual
router.put('/profile', asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body

  const { data, error } = await supabase
    .from('users')
    .update({ 
      name,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user?.id)
    .select('id, email, name, role, created_at, updated_at')
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar perfil: ${error.message}`)
  }

  res.json({ 
    data,
    message: 'Perfil atualizado com sucesso'
  })
}))

// Atualizar role de usuário (apenas admin)
router.patch('/:id/role', asyncHandler(async (req: Request, res: Response) => {
  // Verificar se é admin
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Acesso negado',
      message: 'Apenas administradores podem alterar roles'
    })
  }

  const { id } = req.params
  const { role } = req.body

  if (!['admin', 'manager', 'user'].includes(role)) {
    return res.status(400).json({ 
      error: 'Role inválido',
      message: 'Role deve ser: admin, manager ou user'
    })
  }

  const { data, error } = await supabase
    .from('users')
    .update({ 
      role,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, email, name, role, created_at, updated_at')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({ 
        error: 'Usuário não encontrado' 
      })
    }
    throw new Error(`Erro ao atualizar role: ${error.message}`)
  }

  res.json({ 
    data,
    message: `Role do usuário alterado para ${role}`
  })
}))

export default router