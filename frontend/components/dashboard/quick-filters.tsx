'use client'

import { useState, useMemo } from 'react'
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
      id: 'vencendo_hoje',
      label: 'Vencendo Hoje',
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      count: processes.filter(p => {
        if (!p.end_date || p.status === 'finalizado') return false
        const today = getToday()
        today.setHours(0, 0, 0, 0)
        const endDate = getProcessDate(p.end_date)
        endDate.setHours(0, 0, 0, 0)
        return endDate.getTime() === today.getTime()
      }).length,
      filter: (processes) => processes.filter(p => {
        if (!p.end_date || p.status === 'finalizado') return false
        const today = getToday()
        today.setHours(0, 0, 0, 0)
        const endDate = getProcessDate(p.end_date)
        endDate.setHours(0, 0, 0, 0)
        return endDate.getTime() === today.getTime()
      })
    },
    {
      id: 'vencido',
      label: 'Vencido',
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'bg-red-100 text-red-800 border-red-200',
      count: processes.filter(p => {
        if (!p.end_date || p.status === 'finalizado') return false
        const today = getToday()
        today.setHours(0, 0, 0, 0)
        const endDate = getProcessDate(p.end_date)
        endDate.setHours(0, 0, 0, 0)
        return endDate < today
      }).length,
      filter: (processes) => processes.filter(p => {
        if (!p.end_date || p.status === 'finalizado') return false
        const today = getToday()
        today.setHours(0, 0, 0, 0)
        const endDate = getProcessDate(p.end_date)
        endDate.setHours(0, 0, 0, 0)
        return endDate < today
      })
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

  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev => {
      const newFilters = prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
      
      // Aplicar filtros
      applyFilters(newFilters)
      return newFilters
    })
  }

  const applyFilters = (filters: string[]) => {
    if (filters.length === 0) {
      onFilterChange(processes)
      return
    }

    const activeFilterOptions = filterOptions.filter(option => filters.includes(option.id))
    
    // Aplicar todos os filtros ativos (AND logic)
    let filteredProcesses = processes
    activeFilterOptions.forEach(option => {
      filteredProcesses = option.filter(filteredProcesses)
    })

    onFilterChange(filteredProcesses)
  }

  const clearAllFilters = () => {
    setActiveFilters([])
    onFilterChange(processes)
  }

  const getFilteredCount = () => {
    if (activeFilters.length === 0) return processes.length
    
    const activeFilterOptions = filterOptions.filter(option => activeFilters.includes(option.id))
    let filteredProcesses = processes
    activeFilterOptions.forEach(option => {
      filteredProcesses = option.filter(filteredProcesses)
    })
    
    return filteredProcesses.length
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-indigo-500" />
            Filtros Rápidos
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFilters.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs"
              >
                Limpar Filtros
              </Button>
            )}
            <Badge variant="secondary">
              {getFilteredCount()} de {processes.length}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filterOptions.map((option) => {
            const isActive = activeFilters.includes(option.id)
            return (
              <Button
                key={option.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFilter(option.id)}
                className={`h-auto p-3 flex flex-col items-center gap-2 ${
                  isActive ? option.color : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {option.icon}
                  <span className="text-xs font-medium">{option.label}</span>
                </div>
                <Badge 
                  variant={isActive ? "secondary" : "outline"}
                  className="text-xs"
                >
                  {option.count}
                </Badge>
              </Button>
            )
          })}
        </div>

        {activeFilters.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Filtros ativos:</span>
              {activeFilters.map(filterId => {
                const option = filterOptions.find(opt => opt.id === filterId)
                return (
                  <Badge
                    key={filterId}
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-red-100"
                    onClick={() => toggleFilter(filterId)}
                  >
                    {option?.label}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 