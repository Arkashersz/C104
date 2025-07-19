// backend/src/config/env.ts
import dotenv from 'dotenv'

dotenv.config()

export const config = {
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  
  // Email
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@yourcompany.com',
  
  // App
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  APP_NAME: process.env.APP_NAME || 'Sistema de Gestão de Contratos',
  
  // Security
  JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret-key',
  CRON_SECRET_KEY: process.env.CRON_SECRET_KEY || 'your-cron-secret',
}

// Validar configurações obrigatórias
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`⚠️  Variável de ambiente ${envVar} não está definida`)
  }
}