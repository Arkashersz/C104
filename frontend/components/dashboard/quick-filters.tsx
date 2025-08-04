'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Filter, X, Clock, AlertTriangle, CheckCircle, Users, FileText } from 'lucide-react'
import { SEIProcess } from '@/types/shared'

interface QuickFiltersProps {
  processes: SEIProcess[]
  onFilterChange: (filteredProcesses: SEIProcess[]) => void
}

interface FilterOption {
  id: string
  label: string
  icon: React.ReactNode
  color: string
  count: number
  filter: (processes: SEIProcess[]) => SEIProcess[]
}

export function QuickFilters({ processes, onFilterChange }: QuickFiltersProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  // Função para obter data atual (SEM conversão de fuso)
  const getToday = () => {
    return new Date()
  }

  // Função para obter data sem conversão de timezone
  const getProcessDate = (dateString: string) => {
    if (!dateString) return new Date()
    
    // Se a data já está no formato YYYY-MM-DD, criar data local
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-')
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    }
    
    // Se tem T (ISO string), extrair apenas a parte da data
    if (dateString.includes('T')) {
      const datePart = dateString.split('T')[0]
      const [year, month, day] = datePart.split('-')
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    }
    
    // Fallback para outras formatações
    return new Date(dateString)
  }

  const filterOptions: FilterOption[] = useMemo(() => [
    {
      id: 'em_andamento',
      label: 'Em Andamento',
      icon: <Clock className="h-4 w-4" />,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      count: processes.filter(p => p.status === 'em_andamento').length,
      filter: (processes) => processes.filter(p => p.status === 'em_andamento')
    },
    {
      id: 'finalizado',
      label: 'Finalizado',
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'bg-green-100 text-green-800 border-green-200',
      count: processes.filter(p => p.status === 'finalizado').length,
      filter: (processes) => processes.filter(p => p.status === 'finalizado')
    },
    {
      id: 'cancelado',
      label: 'Cancelado',
      icon: <X className="h-4 w-4" />,
      color: 'bg-red-100 text-red-800 border-red-200',
      count: processes.filter(p => p.status === 'cancelado').length,
      filter: (processes) => processes.filter(p => p.status === 'cancelado')
    },
    {
      id: 'contrato',
      label: 'Contratos',
      icon: <FileText className="h-4 w-4" />,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      count: processes.filter(p => p.type === 'contrato').length,
      filter: (processes) => processes.filter(p => p.type === 'contrato')
    },
    {
      id: 'licitacao',
      label: 'Licitações',
      icon: <FileText className="h-4 w-4" />,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      count: processes.filter(p => p.type === 'licitacao').length,
      filter: (processes) => processes.filter(p => p.type === 'licitacao')
    },
    {
      id: 'dispensa',
      label: 'Dispensas',
      icon: <FileText className="h-4 w-4" />,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      count: processes.filter(p => p.type === 'dispensa').length,
      filter: (processes) => processes.filter(p => p.type === 'dispensa')
    },
    {
      id: 'sem_grupo',
      label: 'Sem Responsável',
      icon: <Users className="h-4 w-4" />,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      count: processes.filter(p => !p.group_id).length,
      filter: (processes) => processes.filter(p => !p.group_id)
    },
    {
      id: 'vencendo_semana',
      label: 'Vencendo Esta Semana',
      icon: <Clock className="h-4 w-4" />,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      count: processes.filter(p => {
        if (!p.end_date || p.status === 'finalizado') return false
        const today = getToday()
        today.setHours(0, 0, 0, 0)
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        const endDate = getProcessDate(p.end_date)
        endDate.setHours(0, 0, 0, 0)
        return endDate >= today && endDate <= weekFromNow
      }).length,
      filter: (processes) => processes.filter(p => {
        if (!p.end_date || p.status === 'finalizado') return false
        const today = getToday()
        today.setHours(0, 0, 0, 0)
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        const endDate = getProcessDate(p.end_date)
        endDate.setHours(0, 0, 0, 0)
        return endDate >= today && endDate <= weekFromNow
      })
    }
  ], [processes])

  // Aplicar filtros quando activeFilters mudar
  useEffect(() => {
    applyFilters(activeFilters)
  }, [activeFilters, processes])

  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev => {
      return prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    })
  }

  const applyFilters = (filters: string[]) => {
    if (filters.length === 0) {
      onFilterChange(processes)
      return
    }

    const activeFilterOptions = filterOptions.filter(option => filters.includes(option.id))
    
    // Aplicar todos os filtros ativos (OR logic para diferentes categorias, AND logic para mesma categoria)
    let filteredProcesses = processes
    
    // Separar filtros por categoria
    const statusFilters = activeFilterOptions.filter(option => 
      ['em_andamento', 'finalizado', 'cancelado'].includes(option.id)
    )
    const typeFilters = activeFilterOptions.filter(option => 
      ['contrato', 'licitacao', 'dispensa'].includes(option.id)
    )
    const otherFilters = activeFilterOptions.filter(option => 
      !['em_andamento', 'finalizado', 'cancelado', 'contrato', 'licitacao', 'dispensa'].includes(option.id)
    )

    // Aplicar filtros de status (OR logic)
    if (statusFilters.length > 0) {
      const statusResults = statusFilters.flatMap(option => option.filter(processes))
      filteredProcesses = filteredProcesses.filter(process => 
        statusResults.some(result => result.id === process.id)
      )
    }

    // Aplicar filtros de tipo (OR logic)
    if (typeFilters.length > 0) {
      const typeResults = typeFilters.flatMap(option => option.filter(processes))
      filteredProcesses = filteredProcesses.filter(process => 
        typeResults.some(result => result.id === process.id)
      )
    }

    // Aplicar outros filtros (AND logic)
    otherFilters.forEach(option => {
      filteredProcesses = option.filter(filteredProcesses)
    })

    onFilterChange(filteredProcesses)
  }

  const clearAllFilters = () => {
    setActiveFilters([])
  }

  const getFilteredCount = () => {
    if (activeFilters.length === 0) return processes.length
    
    const activeFilterOptions = filterOptions.filter(option => activeFilters.includes(option.id))
    
    // Separar filtros por categoria
    const statusFilters = activeFilterOptions.filter(option => 
      ['em_andamento', 'finalizado', 'cancelado'].includes(option.id)
    )
    const typeFilters = activeFilterOptions.filter(option => 
      ['contrato', 'licitacao', 'dispensa'].includes(option.id)
    )
    const otherFilters = activeFilterOptions.filter(option => 
      !['em_andamento', 'finalizado', 'cancelado', 'contrato', 'licitacao', 'dispensa'].includes(option.id)
    )

    let filteredProcesses = processes
    
    // Aplicar filtros de status (OR logic)
    if (statusFilters.length > 0) {
      const statusResults = statusFilters.flatMap(option => option.filter(processes))
      filteredProcesses = filteredProcesses.filter(process => 
        statusResults.some(result => result.id === process.id)
      )
    }

    // Aplicar filtros de tipo (OR logic)
    if (typeFilters.length > 0) {
      const typeResults = typeFilters.flatMap(option => option.filter(processes))
      filteredProcesses = filteredProcesses.filter(process => 
        typeResults.some(result => result.id === process.id)
      )
    }

    // Aplicar outros filtros (AND logic)
    otherFilters.forEach(option => {
      filteredProcesses = option.filter(filteredProcesses)
    })
    
    return filteredProcesses.length
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtros Ativos</span>
        </div>
        <div className="flex items-center gap-2">
          {activeFilters.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs h-7 px-2"
            >
              Limpar
            </Button>
          )}
          <Badge variant="secondary" className="text-xs">
            {getFilteredCount()}/{processes.length}
          </Badge>
        </div>
      </div>
      
      <div className="space-y-2">
        {/* Filtros de Status */}
        <div>
          <h5 className="text-xs font-medium text-gray-600 mb-2">Status</h5>
          <div className="flex flex-wrap gap-1">
            {filterOptions.filter(option => ['em_andamento', 'finalizado', 'cancelado'].includes(option.id)).map((option) => {
              const isActive = activeFilters.includes(option.id)
              return (
                <Button
                  key={option.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter(option.id)}
                  className={`h-7 px-2 text-xs ${
                    isActive ? option.color : 'hover:bg-gray-50'
                  }`}
                >
                  {option.icon}
                  <span className="ml-1">{option.label}</span>
                  <Badge 
                    variant={isActive ? "secondary" : "outline"}
                    className="ml-1 text-xs"
                  >
                    {option.count}
                  </Badge>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Filtros de Tipo */}
        <div>
          <h5 className="text-xs font-medium text-gray-600 mb-2">Tipo</h5>
          <div className="flex flex-wrap gap-1">
            {filterOptions.filter(option => ['contrato', 'licitacao', 'dispensa'].includes(option.id)).map((option) => {
              const isActive = activeFilters.includes(option.id)
              return (
                <Button
                  key={option.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter(option.id)}
                  className={`h-7 px-2 text-xs ${
                    isActive ? option.color : 'hover:bg-gray-50'
                  }`}
                >
                  {option.icon}
                  <span className="ml-1">{option.label}</span>
                  <Badge 
                    variant={isActive ? "secondary" : "outline"}
                    className="ml-1 text-xs"
                  >
                    {option.count}
                  </Badge>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Outros Filtros */}
        <div>
          <h5 className="text-xs font-medium text-gray-600 mb-2">Outros</h5>
          <div className="flex flex-wrap gap-1">
            {filterOptions.filter(option => !['em_andamento', 'finalizado', 'cancelado', 'contrato', 'licitacao', 'dispensa'].includes(option.id)).map((option) => {
              const isActive = activeFilters.includes(option.id)
              return (
                <Button
                  key={option.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter(option.id)}
                  className={`h-7 px-2 text-xs ${
                    isActive ? option.color : 'hover:bg-gray-50'
                  }`}
                >
                  {option.icon}
                  <span className="ml-1">{option.label}</span>
                  <Badge 
                    variant={isActive ? "secondary" : "outline"}
                    className="ml-1 text-xs"
                  >
                    {option.count}
                  </Badge>
                </Button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
} 