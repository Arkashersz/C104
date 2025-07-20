// lib/supabase/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'

export const createClient = () => createClientComponentClient<Database>()

// Função para verificar se o usuário está sincronizado com a tabela users
export const syncUserWithDatabase = async () => {
  const supabase = createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    console.error('Usuário não autenticado:', userError)
    return null
  }

  // Apenas verificar se o usuário existe na tabela users
  // O trigger deve criar automaticamente quando necessário
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('id', user.id)
    .single()

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = não encontrado
    console.error('Erro ao verificar usuário:', checkError)
  }

  if (!existingUser) {
    console.log('Usuário não encontrado na tabela users. O trigger deve criar automaticamente.')
  } else {
    console.log('Usuário encontrado na tabela users:', existingUser.name)
  }

  return user
}

// Função para inserir usuário manualmente (use apenas se necessário)
export const insertUserManually = async () => {
  const supabase = createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    console.error('Usuário não autenticado:', userError)
    return null
  }

  try {
    const { error: insertError } = await supabase
      .from('users')
      .insert([{
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email || 'Usuário',
        role: 'user'
      }])
      .select()

    if (insertError) {
      console.error('Erro ao inserir usuário:', insertError)
      return null
    }

    console.log('Usuário inserido manualmente:', user.id)
    return user
  } catch (err) {
    console.error('Erro ao inserir usuário:', err)
    return null
  }
}

// Função para obter informações do usuário atual (útil para debug)
export const getCurrentUserInfo = async () => {
  const supabase = createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    console.error('Usuário não autenticado:', userError)
    return null
  }

  console.log('=== INFORMAÇÕES DO USUÁRIO ATUAL ===')
  console.log('ID:', user.id)
  console.log('Email:', user.email)
  console.log('Nome:', user.user_metadata?.name)
  console.log('Metadata:', user.user_metadata)
  console.log('=====================================')

  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || user.email || 'Usuário'
  }
}