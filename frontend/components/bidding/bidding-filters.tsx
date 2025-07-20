// components/bidding/bidding-filters.tsx
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Search, Filter, X } from 'lucide-react'
import { useBidding } from '@/lib/hooks/use-bidding'

interface BiddingFiltersProps {
  onFiltersChange: (filters: {
    status?: string
    search?: string
    orderBy?: 'created_at' | 'title' | 'process_number' | 'estimated_value' | 'opening_date'
    orderDirection?: 'asc' | 'desc'
  }) => void
  currentFilters: {
    status?: string
    search?: string
    orderBy?: string
    orderDirection?: 'asc' | 'desc'
  }
}

export function BiddingFilters({ onFiltersChange, currentFilters }: BiddingFiltersProps) {
  const [search, setSearch] = useState(currentFilters.search || '')
  const [status, setStatus] = useState(currentFilters.status || '')
  const [orderBy, setOrderBy] = useState(currentFilters.orderBy || 'created_at')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>(currentFilters.orderDirection || 'desc')
  const [statuses, setStatuses] = useState<Array<{ id: string; name: string; color: string }>>([])
  const [loadingStatuses, setLoadingStatuses] = useState(false)
  const { fetchStatuses } = useBidding()

  // Carregar status apenas uma vez
  useEffect(() => {
    const loadStatuses = async () => {
      if (statuses.length === 0 && !loadingStatuses) {
        setLoadingStatuses(true)
        try {
          const statusData = await fetchStatuses()
          setStatuses(statusData)
        } catch (error) {
          console.error('Erro ao carregar status:', error)
        } finally {
          setLoadingStatuses(false)
        }
      }
    }
    loadStatuses()
  }, [fetchStatuses, statuses.length, loadingStatuses])

  const handleSearch = useCallback(() => {
    onFiltersChange({
      search: search.trim() || undefined,
      status: status || undefined,
      orderBy: orderBy as any,
      orderDirection
    })
  }, [onFiltersChange, search, status, orderBy, orderDirection])

  const handleClearFilters = useCallback(() => {
    setSearch('')
    setStatus('')
    setOrderBy('created_at')
    setOrderDirection('desc')
    onFiltersChange({})
  }, [onFiltersChange])

  const hasActiveFilters = search || status || orderBy !== 'created_at' || orderDirection !== 'desc'

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
      <div className="flex items-center gap-4 mb-4">
        <Filter className="h-5 w-5 text-gray-500" />
        <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por título ou número..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>

        {/* Status */}
        <Select
          value={status}
          onValueChange={setStatus}
          disabled={loadingStatuses}
        >
          <option value="">Todos os status</option>
          {statuses.map((statusOption) => (
            <option key={statusOption.id} value={statusOption.id}>
              {statusOption.name}
            </option>
          ))}
        </Select>

        {/* Ordenação */}
        <Select
          value={orderBy}
          onValueChange={setOrderBy}
        >
          <option value="created_at">Data de Criação</option>
          <option value="title">Título</option>
          <option value="process_number">Número do Processo</option>
          <option value="estimated_value">Valor Estimado</option>
          <option value="opening_date">Data de Abertura</option>
        </Select>

        {/* Direção da ordenação */}
        <Select
          value={orderDirection}
          onValueChange={(value: string) => setOrderDirection(value as 'asc' | 'desc')}
        >
          <option value="desc">Decrescente</option>
          <option value="asc">Crescente</option>
        </Select>
      </div>

      <div className="flex items-center justify-between mt-4">
        <Button onClick={handleSearch} className="px-6">
          <Search className="h-4 w-4 mr-2" />
          Buscar
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-gray-600 hover:text-gray-800"
          >
            <X className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        )}
      </div>
    </div>
  )
} 