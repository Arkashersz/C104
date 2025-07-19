// backend/src/config/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { config } from './env'

// Configuração mais flexível para desenvolvimento
const supabaseUrl = config.SUPABASE_URL || 'https://dzyrmbvacyfnkqsuoula.supabase.co'
const supabaseKey = config.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'

// Apenas avisar se não estiver configurado, mas não falhar
if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️  Supabase não configurado. Algumas funcionalidades podem não funcionar.')
    console.warn('   Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

// Função para verificar se o Supabase está configurado
export const isSupabaseConfigured = (): boolean => {
    return !!(config.SUPABASE_URL && config.SUPABASE_SERVICE_ROLE_KEY)
}

// Middleware para verificar configuração antes de usar o Supabase
export const requireSupabase = () => {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase não está configurado. Configure as variáveis de ambiente primeiro.')
    }
}