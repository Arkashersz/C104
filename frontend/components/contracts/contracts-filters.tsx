// components/contracts/contracts-filters.tsx
import { useState } from 'react'
import { ContractStatus } from '@/types/contracts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Filter, X, ArrowUpDown } from 'lucide-react'

interface ContractFiltersProps {
  onFiltersChange: (filters: {
    status?: ContractStatus
    supplier?: string
    search?: string
    orderBy?: string
    orderDirection?: 'asc' | 'desc'
  }) => void
  onClearFilters: () => void
}

export function ContractsFilters({ onFiltersChange, onClearFilters }: ContractFiltersProps) {
  const [filters, setFilters] = useState({
    status: '',
    supplier: '',
    search: '',
    orderBy: 'created_at',
    orderDirection: 'desc' as 'asc' | 'desc'
  })

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    // Remover valores vazios (exceto ordenação)
    const cleanFilters = Object.fromEntries(
      Object.entries(newFilters).filter(([k, v]) => {
        if (k === 'orderBy' || k === 'orderDirection') return true
        return v !== ''
      })
    )
    
    onFiltersChange(cleanFilters)
  }

  const handleClearFilters = () => {
    setFilters({ 
      status: '', 
      supplier: '', 
      search: '', 
      orderBy: 'created_at', 
      orderDirection: 'desc' 
    })
    onClearFilters()
  }

  const hasActiveFilters = Object.values(filters).some((value, index) => {
    const key = Object.keys(filters)[index]
    if (key === 'orderBy' || key === 'orderDirection') return false
    return value !== ''
  })

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Filtros principais */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por título ou processo SEI..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="w-48">
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <option value="">Todos os status</option>
                <option value="active">Ativo</option>
                <option value="expired">Expirado</option>
                <option value="cancelled">Cancelado</option>
                <option value="renewed">Renovado</option>
              </Select>
            </div>

            <div className="w-48">
              <Input
                placeholder="Filtrar por fornecedor..."
                value={filters.supplier}
                onChange={(e) => handleFilterChange('supplier', e.target.value)}
              />
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>

          {/* Ordenação */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Ordenar por:</span>
            </div>
            
            <div className="w-48">
              <Select
                value={filters.orderBy}
                onValueChange={(value) => handleFilterChange('orderBy', value)}
              >
                <option value="created_at">Data de criação</option>
                <option value="title">Título</option>
                <option value="contract_number">Processo SEI</option>
                <option value="supplier">Fornecedor</option>
                <option value="value">Valor</option>
                <option value="start_date">Data de início</option>
                <option value="end_date">Data de término</option>
              </Select>
            </div>

            <div className="w-32">
              <Select
                value={filters.orderDirection}
                onValueChange={(value) => handleFilterChange('orderDirection', value as 'asc' | 'desc')}
              >
                <option value="desc">Decrescente</option>
                <option value="asc">Crescente</option>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 