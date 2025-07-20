'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Button } from '@/components/ui/button'
import { BiddingCard } from '@/components/bidding/bidding-card'
import { BiddingFilters } from '@/components/bidding/bidding-filters'
import { BiddingForm } from '@/components/bidding/bidding-form'
import { useBidding } from '@/lib/hooks/use-bidding'
import { BiddingProcessWithRelations } from '@/types/bidding'
import { Plus, Search, Filter, RefreshCw, ArrowLeft } from 'lucide-react'

export default function BiddingPage() {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingBidding, setEditingBidding] = useState<BiddingProcessWithRelations | null>(null)
  const [currentFilters, setCurrentFilters] = useState({
    search: '',
    status: '',
    orderBy: 'created_at' as 'created_at' | 'title' | 'process_number' | 'estimated_value' | 'opening_date',
    orderDirection: 'desc' as 'asc' | 'desc'
  })

  const {
    biddingProcesses,
    loading,
    error,
    pagination,
    fetchBiddingProcesses,
    deleteBiddingProcess
  } = useBidding()

  // Carregar dados iniciais apenas uma vez
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchBiddingProcesses({
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

  const handleFiltersChange = useCallback((filters: {
    status?: string
    search?: string
    orderBy?: 'created_at' | 'title' | 'process_number' | 'estimated_value' | 'opening_date'
    orderDirection?: 'asc' | 'desc'
  }) => {
    setCurrentFilters({
      search: filters.search || '',
      status: filters.status || '',
      orderBy: filters.orderBy || 'created_at',
      orderDirection: filters.orderDirection || 'desc'
    })
    
    fetchBiddingProcesses({
      page: 1,
      limit: 10,
      ...filters
    })
  }, [fetchBiddingProcesses])

  const handlePageChange = useCallback((page: number) => {
    fetchBiddingProcesses({
      page,
      limit: 10,
      ...currentFilters
    })
  }, [fetchBiddingProcesses, currentFilters])

  const handleEdit = useCallback((bidding: BiddingProcessWithRelations) => {
    setEditingBidding(bidding)
    setShowForm(true)
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    const success = await deleteBiddingProcess(id)
    if (success) {
      // Recarregar dados
      fetchBiddingProcesses({
        page: pagination.page,
        limit: 10,
        ...currentFilters
      })
    }
  }, [deleteBiddingProcess, fetchBiddingProcesses, pagination.page, currentFilters])

  const handleFormSuccess = useCallback(() => {
    setEditingBidding(null)
    setShowForm(false)
    // Recarregar dados
    fetchBiddingProcesses({
      page: pagination.page,
      limit: 10,
      ...currentFilters
    })
  }, [fetchBiddingProcesses, pagination.page, currentFilters])

  const handleRefresh = useCallback(() => {
    fetchBiddingProcesses({
      page: pagination.page,
      limit: 10,
      ...currentFilters
    })
  }, [fetchBiddingProcesses, pagination.page, currentFilters])

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
              <h1 className="text-3xl font-bold text-gray-900">Processos de Licitação</h1>
              <p className="text-gray-600 mt-2">
                Gerencie todos os processos licitatórios da instituição
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
                Novo Processo
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <BiddingFilters
            onFiltersChange={handleFiltersChange}
            currentFilters={currentFilters}
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

          {/* Lista de Processos */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="text-gray-600">Carregando processos...</span>
              </div>
            </div>
          ) : biddingProcesses.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <Search className="h-12 w-12" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum processo encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                {currentFilters.search || currentFilters.status 
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece criando um novo processo de licitação.'
                }
              </p>
              {!currentFilters.search && !currentFilters.status && (
                <div className="mt-6">
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Processo
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Grid de Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {biddingProcesses.map((bidding) => (
                  <BiddingCard
                    key={bidding.id}
                    bidding={bidding}
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
                {pagination.total} processos
              </div>
            </>
          )}

          {/* Modal de Formulário */}
          <BiddingForm
            bidding={editingBidding}
            isOpen={showForm}
            onClose={() => {
              setShowForm(false)
              setEditingBidding(null)
            }}
            onSuccess={handleFormSuccess}
          />
        </div>
      </main>
    </div>
  )
}