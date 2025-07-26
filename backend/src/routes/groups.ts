// backend/src/routes/groups.ts
import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'
import { asyncHandler } from '../middleware/error-handler'

const router = Router()

// Schema de validação para grupos
const groupSchema = z.object({
  name: z.string().min(1, 'Nome do grupo é obrigatório').max(100, 'Nome muito longo')
})

// Schema para adicionar usuário ao grupo
const addUserToGroupSchema = z.object({
  user_email: z.string().email('Email inválido'),
  group_id: z.string().uuid('ID do grupo inválido'),
  role: z.enum(['member', 'admin']).default('member')
})

// Schema para remover usuário do grupo
const removeUserFromGroupSchema = z.object({
  user_email: z.string().email('Email inválido'),
  group_id: z.string().uuid('ID do grupo inválido')
})

// GET /api/groups - Listar todos os grupos
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  logger.info('📋 Listando grupos')
  
  // Primeira consulta: buscar grupos
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('*')
    .order('name', { ascending: true })

  if (groupsError) {
    logger.error('❌ Erro ao listar grupos:', groupsError)
    throw new Error(`Erro ao listar grupos: ${groupsError.message}`)
  }

  // Segunda consulta: buscar membros de cada grupo
  const formattedGroups = []
  
  for (const group of groups || []) {
    // Buscar user_groups para este grupo
    const { data: userGroups, error: userGroupsError } = await supabase
      .from('user_groups')
      .select('user_id, role')
      .eq('group_id', group.id)

    if (userGroupsError) {
      logger.error(`❌ Erro ao buscar membros do grupo ${group.id}:`, userGroupsError)
      continue
    }

    // Se há membros, buscar dados dos usuários
    let members = []
    if (userGroups && userGroups.length > 0) {
      const userIds = userGroups.map(ug => ug.user_id)
      
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, name')
        .in('id', userIds)

      if (usersError) {
        logger.error(`❌ Erro ao buscar usuários do grupo ${group.id}:`, usersError)
      } else {
        // Combinar dados de user_groups com users
        members = userGroups.map(ug => {
          const user = users?.find(u => u.id === ug.user_id)
          return {
            id: user?.id,
            email: user?.email,
            name: user?.name,
            role: ug.role
          }
        }).filter(member => member.id) // Remover membros sem dados de usuário
      }
    }

    formattedGroups.push({
      ...group,
      members
    })
  }

  logger.info(`✅ ${formattedGroups.length} grupos encontrados`)
  res.json({ data: formattedGroups })
}))

// GET /api/groups/:id - Buscar grupo específico
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  
  logger.info(`📋 Buscando grupo: ${id}`)

  // Primeira consulta: buscar o grupo
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .single()

  if (groupError) {
    if (groupError.code === 'PGRST116') {
      return res.status(404).json({ 
        error: 'Grupo não encontrado' 
      })
    }
    logger.error('❌ Erro ao buscar grupo:', groupError)
    throw new Error(`Erro ao buscar grupo: ${groupError.message}`)
  }

  // Segunda consulta: buscar membros do grupo
  const { data: userGroups, error: userGroupsError } = await supabase
    .from('user_groups')
    .select('user_id, role')
    .eq('group_id', id)

  let members = []
  if (!userGroupsError && userGroups && userGroups.length > 0) {
    const userIds = userGroups.map(ug => ug.user_id)
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name')
      .in('id', userIds)

    if (!usersError && users) {
      // Combinar dados de user_groups com users
      members = userGroups.map(ug => {
        const user = users.find(u => u.id === ug.user_id)
        return {
          id: user?.id,
          email: user?.email,
          name: user?.name,
          role: ug.role
        }
      }).filter(member => member.id) // Remover membros sem dados de usuário
    }
  }

  // Formatar dados
  const formattedGroup = {
    ...group,
    members
  }

  logger.info(`✅ Grupo encontrado: ${formattedGroup.name}`)
  res.json({ data: formattedGroup })
}))

// POST /api/groups - Criar novo grupo
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const validated = groupSchema.parse(req.body)
  
  logger.info(`📋 Criando grupo: ${validated.name}`)

  const { data, error } = await supabase
    .from('groups')
    .insert([validated])
    .select()
    .single()

  if (error) {
    logger.error('❌ Erro ao criar grupo:', error)
    throw new Error(`Erro ao criar grupo: ${error.message}`)
  }

  logger.info(`✅ Grupo criado: ${data.name}`)
  res.status(201).json({ 
    data,
    message: 'Grupo criado com sucesso'
  })
}))

