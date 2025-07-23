'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Button } from '@/components/ui/button'
import { ContractCard } from '@/components/contracts/contract-card'
import { ContractsFilters } from '@/components/contracts/contracts-filters'
import { ContractForm } from '@/components/forms/contract-form-simple'
import { Plus, FileText, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { ContractWithRelations, ContractInsert, ContractFilters as ContractFiltersType } from '@/types/contracts'
import { useContracts } from '@/lib/hooks/use-contracts'
import { Dialog } from '@/components/ui/dialog'

export default function ContractsPage() {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingContract, setEditingContract] = useState<ContractWithRelations | null>(null)
  const [currentFilters, setCurrentFilters] = useState<ContractFiltersType>({
    search: '',
    status: undefined,
    supplier: '',
    orderBy: 'created_at',
    orderDirection: 'desc',
  })

  const {
    contracts,
    loading,
    error,
    pagination,
    fetchContracts,
    deleteContract
  } = useContracts()

  // Carregar dados iniciais apenas uma vez
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchContracts({
          page: 1,
          limit: 10,
          ...currentFilters
        })
      } catch (err) {
        console.error('Erro ao carregar dados iniciais:', err)
      }
    }
    loadInitialData()
  }, [])

  const handleFiltersChange = useCallback((filters: ContractFiltersType) => {
    setCurrentFilters({
      ...currentFilters,
      ...filters
    })
    fetchContracts({
      page: 1,
      limit: 10,
      ...filters
    })
  }, [fetchContracts, currentFilters])

  const handlePageChange = useCallback((page: number) => {
    fetchContracts({
      page,
      limit: 10,
      ...currentFilters
    })
  }, [fetchContracts, currentFilters])

  const handleEdit = useCallback((contract: ContractWithRelations) => {
    setEditingContract(contract)
    setShowForm(true)
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    const success = await deleteContract(id)
    if (success) {
      fetchContracts({
        page: pagination.page,
        limit: 10,
        ...currentFilters
      })
    }
  }, [deleteContract, fetchContracts, pagination.page, currentFilters])

  const handleFormSuccess = useCallback(() => {
    setEditingContract(null)
    setShowForm(false)
    fetchContracts({
      page: pagination.page,
      limit: 10,
      ...currentFilters
    })
  }, [fetchContracts, pagination.page, currentFilters])

  const handleRefresh = useCallback(() => {
    fetchContracts({
      page: pagination.page,
      limit: 10,
      ...currentFilters
    })
  }, [fetchContracts, pagination.page, currentFilters])

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Botão Voltar */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-700 text-base font-normal bg-transparent border-none shadow-none p-0 hover:bg-transparent focus:outline-none"
              style={{ boxShadow: 'none', border: 'none', background: 'none' }}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
          </div>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contratos</h1>
              <p className="text-gray-600 mt-2">
                Gerencie todos os contratos administrativos da instituição
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Novo Contrato
              </Button>
            </div>
          </div>
          {/* Filtros */}
          <ContractsFilters
            onFiltersChange={handleFiltersChange}
            currentFilters={currentFilters}
            onClearFilters={() => handleFiltersChange({})}
          />
          {/* Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              <div className="flex items-center gap-2">
                <span className="font-medium">Erro:</span>
                <span>{error}</span>
              </div>
              <button 
                onClick={handleRefresh}
                className="text-sm underline mt-1 hover:no-underline"
              >
                Tentar novamente
              </button>
            </div>
          )}
          {/* Lista de Contratos */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="text-gray-600">Carregando contratos...</span>
              </div>
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <FileText className="h-12 w-12" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum contrato encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                {currentFilters.search || currentFilters.status || currentFilters.supplier
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece criando um novo contrato.'
                }
              </p>
              {!currentFilters.search && !currentFilters.status && !currentFilters.supplier && (
                <div className="mt-6">
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Contrato
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Grid de Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {contracts.map((contract) => (
                  <ContractCard
                    key={contract.id}
                    contract={contract}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
              {/* Paginação */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-600">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              )}
              {/* Informações de paginação */}
              <div className="text-center text-sm text-gray-500 mt-4">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                {pagination.total} contratos
              </div>
            </>
          )}
          {/* Modal de Formulário */}
          <Dialog open={showForm} onOpenChange={(open) => {
            setShowForm(open)
            if (!open) setEditingContract(null)
          }}>
            <ContractForm
              initialData={editingContract || undefined}
              mode={editingContract ? 'edit' : 'create'}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setShowForm(false)
                setEditingContract(null)
              }}
            />
          </Dialog>
        </div>
      </main>
    </div>
  )
}