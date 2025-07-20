'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { StatsGrid } from '@/components/dashboard/stats-grid'
import { ContractsTable } from '@/components/dashboard/contracts-table'
import { BiddingProcessesTable } from '@/components/dashboard/bidding-processes-table'
import { NotificationCenter } from '@/components/dashboard/notification-center'
import { ContractForm } from '@/components/forms/contract-form-simple'
import { BiddingProcessForm } from '@/components/forms/bidding-process-form'
import { MobilePreview } from '@/components/dashboard/mobile-preview'
import { createClient } from '@/lib/supabase/client'

// Tipos para os dados, baseados nos arquivos do backend
interface Contract {
  id: string;
  contract_number: string;
  supplier: string;
  value: number;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled' | 'renewed';
}

interface BiddingProcess {
  id: string;
  process_number: string;
  title: string;
  current_status: { name: string; color: string };
  created_by: { name: string };
  updated_at: string;
}


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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado.');
      }
      const token = session.access_token;

      // Fetch contracts
      const contractsRes = await fetch('http://localhost:3001/api/contracts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!contractsRes.ok) throw new Error('Falha ao buscar contratos.');
      const contractsData = await contractsRes.json();
      setContracts(contractsData.data || []);

      // Fetch bidding processes
      const biddingRes = await fetch('http://localhost:3001/api/bidding', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!biddingRes.ok) throw new Error('Falha ao buscar processos de licitação.');
      const biddingData = await biddingRes.json();
      setBiddingProcesses(biddingData.data || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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