'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { syncUserWithDatabase } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { StatsGrid } from '@/components/dashboard/stats-grid'
import { ContractsTable } from '@/components/dashboard/contracts-table'
import { BiddingProcessesTable } from '@/components/dashboard/bidding-processes-table'
import { NotificationCenter } from '@/components/dashboard/notification-center'
import { ContractForm } from '@/components/forms/contract-form-simple'
import { BiddingForm } from '@/components/bidding/bidding-form'
import { MobilePreview } from '@/components/dashboard/mobile-preview'
import { Contract, BiddingProcess } from '@/types/shared'
import { ContractStats } from '@/types/contracts'
import { BiddingStats } from '@/types/bidding'
import { useContracts } from '@/lib/hooks/use-contracts'
import { useBidding } from '@/lib/hooks/use-bidding'

export default function Dashboard() {
  const [showContractForm, setShowContractForm] = useState(false)
  const [showBiddingForm, setShowBiddingForm] = useState(false)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [contractsTotal, setContractsTotal] = useState(0)
  const [contractsPage, setContractsPage] = useState(1)
  const [biddingProcesses, setBiddingProcesses] = useState<BiddingProcess[]>([])
  const [biddingTotal, setBiddingTotal] = useState(0)
  const [biddingPage, setBiddingPage] = useState(1)
  const [contractStats, setContractStats] = useState<ContractStats | null>(null)
  const [biddingStats, setBiddingStats] = useState<BiddingStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const PAGE_SIZE = 5
  const supabase = createClient()

  // Usar os hooks para acessar as funções de estatísticas
  const { fetchStats: fetchContractStats } = useContracts()
  const { fetchStats: fetchBiddingStats } = useBidding()

  // Função para buscar estatísticas
  const fetchStats = useCallback(async () => {
    try {
      // Buscar estatísticas de contratos
      const contractStatsData = await fetchContractStats()
      setContractStats(contractStatsData)

      // Buscar estatísticas de licitações
      const biddingStatsData = await fetchBiddingStats()
      setBiddingStats(biddingStatsData)
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err)
    }
  }, [fetchContractStats, fetchBiddingStats])

  // Função para buscar contratos
  const fetchContractsPage = useCallback(async (page = contractsPage) => {
    setIsLoading(true)
    setError(null)
    try {
      await syncUserWithDatabase()
      const contractsFrom = (page - 1) * PAGE_SIZE
      const contractsTo = contractsFrom + PAGE_SIZE - 1
      const { data: contractsData, error: contractsError, count: contractsCount } = await supabase
        .from('contracts')
        .select(`
          id,
          contract_number,
          supplier,
          value,
          end_date,
          status,
          created_by:users(name, email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(contractsFrom, contractsTo)
      if (contractsError) throw new Error('Falha ao buscar contratos.')
      setContracts(contractsData || [])
      setContractsTotal(contractsCount || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, contractsPage])

  // Função para buscar licitações
  const fetchBiddingPage = useCallback(async (page = biddingPage) => {
    setIsLoading(true)
    setError(null)
    try {
      await syncUserWithDatabase()
      const biddingFrom = (page - 1) * PAGE_SIZE
      const biddingTo = biddingFrom + PAGE_SIZE - 1
      const { data: biddingData, error: biddingError, count: biddingCount } = await supabase
        .from('bidding_processes')
        .select(`
          id,
          process_number,
          title,
          current_status:process_statuses(name, color),
          created_by:users(name),
          updated_at
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(biddingFrom, biddingTo)
      if (biddingError) throw new Error('Falha ao buscar processos de licitação.')
      setBiddingProcesses(biddingData || [])
      setBiddingTotal(biddingCount || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, biddingPage])

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true)
      try {
        await Promise.all([
          fetchContractsPage(contractsPage),
          fetchBiddingPage(biddingPage),
          fetchStats()
        ])
      } catch (err) {
        console.error('Erro ao carregar dados iniciais:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadInitialData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Paginação contratos
  const contractsTotalPages = Math.ceil(contractsTotal / PAGE_SIZE)
  const handleContractsPageChange = (newPage: number) => {
    setContractsPage(newPage)
    fetchContractsPage(newPage)
  }

  // Paginação licitações
  const biddingTotalPages = Math.ceil(biddingTotal / PAGE_SIZE)
  const handleBiddingPageChange = (newPage: number) => {
    setBiddingPage(newPage)
    fetchBiddingPage(newPage)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        <DashboardHeader
          onNewContract={() => setShowContractForm(true)}
          onNewBidding={() => setShowBiddingForm(true)}
        />

        <StatsGrid 
          contractStats={contractStats}
          biddingStats={biddingStats}
          loading={isLoading}
        />

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

        <ContractsTable contracts={contracts} isLoading={isLoading} />
        {/* Paginação contratos */}
        {contractsTotalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-2 mb-8">
            <button
              className="px-3 py-1 rounded border text-sm"
              onClick={() => handleContractsPageChange(contractsPage - 1)}
              disabled={contractsPage === 1}
            >Anterior</button>
            <span className="text-sm text-gray-600">
              Página {contractsPage} de {contractsTotalPages}
            </span>
            <button
              className="px-3 py-1 rounded border text-sm"
              onClick={() => handleContractsPageChange(contractsPage + 1)}
              disabled={contractsPage === contractsTotalPages}
            >Próxima</button>
          </div>
        )}

        <BiddingProcessesTable processes={biddingProcesses} isLoading={isLoading} />
        {/* Paginação licitações */}
        {biddingTotalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-2 mb-8">
            <button
              className="px-3 py-1 rounded border text-sm"
              onClick={() => handleBiddingPageChange(biddingPage - 1)}
              disabled={biddingPage === 1}
            >Anterior</button>
            <span className="text-sm text-gray-600">
              Página {biddingPage} de {biddingTotalPages}
            </span>
            <button
              className="px-3 py-1 rounded border text-sm"
              onClick={() => handleBiddingPageChange(biddingPage + 1)}
              disabled={biddingPage === biddingTotalPages}
            >Próxima</button>
          </div>
        )}

        <NotificationCenter />

        {showContractForm && (
          <div className="mt-8">
            <ContractForm
              onSuccess={() => {
                setShowContractForm(false)
                fetchContractsPage() // Recarrega os dados
                fetchStats() // Recarrega as estatísticas
                alert('✅ Contrato criado com sucesso!')
              }}
            />
          </div>
        )}

        {showBiddingForm && (
          <BiddingForm
            bidding={null}
            isOpen={showBiddingForm}
            onClose={() => setShowBiddingForm(false)}
            onSuccess={() => {
              setShowBiddingForm(false)
              fetchBiddingPage() // Recarrega os dados
              fetchStats() // Recarrega as estatísticas
              alert('✅ Processo licitatório criado com sucesso!')
            }}
          />
        )}

        <MobilePreview />
      </main>
    </div>
  )
}