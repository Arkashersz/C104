import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SEIProcess, SEIProcessWithRelations } from '@/types/shared'

interface SEIProcessFilters {
  search?: string
  type?: string
  status?: string
  group_id?: string
  page?: number
  limit?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function useSEIProcesses() {
  const supabase = createClient()
  const [processes, setProcesses] = useState<SEIProcessWithRelations[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  // Função para obter token de autenticação
  const getAuthToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('Usuário não autenticado')
    }
    return session.access_token
  }, [supabase])

  // Função para sincronizar usuário com a tabela users
  const syncUserWithDatabase = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!existingUser) {
      const { data: newUser } = await supabase
        .from('users')
        .insert([{
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.email!.split('@')[0]
        }])
        .select()
        .single()
      return newUser
    }

    return existingUser
  }, [supabase])

  // Buscar processos com filtros e paginação
  const fetchProcesses = useCallback(async (filters: SEIProcessFilters = {}) => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('sei_processes')
        .select(`
          *,
          group:groups(id, name),
          created_by_user:users!created_by(id, name, email)
        `, { count: 'exact' })

      // Aplicar filtros
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,process_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      if (filters.type) {
        query = query.eq('type', filters.type)
      }

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.group_id) {
        query = query.eq('group_id', filters.group_id)
      }

      // Aplicar ordenação
      const orderBy = filters.orderBy || 'created_at'
      const orderDirection = filters.orderDirection || 'desc'
      query = query.order(orderBy, { ascending: orderDirection === 'asc' })

      // Aplicar paginação
      const page = filters.page || 1
      const limit = filters.limit || 10
      const from = (page - 1) * limit
      const to = from + limit - 1

      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        console.error('Erro ao buscar processos:', error)
        throw new Error('Erro ao buscar processos')
      }

      setProcesses(data || [])
      setPagination({
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      })
    } catch (err) {
      console.error('Erro no fetchProcesses:', err)
      setError(err instanceof Error ? err.message : 'Erro ao buscar processos')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Buscar processo por ID
  const fetchProcess = useCallback(async (id: string): Promise<SEIProcessWithRelations | null> => {
    try {
      const { data, error } = await supabase
        .from('sei_processes')
        .select(`
          *,
          group:groups(id, name),
          created_by_user:users!created_by(id, name, email)
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erro ao buscar processo:', error)
        throw error
      }

      return data
    } catch (err) {
      console.error('Erro no fetchProcess:', err)
      setError(err instanceof Error ? err.message : 'Erro ao buscar processo')
      return null
    }
  }, [supabase])

  // Criar processo usando API do backend
  const createProcess = useCallback(async (processData: Omit<SEIProcess, 'id'>): Promise<SEIProcessWithRelations | null> => {
    setLoading(true)
    setError(null)

    try {
      // Sincronizar usuário com a tabela users
      const user = await syncUserWithDatabase()
      
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Obter token de autenticação
      const token = await getAuthToken()

      // Usar API do backend para criar processo (isso enviará as notificações)
      const response = await fetch('http://localhost:3001/api/sei-processes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(processData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao criar processo')
      }

      const { data } = await response.json()

      // Buscar dados completos do processo criado
      const fullProcess = await fetchProcess(data.id)
      
      if (fullProcess) {
        // Atualizar lista local
        setProcesses(prev => [fullProcess, ...prev])
        return fullProcess
      }

      return null
    } catch (err) {
      console.error('Erro no createProcess:', err)
      setError(err instanceof Error ? err.message : 'Erro ao criar processo')
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase, syncUserWithDatabase, getAuthToken, fetchProcess])

  // Atualizar processo usando API do backend
  const updateProcess = useCallback(async (id: string, processData: Partial<SEIProcess>): Promise<SEIProcessWithRelations | null> => {
    setLoading(true)
    setError(null)

    try {
      // Obter token de autenticação
      const token = await getAuthToken()

      // Usar API do backend para atualizar processo (isso enviará as notificações se o grupo mudou)
      const response = await fetch(`http://localhost:3001/api/sei-processes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(processData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao atualizar processo')
      }

      const { data } = await response.json()

      // Buscar dados completos do processo atualizado
      const fullProcess = await fetchProcess(id)
      
      if (fullProcess) {
        // Atualizar lista local
        setProcesses(prev => 
          prev.map(process => 
            process.id === id ? fullProcess : process
          )
        )
        return fullProcess
      }

      return null
    } catch (err) {
      console.error('Erro no updateProcess:', err)
      setError(err instanceof Error ? err.message : 'Erro ao atualizar processo')
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase, getAuthToken, fetchProcess])

  // Deletar processo
  const deleteProcess = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('sei_processes')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar processo:', error)
        throw error
      }

      // Remover da lista local
      setProcesses(prev => prev.filter(process => process.id !== id))
      return true
    } catch (err) {
      console.error('Erro no deleteProcess:', err)
      setError(err instanceof Error ? err.message : 'Erro ao deletar processo')
      return false
    } finally {
      setLoading(false)
    }
  }, [supabase])

  return {
    processes,
    loading,
    error,
    pagination,
    fetchProcesses,
    fetchProcess,
    createProcess,
    updateProcess,
    deleteProcess
  }
} 