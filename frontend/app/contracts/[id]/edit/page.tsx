'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SharedLayout } from '@/components/layout/shared-layout'
import { ContractForm } from '@/components/contracts/contract-form'
import { Loading } from '@/components/ui/loading'
import { useContracts } from '@/lib/hooks/use-contracts'
import { ContractWithRelations, ContractInsert } from '@/types/contracts'

export default function EditContractPage() {
  const params = useParams()
  const router = useRouter()
  const contractId = params.id as string
  
  const {
    fetchContract,
    updateContract,
    loading,
    error
  } = useContracts()

  const [contract, setContract] = useState<ContractWithRelations | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadContract = async () => {
      if (contractId) {
        const data = await fetchContract(contractId)
        setContract(data)
        setIsLoading(false)
      }
    }

    loadContract()
  }, [contractId])

  const handleUpdateContract = async (data: ContractInsert) => {
    if (contract) {
      const result = await updateContract(contract.id, data)
      if (result) {
        router.push(`/contracts/${contract.id}`)
      }
    }
  }

  const handleCancel = () => {
    router.push(`/contracts/${contractId}`)
  }

  if (isLoading) {
    return (
      <SharedLayout title="Carregando..." subtitle="" icon="📄">
        <div className="flex items-center justify-center py-12">
          <Loading className="h-8 w-8" />
        </div>
      </SharedLayout>
    )
  }

  if (error || !contract) {
    return (
      <SharedLayout title="Erro" subtitle="" icon="📄">
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-red-700">
            {error || 'Contrato não encontrado'}
          </span>
        </div>
      </SharedLayout>
    )
  }

  return (
    <SharedLayout 
      title="Editar Contrato" 
      subtitle={`Editando: ${contract.title}`}
      icon="📄"
    >
      <div className="max-w-4xl mx-auto">
        <ContractForm
          contract={contract}
          onSubmit={handleUpdateContract}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </SharedLayout>
  )
}
