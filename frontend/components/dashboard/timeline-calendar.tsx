'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, ChevronLeft, ChevronRight, Clock, AlertTriangle } from 'lucide-react'
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, isTomorrow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { SEIProcess } from '@/types/shared'

interface TimelineCalendarProps {
  processes: SEIProcess[]
  onProcessClick?: (process: SEIProcess) => void
}

interface TimelineItem {
  date: Date
  processes: SEIProcess[]
  count: number
  criticalCount: number
  warningCount: number
}

export function TimelineCalendar({ processes, onProcessClick }: TimelineCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date()
    return now
  })
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')

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

  // Calcular datas da semana/mês atual
  const timelineData = useMemo(() => {
    const start = viewMode === 'week' 
      ? startOfWeek(currentDate, { locale: ptBR })
      : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    
    const end = viewMode === 'week'
      ? endOfWeek(currentDate, { locale: ptBR })
      : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    const days = eachDayOfInterval({ start, end })
    
    return days.map(date => {
      // Resetar horas para comparação correta de datas
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      
      const dayProcesses = processes.filter(process => {
        if (!process.end_date) return false
        
        // Usar a data exatamente como está no banco
        const processEndDate = getProcessDate(process.end_date)
        processEndDate.setHours(0, 0, 0, 0)
        
        return processEndDate.getTime() === dayStart.getTime()
      })

      const today = getToday()
      today.setHours(0, 0, 0, 0)

      const criticalCount = dayProcesses.filter(process => {
        const processEndDate = getProcessDate(process.end_date!)
        processEndDate.setHours(0, 0, 0, 0)
        return processEndDate < today // Processos vencidos
      }).length

      const warningCount = dayProcesses.filter(process => {
        const processEndDate = getProcessDate(process.end_date!)
        processEndDate.setHours(0, 0, 0, 0)
        return processEndDate.getTime() === today.getTime() // Processos vencendo hoje
      }).length

      return {
        date,
        processes: dayProcesses,
        count: dayProcesses.length,
        criticalCount,
        warningCount
      }
    })
  }, [processes, currentDate, viewMode])

  const navigateDate = (direction: 'prev' | 'next') => {
    if (viewMode === 'week') {
      setCurrentDate(prev => addDays(prev, direction === 'next' ? 7 : -7))
    } else {
      setCurrentDate(prev => {
        const newDate = new Date(prev)
        newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
        return newDate
      })
    }
  }

  const getDateColor = (item: TimelineItem) => {
    if (item.criticalCount > 0) return 'text-red-600 bg-red-50 border-red-200'
    if (item.warningCount > 0) return 'text-orange-600 bg-orange-50 border-orange-200'
    if (isToday(item.date)) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (isTomorrow(item.date)) return 'text-purple-600 bg-purple-50 border-purple-200'
    return 'text-gray-600 bg-gray-50 border-gray-200'
  }

  const getPriorityIcon = (item: TimelineItem) => {
    if (item.criticalCount > 0) return <AlertTriangle className="h-4 w-4 text-red-600" />
    if (item.warningCount > 0) return <Clock className="h-4 w-4 text-orange-600" />
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Timeline de Vencimentos
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'week' ? 'month' : 'week')}
            >
              {viewMode === 'week' ? 'Semana' : 'Mês'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          {format(timelineData[0]?.date || new Date(), 'MMMM yyyy', { locale: ptBR })}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {/* Cabeçalho dos dias da semana */}
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
          
          {/* Dias do calendário */}
          {timelineData.map((item, index) => (
            <div
              key={index}
              className={`min-h-[80px] p-2 border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${getDateColor(item)}`}
              onClick={() => item.processes.length > 0 && onProcessClick?.(item.processes[0])}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">
                  {format(item.date, 'd')}
                </span>
                {getPriorityIcon(item)}
              </div>
              
              {item.count > 0 && (
                <div className="space-y-1">
                  <Badge 
                    variant={item.criticalCount > 0 ? "destructive" : item.warningCount > 0 ? "secondary" : "default"}
                    className="text-xs"
                  >
                    {item.count} processo{item.count > 1 ? 's' : ''}
                  </Badge>
                  
                  {item.processes.slice(0, 2).map((process, idx) => (
                    <div key={idx} className="text-xs truncate">
                      {process.process_number}
                    </div>
                  ))}
                  
                  {item.processes.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{item.processes.length - 2} mais
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Legenda */}
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
            <span>Vencido</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></div>
            <span>Vencendo hoje</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
            <span>Hoje</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div>
            <span>Amanhã</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 