// POST /api/groups/add-user - Adicionar usuário ao grupo
router.post('/add-user', asyncHandler(async (req: Request, res: Response) => {
  const { user_email, group_id, role } = addUserToGroupSchema.parse(req.body)
  
  logger.info(`👤 Adicionando usuário ${user_email} ao grupo ${group_id}`)

  // Buscar o usuário pelo email
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, name')
    .eq('email', user_email)
    .single()

  if (userError) {
    if (userError.code === 'PGRST116') {
      return res.status(404).json({ 
        error: 'Usuário não encontrado',
        message: `Usuário com email ${user_email} não foi encontrado`
      })
    }
    logger.error('❌ Erro ao buscar usuário:', userError)
    throw new Error(`Erro ao buscar usuário: ${userError.message}`)
  }

  // Verificar se o grupo existe
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id, name')
    .eq('id', group_id)
    .single()

  if (groupError) {
    if (groupError.code === 'PGRST116') {
      return res.status(404).json({ 
        error: 'Grupo não encontrado',
        message: `Grupo com ID ${group_id} não foi encontrado`
      })
    }
    logger.error('❌ Erro ao buscar grupo:', groupError)
    throw new Error(`Erro ao buscar grupo: ${groupError.message}`)
  }

  // Adicionar usuário ao grupo
  const { data: userGroup, error: addError } = await supabase
    .from('user_groups')
    .insert([{
      user_id: user.id,
      group_id: group_id,
      role: role
    }])
    .select('*')
    .single()

  if (addError) {
    if (addError.code === '23505') { // Unique constraint violation
      return res.status(409).json({ 
        error: 'Usuário já está no grupo',
        message: `${user.name} já é membro do grupo ${group.name}`
      })
    }
    logger.error('❌ Erro ao adicionar usuário ao grupo:', addError)
    throw new Error(`Erro ao adicionar usuário ao grupo: ${addError.message}`)
  }

  // Buscar dados completos do user_group criado
  const { data: completeUserGroup, error: fetchError } = await supabase
    .from('user_groups')
    .select(`
      *,
      users(id, email, name),
      groups(id, name)
    `)
    .eq('id', userGroup.id)
    .single()

  if (fetchError) {
    logger.warn('⚠️ Erro ao buscar dados completos do user_group:', fetchError)
    // Retornar dados básicos mesmo com erro
    res.status(201).json({ 
      data: {
        ...userGroup,
        users: { id: user.id, email: user.email, name: user.name },
        groups: { id: group.id, name: group.name }
      },
      message: `${user.name} foi adicionado ao grupo ${group.name}`
    })
  } else {
    logger.info(`✅ Usuário ${user.name} adicionado ao grupo ${group.name}`)
    res.status(201).json({ 
      data: completeUserGroup,
      message: `${user.name} foi adicionado ao grupo ${group.name}`
    })
  }
}))

// DELETE /api/groups/remove-user - Remover usuário do grupo
router.delete('/remove-user', asyncHandler(async (req: Request, res: Response) => {
  const { user_email, group_id } = removeUserFromGroupSchema.parse(req.body)
  
  logger.info(`👤 Removendo usuário ${user_email} do grupo ${group_id}`)

  // Buscar o usuário pelo email
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, name')
    .eq('email', user_email)
    .single()

  if (userError) {
    if (userError.code === 'PGRST116') {
      return res.status(404).json({ 
        error: 'Usuário não encontrado',
        message: `Usuário com email ${user_email} não foi encontrado`
      })
    }
    logger.error('❌ Erro ao buscar usuário:', userError)
    throw new Error(`Erro ao buscar usuário: ${userError.message}`)
  }

  // Verificar se o grupo existe
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('id, name')
    .eq('id', group_id)
    .single()

  if (groupError) {
    if (groupError.code === 'PGRST116') {
      return res.status(404).json({ 
        error: 'Grupo não encontrado',
        message: `Grupo com ID ${group_id} não foi encontrado`
      })
    }
    logger.error('❌ Erro ao buscar grupo:', groupError)
    throw new Error(`Erro ao buscar grupo: ${groupError.message}`)
  }

  // Remover usuário do grupo
  const { error: removeError } = await supabase
    .from('user_groups')
    .delete()
    .eq('user_id', user.id)
    .eq('group_id', group_id)

  if (removeError) {
    logger.error('❌ Erro ao remover usuário do grupo:', removeError)
    throw new Error(`Erro ao remover usuário do grupo: ${removeError.message}`)
  }

  logger.info(`✅ Usuário ${user.name} removido do grupo ${group.name}`)
  res.json({ 
    message: `${user.name} foi removido do grupo ${group.name}`
  })
}))

// GET /api/groups/users/me - Buscar grupos do usuário atual
router.get('/users/me', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id
  
  if (!userId) {
    return res.status(401).json({ 
      error: 'Usuário não autenticado' 
    })
  }

  logger.info(`📋 Buscando grupos do usuário: ${req.user?.email}`)

  const { data, error } = await supabase
    .from('user_groups')
    .select(`
      role,
      groups(id, name)
    `)
    .eq('user_id', userId)

  if (error) {
    logger.error('❌ Erro ao buscar grupos do usuário:', error)
    throw new Error(`Erro ao buscar grupos do usuário: ${error.message}`)
  }

  const userGroups = data?.map(ug => ({
    ...ug.groups,
    role: ug.role
  })) || []

  logger.info(`✅ Usuário está em ${userGroups.length} grupos`)
  res.json({ data: userGroups })
}))

export default router 