// lib/hooks/use-bidding.ts
import { useState, useEffect, useCallback } from 'react'
import { createClient, syncUserWithDatabase } from '@/lib/supabase/client'
import { 
  BiddingProcess, 
  BiddingProcessInsert, 
  BiddingProcessUpdate, 
  BiddingProcessWithRelations,
  BiddingFilters,
  BiddingListResponse,
  BiddingStats
} from '@/types/bidding'

export function useBidding() {
  const [biddingProcesses, setBiddingProcesses] = useState<BiddingProcessWithRelations[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const supabase = createClient()

  // Buscar processos de licitação
  const fetchBiddingProcesses = useCallback(async (filters: BiddingFilters = {}) => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('bidding_processes')
        .select(`
          *,
          created_by:users(name, email),
          current_status:process_statuses(id, name, color, description)
        `, { count: 'exact' })

      // Aplicar ordenação
      const orderBy = filters.orderBy || 'created_at'
      const orderDirection = filters.orderDirection || 'desc'
      query = query.order(orderBy, { ascending: orderDirection === 'asc' })

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('current_status_id', filters.status)
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,process_number.ilike.%${filters.search}%`)
      }

      // Paginação
      const page = filters.page || 1
      const limit = filters.limit || 10
      const from = (page - 1) * limit
      const to = from + limit - 1

      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        console.error('Erro ao buscar processos:', error)
        throw new Error('Erro ao buscar processos de licitação')
      }

      setBiddingProcesses(data || [])
      setPagination({
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      })
    } catch (err) {
      console.error('Erro no fetchBiddingProcesses:', err)
      setError(err instanceof Error ? err.message : 'Erro ao buscar processos de licitação')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Buscar processo por ID
  const fetchBiddingProcess = useCallback(async (id: string): Promise<BiddingProcessWithRelations | null> => {
    try {
      const { data, error } = await supabase
        .from('bidding_processes')
        .select(`
          *,
          created_by:users(name, email),
          current_status:process_statuses(id, name, color, description),
          status_history:process_status_history(
            id,
            notes,
            created_at,
            status:process_statuses(id, name, color),
            changed_by:users(name, email)
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erro ao buscar processo:', error)
        throw error
      }

      return data
    } catch (err) {
      console.error('Erro no fetchBiddingProcess:', err)
      setError(err instanceof Error ? err.message : 'Erro ao buscar processo de licitação')
      return null
    }
  }, [supabase])

  // Criar processo de licitação
  const createBiddingProcess = useCallback(async (biddingData: BiddingProcessInsert): Promise<BiddingProcess | null> => {
    setLoading(true)
    setError(null)

    try {
      // Sincronizar usuário com a tabela users
      const user = await syncUserWithDatabase()
      
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      const biddingWithUser = {
        ...biddingData,
        created_by: user.id
      }

      const { data, error } = await supabase
        .from('bidding_processes')
        .insert([biddingWithUser])
        .select(`
          *,
          created_by:users(name, email),
          current_status:process_statuses(id, name, color, description)
        `)
        .single()

      if (error) {
        console.error('Erro ao criar processo:', error)
        throw error
      }

      // Atualizar lista local
      setBiddingProcesses(prev => [data, ...prev])
      return data
    } catch (err) {
      console.error('Erro no createBiddingProcess:', err)
      setError(err instanceof Error ? err.message : 'Erro ao criar processo de licitação')
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Atualizar processo de licitação
  const updateBiddingProcess = useCallback(async (id: string, biddingData: BiddingProcessUpdate): Promise<BiddingProcess | null> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('bidding_processes')
        .update({
          ...biddingData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          created_by:users(name, email),
          current_status:process_statuses(id, name, color, description)
        `)
        .single()

      if (error) {
        console.error('Erro ao atualizar processo:', error)
        throw error
      }

      // Atualizar lista local
      setBiddingProcesses(prev => 
        prev.map(process => 
          process.id === id ? { ...process, ...data } : process
        )
      )

      return data
    } catch (err) {
      console.error('Erro no updateBiddingProcess:', err)
      setError(err instanceof Error ? err.message : 'Erro ao atualizar processo de licitação')
      return null
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Deletar processo de licitação
  const deleteBiddingProcess = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('bidding_processes')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao deletar processo:', error)
        throw error
      }

      // Remover da lista local
      setBiddingProcesses(prev => prev.filter(process => process.id !== id))
      return true
    } catch (err) {
      console.error('Erro no deleteBiddingProcess:', err)
      setError(err instanceof Error ? err.message : 'Erro ao deletar processo de licitação')
      return false
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Buscar estatísticas
  const fetchStats = useCallback(async (): Promise<BiddingStats | null> => {
    try {
      // Total de processos
      const { count: total } = await supabase
        .from('bidding_processes')
        .select('*', { count: 'exact', head: true })

      // Processos por status
      const { count: draft } = await supabase
        .from('bidding_processes')
        .select('*', { count: 'exact', head: true })
        .eq('current_status_id', 'draft')

      const { count: approval } = await supabase
        .from('bidding_processes')
        .select('*', { count: 'exact', head: true })
        .eq('current_status_id', 'approval')

      const { count: published } = await supabase
        .from('bidding_processes')
        .select('*', { count: 'exact', head: true })
        .eq('current_status_id', 'published')

      const { count: closed } = await supabase
        .from('bidding_processes')
        .select('*', { count: 'exact', head: true })
        .eq('current_status_id', 'closed')

      // Processos ativos (não fechados)
      const { count: active } = await supabase
        .from('bidding_processes')
        .select('*', { count: 'exact', head: true })
        .neq('current_status_id', 'closed')

      return {
        total: total || 0,
        draft: draft || 0,
        approval: approval || 0,
        published: published || 0,
        closed: closed || 0,
        active: active || 0
      }
    } catch (err) {
      console.error('Erro no fetchStats:', err)
      setError(err instanceof Error ? err.message : 'Erro ao buscar estatísticas')
      return null
    }
  }, [supabase])

  // Buscar status disponíveis
  const fetchStatuses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('process_statuses')
        .select('*')
        .order('order_sequence', { ascending: true })

      if (error) {
        console.error('Erro ao buscar status:', error)
        throw error
      }

      return data || []
    } catch (err) {
      console.error('Erro no fetchStatuses:', err)
      setError(err instanceof Error ? err.message : 'Erro ao buscar status')
      return []
    }
  }, [supabase])

  return {
    biddingProcesses,
    loading,
    error,
    pagination,
    fetchBiddingProcesses,
    fetchBiddingProcess,
    createBiddingProcess,
    updateBiddingProcess,
    deleteBiddingProcess,
    fetchStats,
    fetchStatuses
  }
}
