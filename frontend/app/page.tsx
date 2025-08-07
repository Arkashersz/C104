'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SEIProcess } from '@/types/shared'
import { useSEIProcesses } from '@/lib/hooks/use-sei-processes'
import { Sidebar } from '@/components/layout/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign,
  TrendingUp,
  Activity,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  ShoppingCart,
  Award,
  Plus,
  Filter,
  Users,
  X
} from 'lucide-react'
import { TimelineCalendar } from '@/components/dashboard/timeline-calendar'
import { QuickFilters } from '@/components/dashboard/quick-filters'
import { InteractiveCharts } from '@/components/dashboard/interactive-charts'
import { RealTimeNotifications } from '@/components/dashboard/real-time-notifications'

interface DashboardStats {
  totalProcesses: number
  activeProcesses: number
  finishedProcesses: number
  processesExpiringToday: number
  processesExpired: number
  processesExpiringThisWeek: number
  processesWithoutGroup: number
  totalValue: number
  processesByType: Record<string, number>
  processesByStatus: Record<string, number>
}

interface Alert {
  id: string
  type: 'warning' | 'error' | 'info'
  title: string
  description: string
  count?: number
  action?: string
}

export default function Dashboard() {
  const supabase = createClient()
  const { processes, loading: processesLoading, fetchProcesses } = useSEIProcesses()
  const [filteredProcesses, setFilteredProcesses] = useState<SEIProcess[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalProcesses: 0,
    activeProcesses: 0,
    finishedProcesses: 0,
    processesExpiringToday: 0,
    processesExpired: 0,
    processesExpiringThisWeek: 0,
    processesWithoutGroup: 0,
    totalValue: 0,
    processesByType: {},
    processesByStatus: {}
  })
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const logsPerPage = 5
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Função para obter data de hoje
  const getToday = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
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

  // Calcular stats dinâmicos baseados nos processos atualmente visíveis
  const dynamicStats = useMemo(() => {
    const processesToUse = filteredProcesses.length > 0 ? filteredProcesses : processes
    return calculateStats(processesToUse)
  }, [filteredProcesses, processes])

  // Calcular alertas dinâmicos baseados nos processos atualmente visíveis
  const dynamicAlerts = useMemo(() => {
    const processesToUse = filteredProcesses.length > 0 ? filteredProcesses : processes
    return generateAlerts(processesToUse, dynamicStats)
  }, [filteredProcesses, processes, dynamicStats])

  // Carregar dados do dashboard
  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Atualizar processos filtrados quando processos mudam
  useEffect(() => {
    setFilteredProcesses(processes)
  }, [processes])

  // Recalcular estatísticas quando processos mudam
  useEffect(() => {
    if (processes.length > 0) {
      const newStats = calculateStats(processes)
      setStats(newStats)
      
      const newAlerts = generateAlerts(processes, newStats)
      setAlerts(newAlerts)
      
      // Removed as per edit hint
    }
  }, [processes])

  // Recarregar alertas quando notificações mudarem (localStorage)
  useEffect(() => {
    if (processes.length > 0) {
      const newAlerts = generateAlerts(processes, stats)
      setAlerts(newAlerts)
    }
  }, [processes, stats]) // Depende de processes e stats para garantir que temos os dados necessários

  // Listener para mudanças no localStorage (notificações)
  useEffect(() => {
    // Verificar se estamos no cliente
    if (typeof window === 'undefined') return

    const handleStorageChange = () => {
      if (processes.length > 0) {
        const newAlerts = generateAlerts(processes, stats)
        setAlerts(newAlerts)
      }
    }

    // Listener para mudanças no localStorage
    window.addEventListener('storage', handleStorageChange)
    
    // Listener customizado para mudanças no localStorage (mesma aba)
    const originalSetItem = localStorage.setItem
    localStorage.setItem = function(key, value) {
      originalSetItem.apply(this, [key, value])
      if (key === 'notifications') {
        handleStorageChange()
      }
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      localStorage.setItem = originalSetItem
    }
  }, [processes, stats])

  // Resetar página quando logs mudarem
  useEffect(() => {
    setCurrentPage(1)
  }, [recentActivities.length])

  async function fetchDashboardData() {
    try {
      setIsLoading(true)
      
      // Buscar todos os processos usando o hook
      await fetchProcesses()

      // Buscar atividades recentes
      await fetchRecentActivities()

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function calculateStats(processes: SEIProcess[]): DashboardStats {
    const today = getToday()
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    const stats: DashboardStats = {
      totalProcesses: processes.length,
      activeProcesses: processes.filter(p => p.status === 'em_andamento').length,
      finishedProcesses: processes.filter(p => p.status === 'finalizado').length,
      processesExpiringToday: 0,
      processesExpired: 0,
      processesExpiringThisWeek: 0,
      processesWithoutGroup: processes.filter(p => !p.group_id).length,
      totalValue: 0,
      processesByType: {},
      processesByStatus: {}
    }

    // Calcular processos vencendo e vencidos
    processes.forEach(process => {
      if (process.end_date && process.status !== 'finalizado') {
        const endDate = getProcessDate(process.end_date)
        
        if (endDate.getTime() === today.getTime()) {
          stats.processesExpiringToday++
        }
        
        if (endDate < today) {
          stats.processesExpired++
        }
        
        if (endDate <= weekFromNow && endDate >= today) {
          stats.processesExpiringThisWeek++
        }
      }

      // Calcular valor total (se houver campo de valor)
      if (process.estimated_value) {
        stats.totalValue += process.estimated_value
      }

      // Contar por tipo
      stats.processesByType[process.type] = (stats.processesByType[process.type] || 0) + 1

      // Contar por status
      stats.processesByStatus[process.status] = (stats.processesByStatus[process.status] || 0) + 1
    })

    return stats
  }

  function generateAlerts(processes: SEIProcess[], stats: DashboardStats): Alert[] {
    const alerts: Alert[] = []

    // Verificar se localStorage está disponível (cliente apenas)
    let savedNotifications: any[] = []
    if (typeof window !== 'undefined') {
      try {
        savedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]')
      } catch (error) {
        console.warn('Erro ao carregar notificações do localStorage:', error)
        savedNotifications = []
      }
    }
    
    const todayKey = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    
    // Criar sets de IDs de processos que têm notificações marcadas como lidas ou deletadas
    const dismissedProcessIds = new Set<string>()
    
    savedNotifications.forEach((notification: any) => {
      if (notification.processId && (notification.read || notification.deleted)) {
        dismissedProcessIds.add(notification.processId)
      }
    })

    // Processos vencidos (excluindo os que foram marcados como lidos/deletados)
    const expiredProcesses = processes.filter(p => {
      if (!p.end_date || p.status === 'finalizado') return false
      const endDate = getProcessDate(p.end_date)
      const today = getToday()
      endDate.setHours(0, 0, 0, 0)
      today.setHours(0, 0, 0, 0)
      return endDate < today && !dismissedProcessIds.has(p.id)
    })

    if (expiredProcesses.length > 0) {
      alerts.push({
        id: 'expired',
        type: 'error',
        title: 'Processos Vencidos',
        description: `${expiredProcesses.length} processo(s) já venceu(ram)`,
        count: expiredProcesses.length,
        action: 'Ver Processos Vencidos'
      })
    }

    // Processos vencendo hoje (excluindo os que foram marcados como lidos/deletados)
    const expiringToday = processes.filter(p => {
      if (!p.end_date || p.status === 'finalizado') return false
      const endDate = getProcessDate(p.end_date)
      const today = getToday()
      endDate.setHours(0, 0, 0, 0)
      today.setHours(0, 0, 0, 0)
      return endDate.getTime() === today.getTime() && !dismissedProcessIds.has(p.id)
    })

    if (expiringToday.length > 0) {
      alerts.push({
        id: 'expiring-today',
        type: 'error',
        title: 'Processos Vencendo Hoje',
        description: `${expiringToday.length} processo(s) vence(m) hoje`,
        count: expiringToday.length,
        action: 'Ver Processos'
      })
    }

    // Processos vencendo esta semana (excluindo os que foram marcados como lidos/deletados)
    const expiringThisWeek = processes.filter(p => {
      if (!p.end_date || p.status === 'finalizado') return false
      const endDate = getProcessDate(p.end_date)
      const today = getToday()
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      endDate.setHours(0, 0, 0, 0)
      today.setHours(0, 0, 0, 0)
      weekFromNow.setHours(0, 0, 0, 0)
      return endDate >= today && endDate <= weekFromNow && !dismissedProcessIds.has(p.id)
    })

    if (expiringThisWeek.length > 0) {
      alerts.push({
        id: 'expiring-week',
        type: 'warning',
        title: 'Processos Vencendo Esta Semana',
        description: `${expiringThisWeek.length} processo(s) vence(m) nos próximos 7 dias`,
        count: expiringThisWeek.length,
        action: 'Ver Processos'
      })
    }

    // Processos sem grupo (excluindo os que foram marcados como lidos/deletados)
    const processesWithoutGroup = processes.filter(p => !p.group_id && !dismissedProcessIds.has(p.id))
    if (processesWithoutGroup.length > 0) {
      alerts.push({
        id: 'no-group',
        type: 'warning',
        title: 'Processos Sem Responsável',
        description: `${processesWithoutGroup.length} processo(s) sem grupo responsável`,
        count: processesWithoutGroup.length,
        action: 'Atribuir Grupos'
      })
    }

    // Processos sem data de vencimento (excluindo os que foram marcados como lidos/deletados)
    const processesWithoutEndDate = processes.filter(p => !p.end_date && !dismissedProcessIds.has(p.id))
    if (processesWithoutEndDate.length > 0) {
      alerts.push({
        id: 'no-end-date',
        type: 'info',
        title: 'Processos Sem Data de Vencimento',
        description: `${processesWithoutEndDate.length} processo(s) sem data de vencimento definida`,
        count: processesWithoutEndDate.length,
        action: 'Definir Datas'
      })
    }

    return alerts
  }

  async function fetchRecentActivities() {
    try {
      // Buscar logs recentes com detalhes do processo
      const { data: logs, error } = await supabase
        .from('sei_process_logs')
        .select(`
          *,
          sei_processes (
            id,
            process_number,
            title,
            type,
            status,
            estimated_value
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50) // Buscar mais logs para paginação

      if (error) {
        console.error('Erro ao buscar logs:', error)
        setRecentActivities([])
        return
      }

      if (logs && logs.length > 0) {
        // Buscar informações dos usuários
        const userIds = [...new Set(logs.map(log => log.user_id).filter(Boolean))]
        let userMap = {}
        
        if (userIds.length > 0) {
          try {
            // Buscar na tabela users (mesma que o backend usa)
            const { data: users, error } = await supabase
              .from('users')
              .select('id, name, email')
              .in('id', userIds)
            
            if (error) {
              console.log('Erro ao buscar usuários:', error)
            } else if (users && users.length > 0) {
              userMap = users.reduce((acc, user) => {
                acc[user.id] = { full_name: user.name || user.email, email: user.email }
                return acc
              }, {})
            }
            
            console.log('Usuários encontrados:', userMap)
          } catch (userError) {
            console.log('Erro ao buscar dados dos usuários:', userError)
          }
        }

        // Processar logs e adicionar informações do usuário
        const processedLogs = logs.map((log) => {
          let userInfo = { full_name: 'Usuário', email: 'usuario@empresa.com' }
          
          if (log.user_id && userMap[log.user_id]) {
            userInfo = userMap[log.user_id]
          } else if (log.user_id) {
            // Se tem user_id mas não encontrou na tabela, usar email como nome
            userInfo = { full_name: log.user_id, email: log.user_id }
          }
          
          console.log(`Log ${log.id}: user_id=${log.user_id}, user_name=${userInfo.full_name}`)
          
          return {
            ...log,
            user_name: userInfo.full_name,
            user_email: userInfo.email
          }
        })
        
        setRecentActivities(processedLogs)
      } else {
        setRecentActivities([])
      }
    } catch (error) {
      console.error('Erro ao buscar atividades recentes:', error)
      setRecentActivities([])
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'em_andamento': return 'bg-blue-100 text-blue-800'
      case 'finalizado': return 'bg-green-100 text-green-800'
      case 'cancelado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'em_andamento': return 'Em Andamento'
      case 'finalizado': return 'Finalizado'
      case 'cancelado': return 'Cancelado'
      default: return status
    }
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case 'contrato': return 'Contrato'
      case 'licitacao': return 'Licitação'
      case 'dispensa': return 'Dispensa'
      case 'outro': return 'Outro'
      default: return type
    }
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  function handleProcessClick(processId: string) {
    // Navegar para a página de processos com o ID como parâmetro
    router.push(`/processos?highlight=${processId}`)
  }

  function handleFilterChange(filteredProcesses: SEIProcess[]) {
    setFilteredProcesses(filteredProcesses)
    // Os stats, alertas e metas serão atualizados automaticamente via useMemo
  }

  function getActionIcon(action: string) {
    switch (action) {
      case 'create': return <Plus className="h-4 w-4 text-green-600" />
      case 'update': return <Activity className="h-4 w-4 text-blue-600" />
      case 'update_status': return <CheckCircle className="h-4 w-4 text-purple-600" />
      case 'assign_group': return <Users className="h-4 w-4 text-orange-600" />
      case 'update_deadline': return <Calendar className="h-4 w-4 text-red-600" />
      case 'add_document': return <FileText className="h-4 w-4 text-indigo-600" />
      case 'delete': return <X className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  function getActionLabel(action: string) {
    switch (action) {
      case 'create': return 'Processo criado'
      case 'update': return 'Processo atualizado'
      case 'update_status': return 'Status alterado'
      case 'assign_group': return 'Grupo atribuído'
      case 'update_deadline': return 'Prazo atualizado'
      case 'add_document': return 'Documento anexado'
      case 'delete': return 'Processo removido'
      default: return 'Ação realizada'
    }
  }

  function getActionColor(action: string) {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800'
      case 'update': return 'bg-blue-100 text-blue-800'
      case 'update_status': return 'bg-purple-100 text-purple-800'
      case 'assign_group': return 'bg-orange-100 text-orange-800'
      case 'update_deadline': return 'bg-red-100 text-red-800'
      case 'add_document': return 'bg-indigo-100 text-indigo-800'
      case 'delete': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  function formatTimeAgo(dateString: string) {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Agora mesmo'
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h atrás`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d atrás`
    
    return date.toLocaleDateString('pt-BR')
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Executivo</h1>
              <p className="text-gray-600 mt-2">Visão geral dos processos e métricas importantes</p>
            </div>
            <div className="flex items-center gap-3">
              <RealTimeNotifications 
                processes={processes} 
                onProcessClick={handleProcessClick}
              />
              <Button onClick={() => router.push('/processos')} variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Ver Todos os Processos
              </Button>
              <Button onClick={() => router.push('/processos')}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Processo
              </Button>
            </div>
          </div>

          {/* KPIs Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Processos</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dynamicStats.totalProcesses}</div>
                <p className="text-xs text-muted-foreground">
                  {dynamicStats.activeProcesses} ativos, {dynamicStats.finishedProcesses} finalizados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vencendo em 7 dias</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{dynamicStats.processesExpiringThisWeek}</div>
                <p className="text-xs text-muted-foreground">
                  {dynamicStats.processesExpiringToday} vence(m) hoje
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{dynamicStats.processesExpired}</div>
                <p className="text-xs text-muted-foreground">
                  Precisam de atenção
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(dynamicStats.totalValue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor estimado dos processos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Análise de Dados Integrada */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-500" />
                    Análise de Dados em Tempo Real
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {filteredProcesses.length > 0 ? `${filteredProcesses.length} processos filtrados` : `${processes.length} total de processos`}
                    </Badge>
                    {filteredProcesses.length > 0 && filteredProcesses.length !== processes.length && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilteredProcesses([])}
                        className="text-xs"
                      >
                        Limpar Filtros
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Filtros Rápidos Integrados */}
                  <div className="lg:col-span-1">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Filtros de Análise</h4>
                        <QuickFilters 
                          processes={processes} 
                          onFilterChange={handleFilterChange}
                        />
                      </div>
                      
                      {/* Métricas Rápidas */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-700">Métricas Rápidas</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{dynamicStats.activeProcesses}</div>
                            <div className="text-xs text-gray-600">Em Andamento</div>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{dynamicStats.finishedProcesses}</div>
                            <div className="text-xs text-gray-600">Finalizados</div>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-orange-600">{dynamicStats.processesExpiringThisWeek}</div>
                            <div className="text-xs text-gray-600">Vencendo em 7d</div>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">{dynamicStats.processesExpired}</div>
                            <div className="text-xs text-gray-600">Vencidos</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gráficos Interativos */}
                  <div className="lg:col-span-2">
                    <InteractiveCharts processes={filteredProcesses.length > 0 ? filteredProcesses : processes} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alertas Críticos */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Alertas Críticos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dynamicAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum alerta crítico</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dynamicAlerts.map((alert) => (
                      <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          alert.type === 'error' ? 'bg-red-500' :
                          alert.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                        }`}></div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{alert.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{alert.description}</p>
                          {alert.action && (
                            <Button variant="link" size="sm" className="p-0 h-auto text-xs mt-1">
                              {alert.action} →
                            </Button>
                          )}
                        </div>
                        {alert.count && (
                          <Badge variant="secondary" className="ml-2">
                            {alert.count}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Timeline de Vencimentos */}
          <div className="mb-8">
            <TimelineCalendar 
              processes={filteredProcesses.length > 0 ? filteredProcesses : processes} 
              onProcessClick={handleProcessClick}
            />
          </div>

          {/* Atividades Recentes */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-500" />
                    Atividades Recentes
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {recentActivities.length} atividades
                    </Badge>
                    <Button variant="outline" size="sm" className="text-xs">
                      Ver Todas
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {recentActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">Nenhuma atividade recente</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {recentActivities
                        .slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage)
                        .map((activity, index) => {
                          const processData = activity.sei_processes || activity
                          
                          return (
                            <div key={activity.id || index} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                              {/* Ícone da Ação */}
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                {getActionIcon(activity.action)}
                              </div>

                              {/* Conteúdo Principal */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {activity.details || getActionLabel(activity.action)} - {processData.process_number}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {activity.user_name || 'Usuário do Sistema'} • {formatTimeAgo(activity.created_at)}
                                    </p>
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-xs"
                                    onClick={() => handleProcessClick(processData.id || activity.id)}
                                  >
                                    Ver
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>

                    {/* Paginação */}
                    {recentActivities.length > logsPerPage && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="text-sm text-gray-500">
                          Página {currentPage} de {Math.ceil(recentActivities.length / logsPerPage)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="text-xs"
                          >
                            Anterior
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(recentActivities.length / logsPerPage), prev + 1))}
                            disabled={currentPage === Math.ceil(recentActivities.length / logsPerPage)}
                            className="text-xs"
                          >
                            Próxima
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}