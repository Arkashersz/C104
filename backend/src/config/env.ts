// backend/src/config/env.ts
import dotenv from 'dotenv'

dotenv.config()

export const config = {
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // Gmail SMTP (Email)

  
  // Email (Gmail SMTP - GRATUITO)
  GMAIL_USER: 'knowenter@gmail.com',
  GMAIL_APP_PASSWORD: 'yysa bwbd lpyw xspo',
  
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

// Aviso sobre configuração de email
if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  console.warn(`⚠️  Configuração de email Gmail não está completa. Configure GMAIL_USER e GMAIL_APP_PASSWORD`)
}