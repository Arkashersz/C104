'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SharedLayout } from '@/components/layout/shared-layout'
import { ContractCard } from '@/components/contracts/contract-card'
import { ContractsFilters } from '@/components/contracts/contracts-filters'
import { ContractForm } from '@/components/contracts/contract-form'
import { Button } from '@/components/ui/button'
import { useContracts } from '@/lib/hooks/use-contracts'
import { syncUserWithDatabase } from '@/lib/supabase/client'
import { ContractWithRelations, ContractInsert, ContractFilters as ContractFiltersType } from '@/types/contracts'
import { Plus, FileText, AlertCircle } from 'lucide-react'

export default function ContractsPage() {
  const router = useRouter()
  const { contracts, loading, error, pagination, fetchContracts, createContract, updateContract, deleteContract } = useContracts()
  const [showForm, setShowForm] = useState(false)
  const [editingContract, setEditingContract] = useState<ContractWithRelations | null>(null)
  const [currentFilters, setCurrentFilters] = useState<ContractFiltersType>({
    orderBy: 'created_at',
    orderDirection: 'desc'
  })
  const [currentPage, setCurrentPage] = useState(1)

  // Sincronizar usuário e carregar contratos na inicialização
  useEffect(() => {
    const initializePage = async () => {
      try {
        // Sincronizar usuário com a tabela users
        await syncUserWithDatabase()
        
        // Carregar contratos
        await fetchContracts({ page: currentPage, ...currentFilters })
      } catch (err) {
        console.error('Erro ao inicializar página:', err)
      }
    }

    initializePage()
  }, [])

  // Recarregar contratos quando filtros ou página mudarem
  useEffect(() => {
    fetchContracts({ page: currentPage, ...currentFilters })
  }, [currentPage, currentFilters])

  const handleCreateContract = async (data: ContractInsert) => {
    const result = await createContract(data)
    if (result) {
      setShowForm(false)
      fetchContracts({ page: currentPage, ...currentFilters })
    }
  }

  const handleUpdateContract = async (data: ContractInsert) => {
    if (editingContract) {
      const result = await updateContract(editingContract.id, data)
      if (result) {
        setShowForm(false)
        setEditingContract(null)
        fetchContracts({ page: currentPage, ...currentFilters })
      }
    }
  }

  const handleDeleteContract = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este contrato?')) {
      const result = await deleteContract(id)
      if (result) {
        fetchContracts({ page: currentPage, ...currentFilters })
      }
    }
  }

  const handleEditContract = (contract: ContractWithRelations) => {
    setEditingContract(contract)
    setShowForm(true)
  }

  const handleFiltersChange = (filters: ContractFiltersType) => {
    setCurrentFilters(filters)
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setCurrentFilters({
      orderBy: 'created_at',
      orderDirection: 'desc'
    })
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <SharedLayout 
      title="Contratos" 
      subtitle="Gestão completa de contratos"
      icon="📄"
    >
      <div className="space-y-6">
        {/* Header com botão de criar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Lista de Contratos
            </h2>
            <p className="text-gray-600">
              {pagination.total} contrato{pagination.total !== 1 ? 's' : ''} encontrado{pagination.total !== 1 ? 's' : ''}
            </p>
          </div>
          
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Contrato
          </Button>
        </div>

        {/* Filtros */}
        <ContractsFilters
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />

        {/* Erro */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Lista de contratos */}
        {!loading && contracts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum contrato encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              {Object.keys(currentFilters).length > 0 
                ? 'Tente ajustar os filtros ou criar um novo contrato.'
                : 'Comece criando seu primeiro contrato.'
              }
            </p>
            {Object.keys(currentFilters).length === 0 && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Contrato
              </Button>
            )}
          </div>
        )}

        {/* Grid de contratos */}
        {!loading && contracts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contracts.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                onEdit={handleEditContract}
                onDelete={handleDeleteContract}
              />
            ))}
          </div>
        )}

        {/* Paginação */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            
            <span className="text-sm text-gray-600">
              Página {currentPage} de {pagination.totalPages}
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.totalPages}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>

      {/* Modal do formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <ContractForm
              contract={editingContract || undefined}
              onSubmit={editingContract ? handleUpdateContract : handleCreateContract}
              onCancel={() => {
                setShowForm(false)
                setEditingContract(null)
              }}
              loading={loading}
            />
          </div>
        </div>
      )}
    </SharedLayout>
  )
}