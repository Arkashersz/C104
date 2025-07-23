// lib/hooks/use-contracts.ts
import { useState, useEffect } from 'react'
import { createClient, syncUserWithDatabase } from '@/lib/supabase/client'
import { 
  Contract, 
  ContractInsert, 
  ContractUpdate, 
  ContractWithRelations,
  ContractFilters,
  ContractListResponse,
  ContractStats
} from '@/types/contracts'

export function useContracts() {
  const [contracts, setContracts] = useState<ContractWithRelations[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const supabase = createClient()

  // Buscar contratos
  const fetchContracts = async (filters: ContractFilters = {}) => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('contracts')
        .select(`
          *,
          created_by:users(name, email)
        `, { count: 'exact' })

      // Aplicar ordenação
      const orderBy = filters.orderBy || 'created_at'
      const orderDirection = filters.orderDirection || 'desc'
      query = query.order(orderBy, { ascending: orderDirection === 'asc' })

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.supplier) {
        query = query.ilike('supplier', `%${filters.supplier}%`)
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,contract_number.ilike.%${filters.search}%`)
      }

      // Paginação
      const page = filters.page || 1
      const limit = filters.limit || 10
      const from = (page - 1) * limit
      const to = from + limit - 1

      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      setContracts(data || [])
      setPagination({
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar contratos')
    } finally {
      setLoading(false)
    }
  }

  // Buscar contrato por ID
  const fetchContract = async (id: string): Promise<ContractWithRelations | null> => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          created_by:users(name, email),
          documents(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar contrato')
      return null
    }
  }

  // Criar contrato
  const createContract = async (contractData: ContractInsert): Promise<Contract | null> => {
    setLoading(true)
    setError(null)

    try {
      // Sincronizar usuário com a tabela users
      const user = await syncUserWithDatabase()
      
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      const contractWithUser = {
        ...contractData,
        created_by: user.id
      }

      const { data, error } = await supabase
        .from('contracts')
        .insert([contractWithUser])
        .select(`
          *,
          created_by:users(name, email)
        `)
        .single()

      if (error) throw error

      // Atualizar lista local
      setContracts(prev => [data, ...prev])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar contrato')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Atualizar contrato
  const updateContract = async (id: string, contractData: ContractUpdate): Promise<Contract | null> => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('contracts')
        .update({
          ...contractData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          created_by:users(name, email)
        `)
        .single()

      if (error) throw error

      // Atualizar lista local
      setContracts(prev => 
        prev.map(contract => 
          contract.id === id ? { ...contract, ...data } : contract
        )
      )

      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar contrato')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Deletar contrato
  const deleteContract = async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Remover da lista local
      setContracts(prev => prev.filter(contract => contract.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar contrato')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Buscar contratos próximos ao vencimento
  const fetchExpiringContracts = async (days: number = 30): Promise<ContractWithRelations[]> => {
    try {
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + days)

      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          created_by:users(name, email)
        `)
        .eq('status', 'active')
        .lte('end_date', targetDate.toISOString().split('T')[0])
        .order('end_date', { ascending: true })

      if (error) throw error

      return data || []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar contratos próximos ao vencimento')
      return []
    }
  }

  // Buscar estatísticas
  const fetchStats = async (): Promise<ContractStats | null> => {
    try {
      // Total de contratos
      const { count: total } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })

      // Contratos ativos
      const { count: active } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // Contratos expirados
      const { count: expired } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'expired')

      // Contratos cancelados
      const { count: cancelled } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'cancelled')

      // Contratos renovados
      const { count: renewed } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'renewed')

      // Contratos próximos ao vencimento (30 dias)
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + 30)
      
      const { count: expiringSoon } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .lte('end_date', targetDate.toISOString().split('T')[0])

      // Valor total contratado (somando todos os contratos ativos)
      const { data: activeContracts } = await supabase
        .from('contracts')
        .select('value')
        .eq('status', 'active')
      
      const totalValue = activeContracts?.reduce((sum, contract) => sum + (contract.value || 0), 0) || 0

      return {
        total: total || 0,
        active: active || 0,
        expired: expired || 0,
        cancelled: cancelled || 0,
        renewed: renewed || 0,
        expiringSoon: expiringSoon || 0,
        totalValue: totalValue
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar estatísticas')
      return null
    }
  }

  return {
    contracts,
    loading,
    error,
    pagination,
    fetchContracts,
    fetchContract,
    createContract,
    updateContract,
    deleteContract,
    fetchExpiringContracts,
    fetchStats
  }
}
