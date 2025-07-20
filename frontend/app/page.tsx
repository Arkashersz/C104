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
import { BiddingProcessForm } from '@/components/forms/bidding-process-form'
import { MobilePreview } from '@/components/dashboard/mobile-preview'
import { Contract, BiddingProcess } from '@/types/shared'

export default function Dashboard() {
  const [showContractForm, setShowContractForm] = useState(false)
  const [showBiddingForm, setShowBiddingForm] = useState(false)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [biddingProcesses, setBiddingProcesses] = useState<BiddingProcess[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Sincronizar usuário com a tabela users
      await syncUserWithDatabase()

      // Fetch contracts
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select(`
          id,
          contract_number,
          supplier,
          value,
          end_date,
          status,
          created_by:users(name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (contractsError) throw new Error('Falha ao buscar contratos.')
      setContracts(contractsData || [])

      // Fetch bidding processes
      const { data: biddingData, error: biddingError } = await supabase
        .from('bidding_processes')
        .select(`
          id,
          process_number,
          title,
          current_status:process_statuses(name, color),
          created_by:users(name),
          updated_at
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (biddingError) throw new Error('Falha ao buscar processos de licitação.')
      setBiddingProcesses(biddingData || [])

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        <DashboardHeader
          onNewContract={() => setShowContractForm(true)}
          onNewBidding={() => setShowBiddingForm(true)}
        />

        <StatsGrid />

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

        <ContractsTable contracts={contracts} isLoading={isLoading} />

        <BiddingProcessesTable processes={biddingProcesses} isLoading={isLoading} />

        <NotificationCenter />

        {showContractForm && (
          <div className="mt-8">
            <ContractForm
              onSuccess={() => {
                setShowContractForm(false)
                fetchData() // Recarrega os dados
                alert('✅ Contrato criado com sucesso!')
              }}
            />
          </div>
        )}

        {showBiddingForm && (
          <div className="mt-8">
            <BiddingProcessForm
              onSuccess={() => {
                setShowBiddingForm(false)
                fetchData() // Recarrega os dados
                alert('✅ Processo licitatório criado com sucesso!')
              }}
            />
          </div>
        )}

        <MobilePreview />
      </main>
    </div>
  )
}