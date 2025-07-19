// backend/src/middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'
import { config } from '../config/env'

interface CustomError extends Error {
  statusCode?: number
  code?: string
}

export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log do erro
  logger.error('Erro na aplicação:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  })

  // Status code padrão
  let statusCode = error.statusCode || 500
  let message = error.message || 'Erro interno do servidor'

  // Tratar diferentes tipos de erro
  switch (error.code) {
    case 'ENOTFOUND':
      statusCode = 503
      message = 'Serviço temporariamente indisponível'
      break
    
    case 'ECONNREFUSED':
      statusCode = 503
      message = 'Não foi possível conectar ao banco de dados'
      break
    
    case 'LIMIT_FILE_SIZE':
      statusCode = 413
      message = 'Arquivo muito grande'
      break
    
    case 'LIMIT_UNEXPECTED_FILE':
      statusCode = 400
      message = 'Tipo de arquivo não permitido'
      break
  }

  // Tratar erros específicos do Supabase
  if (error.message?.includes('JWT')) {
    statusCode = 401
    message = 'Token de autenticação inválido'
  }

  if (error.message?.includes('duplicate key')) {
    statusCode = 409
    message = 'Registro já existe'
  }

  if (error.message?.includes('foreign key')) {
    statusCode = 400
    message = 'Referência inválida'
  }

  // Resposta de erro
  const errorResponse: any = {
    error: true,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  }

  // Incluir stack trace apenas em desenvolvimento
  if (config.NODE_ENV === 'development') {
    errorResponse.stack = error.stack
    errorResponse.details = error
  }

  // Incluir request ID se disponível
  if (req.headers['x-request-id']) {
    errorResponse.requestId = req.headers['x-request-id']
  }

  res.status(statusCode).json(errorResponse)
}

// Middleware para capturar erros assíncronos
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// Middleware para 404
export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn(`Rota não encontrada: ${req.method} ${req.url}`)
  
  res.status(404).json({
    error: true,
    message: 'Rota não encontrada',
    statusCode: 404,
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  })
}