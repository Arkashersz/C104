// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express'
import { supabase } from '../config/supabase'
import { logger } from '../utils/logger'

// Extender interface Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    
    logger.info(`🔐 Auth middleware - Path: ${req.path}, Method: ${req.method}`)
    
    if (!authHeader) {
      logger.warn('❌ Auth header não encontrado')
      return res.status(401).json({ 
        error: 'Token de acesso requerido',
        message: 'Faça login para acessar este recurso'
      })
    }

    const token = authHeader.replace('Bearer ', '')
    
    if (!token) {
      logger.warn('❌ Token vazio após remover Bearer')
      return res.status(401).json({ 
        error: 'Token inválido',
        message: 'Formato do token deve ser: Bearer <token>'
      })
    }

    logger.info(`🔑 Token recebido: ${token.substring(0, 20)}...`)

    // Verificar token com Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      logger.warn('❌ Token de autenticação inválido:', error?.message)
      return res.status(401).json({ 
        error: 'Token inválido ou expirado',
        message: 'Faça login novamente'
      })
    }

    logger.info(`✅ Usuário autenticado: ${user.email}`)

    // Buscar dados adicionais do usuário se necessário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (userError && userError.code !== 'PGRST116') {
      logger.error('Erro ao buscar dados do usuário:', userError)
    }

    // Adicionar usuário ao request
    req.user = {
      ...user,
      ...userData,
    }

    logger.info(`✅ Auth middleware concluído para usuário: ${user.email}`)
    next()
  } catch (error) {
    logger.error('❌ Erro no middleware de autenticação:', error)
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: 'Tente novamente em alguns instantes'
    })
  }
}

// Middleware para verificar roles específicos
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuário não autenticado' 
      })
    }

    const userRole = req.user.role || 'user'
    
    if (!roles.includes(userRole)) {
      logger.warn(`Acesso negado para usuário ${req.user.id} com role ${userRole}`)
      return res.status(403).json({ 
        error: 'Acesso negado',
        message: 'Você não tem permissão para acessar este recurso'
      })
    }

    next()
  }
}

// Middleware para verificar se é admin
export const requireAdmin = requireRole(['admin'])

// Middleware para verificar se é admin ou manager
export const requireManager = requireRole(['admin', 'manager'])