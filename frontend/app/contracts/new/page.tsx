'use client'

import { useRouter } from 'next/navigation'
import { SharedLayout } from '@/components/layout/shared-layout'
import { ContractForm } from '@/components/contracts/contract-form'
import { useContracts } from '@/lib/hooks/use-contracts'
import { ContractInsert } from '@/types/contracts'

export default function NewContractPage() {
  const router = useRouter()
  const { createContract, loading } = useContracts()

  const handleCreateContract = async (data: ContractInsert) => {
    const result = await createContract(data)
    if (result) {
      router.push('/contracts')
    }
  }

  const handleCancel = () => {
    router.push('/contracts')
  }

  return (
    <SharedLayout 
      title="Novo Contrato" 
      subtitle="Criar um novo contrato"
      icon="📄"
    >
      <div className="max-w-4xl mx-auto">
        <ContractForm
          onSubmit={handleCreateContract}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </SharedLayout>
  )
}
