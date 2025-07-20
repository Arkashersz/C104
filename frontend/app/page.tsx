'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { StatsGrid } from '@/components/dashboard/stats-grid'
import { ContractsTable } from '@/components/dashboard/contracts-table'
import { BiddingProcessesTable } from '@/components/dashboard/bidding-processes-table'
import { NotificationCenter } from '@/components/dashboard/notification-center'
import { ContractForm } from '@/components/forms/contract-form-simple'
import { BiddingProcessForm } from '@/components/forms/bidding-process-form'
import { MobilePreview } from '@/components/dashboard/mobile-preview'

export default function Dashboard() {
  const [showContractForm, setShowContractForm] = useState(false)
  const [showBiddingForm, setShowBiddingForm] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      <DemoNote />
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <DashboardHeader 
          onNewContract={() => setShowContractForm(true)}
          onNewBidding={() => setShowBiddingForm(true)}
        />
        
        <StatsGrid />
        
        <ContractsTable />
        
        <BiddingProcessesTable />
        
        <NotificationCenter />
        
        {showContractForm && (
          <div className="mt-8">
            <ContractForm 
              onSuccess={() => {
                setShowContractForm(false)
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