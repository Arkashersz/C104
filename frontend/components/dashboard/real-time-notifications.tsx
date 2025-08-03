'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, X, CheckCircle, AlertTriangle, Clock, FileText, Users, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface RealTimeNotification {
  id: string
  type: 'process_created' | 'process_updated' | 'deadline_approaching' | 'process_expired' | 'group_assigned' | 'process_completed'
  title: string
  message: string
  timestamp: string
  read: boolean
  viewed: boolean // Novo campo para marcar como visualizada
  processId?: string
  priority: 'low' | 'medium' | 'high'
  shownToday?: boolean
  createdDate?: string // Data de criação da notificação (YYYY-MM-DD)
  deleted?: boolean // Campo para marcar como deletada
}

interface RealTimeNotificationsProps {
  processes: any[]
  onProcessClick?: (processId: string) => void
}

export function RealTimeNotifications({ processes, onProcessClick }: RealTimeNotificationsProps) {
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastNotificationDate, setLastNotificationDate] = useState<string>('')
  const [shownToastIds, setShownToastIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'active' | 'read' | 'deleted'>('active')

  // Função para obter data atual (SEM conversão de fuso)
  const getToday = () => {
    return new Date()
  }

  // Função para obter início do dia (SEM conversão de fuso)
  const getTodayStart = () => {
    const today = getToday()
    today.setHours(0, 0, 0, 0)
    return today
  }

  // Verificar se já mostrou notificações hoje
  const getTodayKey = () => {
    const today = getToday()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
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

  // Função para formatar data sem conversão de timezone
  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    
    // Se a data já está no formato YYYY-MM-DD, usar diretamente
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-')
      return `${day}/${month}/${year}`
    }
    
    // Se tem T (ISO string), extrair apenas a parte da data
    if (dateString.includes('T')) {
      const datePart = dateString.split('T')[0]
      const [year, month, day] = datePart.split('-')
      return `${day}/${month}/${year}`
    }
    
    // Fallback para outras formatações
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  // Carregar notificações por tipo
  const getNotificationsByType = (type: 'active' | 'read' | 'deleted') => {
    try {
      const saved = localStorage.getItem('notifications')
      if (saved) {
        const parsed = JSON.parse(saved)
        const todayKey = getTodayKey()
        
        // Filtrar notificações do dia atual
        const todayNotifications = parsed.filter((n: any) => {
          // Se a notificação tem uma data de criação específica, usar ela
          if (n.createdDate) {
            const notificationDate = getProcessDate(n.createdDate)
            const notificationKey = `${notificationDate.getFullYear()}-${String(notificationDate.getMonth() + 1).padStart(2, '0')}-${String(notificationDate.getDate()).padStart(2, '0')}`
            return notificationKey === todayKey
          }
          
          // Se não tem data específica, usar timestamp
          const notificationDate = getProcessDate(n.timestamp)
          const notificationKey = `${notificationDate.getFullYear()}-${String(notificationDate.getMonth() + 1).padStart(2, '0')}-${String(notificationDate.getDate()).padStart(2, '0')}`
          return notificationKey === todayKey
        })
        
        // Filtrar por tipo
        switch (type) {
          case 'active':
            // Notificações ativas: não deletadas E não lidas
            return todayNotifications.filter((n: any) => !n.deleted && !n.read)
          case 'read':
            // Notificações lidas: não deletadas E lidas
            return todayNotifications.filter((n: any) => !n.deleted && n.read)
          case 'deleted':
            // Notificações deletadas
            return todayNotifications.filter((n: any) => n.deleted)
          default:
            return []
        }
      }
    } catch (error) {
      console.log('Erro ao carregar notificações por tipo:', error)
    }
    return []
  }

  // Carregar notificações salvas do localStorage
  const loadSavedNotifications = () => {
    return getNotificationsByType('active')
  }

  // Salvar notificações no localStorage
  const saveNotifications = (notifications: RealTimeNotification[]) => {
    try {
      // Carregar todas as notificações existentes
      const allSaved = JSON.parse(localStorage.getItem('notifications') || '[]')
      
      // Filtrar notificações antigas (mais de 7 dias) e deletadas
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoKey = `${sevenDaysAgo.getFullYear()}-${String(sevenDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysAgo.getDate()).padStart(2, '0')}`
      
      const recentNotifications = allSaved.filter((n: any) => {
        // Não incluir notificações deletadas
        if (n.deleted) {
          return false
        }
        
        const notificationDate = n.createdDate || n.timestamp
        const date = getProcessDate(notificationDate)
        const notificationKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        return notificationKey >= sevenDaysAgoKey
      })
      
      // Combinar notificações existentes com novas, evitando duplicatas por ID
      const existingIds = new Set(recentNotifications.map((n: any) => n.id))
      const uniqueNewNotifications = notifications.filter(n => !existingIds.has(n.id))
      
      const updatedNotifications = [...recentNotifications, ...uniqueNewNotifications]
      
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications))
    } catch (error) {
      console.log('Erro ao salvar notificações no localStorage:', error)
    }
  }

  // Gerar notificações baseadas nos processos
  const generateNotifications = () => {
    const newNotifications: RealTimeNotification[] = []
    const today = getTodayStart()
    const todayKey = getTodayKey()

    // Carregar notificações deletadas para verificar se já foram deletadas
    const allSaved = JSON.parse(localStorage.getItem('notifications') || '[]')
    const deletedNotificationIds = new Set(
      allSaved
        .filter((n: any) => n.deleted)
        .map((n: any) => n.id)
    )

    // Processos vencidos (data já passou)
    const expiredProcesses = processes.filter(p => {
      if (!p.end_date || p.status === 'finalizado') return false
      const endDate = getProcessDate(p.end_date)
      endDate.setHours(0, 0, 0, 0)
      return endDate < today
    })

    expiredProcesses.forEach(process => {
      const notificationId = `expired-${process.id}-${todayKey}`
      
      // Verificar se esta notificação já foi deletada
      if (deletedNotificationIds.has(notificationId)) {
        return // Pular se já foi deletada
      }
      
      const endDate = getProcessDate(process.end_date)
      newNotifications.push({
        id: notificationId,
        type: 'process_expired',
        title: 'Processo Vencido',
        message: `O processo ${process.process_number} venceu em ${endDate.toLocaleDateString('pt-BR')}`,
        timestamp: new Date().toISOString(),
        read: false,
        viewed: false,
        processId: process.id,
        priority: 'high',
        shownToday: true,
        createdDate: todayKey
      })
    })

    // Processos vencendo hoje (data é hoje)
    const expiringToday = processes.filter(p => {
      if (!p.end_date || p.status === 'finalizado') return false
      const endDate = getProcessDate(p.end_date)
      endDate.setHours(0, 0, 0, 0)
      return endDate.getTime() === today.getTime()
    })

    expiringToday.forEach(process => {
      const notificationId = `expiring-today-${process.id}-${todayKey}`
      
      // Verificar se esta notificação já foi deletada
      if (deletedNotificationIds.has(notificationId)) {
        return // Pular se já foi deletada
      }
      
      newNotifications.push({
        id: notificationId,
        type: 'deadline_approaching',
        title: 'Processo Vencendo Hoje',
        message: `O processo ${process.process_number} vence hoje`,
        timestamp: new Date().toISOString(),
        read: false,
        viewed: false,
        processId: process.id,
        priority: 'high',
        shownToday: true,
        createdDate: todayKey
      })
    })

    // Processos sem grupo
    const processesWithoutGroup = processes.filter(p => !p.group_id)
    if (processesWithoutGroup.length > 0) {
      const notificationId = `no-group-${todayKey}`
      
      // Verificar se esta notificação já foi deletada
      if (!deletedNotificationIds.has(notificationId)) {
        newNotifications.push({
          id: notificationId,
          type: 'group_assigned',
          title: 'Processos Sem Responsável',
          message: `${processesWithoutGroup.length} processo(s) sem grupo responsável`,
          timestamp: new Date().toISOString(),
          read: false,
          viewed: false,
          priority: 'medium',
          shownToday: true,
          createdDate: todayKey
        })
      }
    }

    // Processos criados recentemente (últimas 24h)
    const recentProcesses = processes.filter(p => {
      const createdDate = getProcessDate(p.created_at)
      const now = getToday()
      const diffHours = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60)
      return diffHours <= 24
    })

    recentProcesses.forEach(process => {
      const notificationId = `created-${process.id}-${todayKey}`
      
      // Verificar se esta notificação já foi deletada
      if (deletedNotificationIds.has(notificationId)) {
        return // Pular se já foi deletada
      }
      
      newNotifications.push({
        id: notificationId,
        type: 'process_created',
        title: 'Novo Processo Criado',
        message: `Processo ${process.process_number} foi criado`,
        timestamp: process.created_at,
        read: false,
        viewed: false,
        processId: process.id,
        priority: 'low',
        shownToday: true,
        createdDate: todayKey
      })
    })

    return newNotifications
  }

  // Simular notificações em tempo real
  useEffect(() => {
    const todayKey = getTodayKey()
    
    // Se mudou o dia, limpar os IDs de toast mostrados e limpar notificações antigas
    if (lastNotificationDate !== todayKey) {
      setShownToastIds(new Set())
      setLastNotificationDate(todayKey)
      
      // Limpar notificações antigas do localStorage (mais de 7 dias)
      try {
        const allSaved = JSON.parse(localStorage.getItem('notifications') || '[]')
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const sevenDaysAgoKey = `${sevenDaysAgo.getFullYear()}-${String(sevenDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysAgo.getDate()).padStart(2, '0')}`
        
        const recentNotifications = allSaved.filter((n: any) => {
          const notificationDate = n.createdDate || n.timestamp
          const date = getProcessDate(notificationDate)
          const notificationKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
          return notificationKey >= sevenDaysAgoKey
        })
        
        localStorage.setItem('notifications', JSON.stringify(recentNotifications))
      } catch (error) {
        console.log('Erro ao limpar notificações antigas:', error)
      }
      
      // Limpar notificações deletadas antigas
      cleanupDeletedNotifications()
    }

    // Carregar notificações salvas do localStorage
    const savedNotifications = loadSavedNotifications()
    
    // Se já temos notificações para hoje, usar apenas elas
    if (savedNotifications.length > 0) {
      setNotifications(savedNotifications)
      return
    }
    
    // Se não temos notificações para hoje, gerar novas
    const newNotifications = generateNotifications()
    
    if (newNotifications.length > 0) {
      setNotifications(newNotifications)
      saveNotifications(newNotifications)
    }
  }, [lastNotificationDate]) // Removido 'processes' das dependências

  // Atualizar notificações quando processos mudam (apenas se necessário)
  useEffect(() => {
    const todayKey = getTodayKey()
    const savedNotifications = loadSavedNotifications()
    
    // Se já temos notificações para hoje, verificar se precisamos adicionar novas
    if (savedNotifications.length > 0) {
      // Gerar notificações para ver se há novas que não existem
      const newNotifications = generateNotifications()
      
      // Filtrar apenas notificações que não existem nas salvas
      const existingIds = new Set(savedNotifications.map(n => n.id))
      const trulyNewNotifications = newNotifications.filter(n => !existingIds.has(n.id))
      
      if (trulyNewNotifications.length > 0) {
        // Adicionar apenas as novas notificações
        const updatedNotifications = [...savedNotifications, ...trulyNewNotifications]
        setNotifications(updatedNotifications)
        saveNotifications(updatedNotifications)
      }
      return
    }
    
    // Se não temos notificações para hoje, gerar novas
    const newNotifications = generateNotifications()
    
    if (newNotifications.length > 0) {
      setNotifications(newNotifications)
      saveNotifications(newNotifications)
    }
  }, [processes]) // Apenas quando processos mudam

  // Atualizar notificações quando a aba muda
  useEffect(() => {
    const currentNotifications = getNotificationsByType(activeTab)
    setNotifications(currentNotifications)
  }, [activeTab])

  // Atualizar contador de não lidas (apenas não visualizadas das ativas)
  useEffect(() => {
    const activeNotifications = getNotificationsByType('active')
    setUnreadCount(activeNotifications.filter(n => !n.viewed).length)
  }, [activeTab, notifications])

  // Mostrar toast apenas para notificações críticas novas
  useEffect(() => {
    const criticalNotifications = notifications.filter(n => 
      (n.type === 'deadline_approaching' || n.type === 'process_expired') && 
      !n.viewed && // Mudou de !n.read para !n.viewed
      n.shownToday &&
      !shownToastIds.has(n.id) // Só mostrar toast se ainda não foi mostrado
    )
    
    if (criticalNotifications.length > 0) {
      // Mostrar apenas uma notificação por vez para evitar spam
      const notification = criticalNotifications[0]
      
      // Marcar como já mostrada
      setShownToastIds(prev => new Set([...prev, notification.id]))
      
      // Mostrar toast com auto-hide após 5 segundos
      toast.error(notification.message, {
        duration: 5000, // 5 segundos
        action: {
          label: 'Ver',
          onClick: () => notification.processId && onProcessClick?.(notification.processId)
        }
      })
    }
  }, [notifications, onProcessClick, shownToastIds])

  const markAsViewed = async (notificationId: string) => {
    // Atualizar localStorage diretamente
    const allSaved = JSON.parse(localStorage.getItem('notifications') || '[]')
    const updatedSaved = allSaved.map((n: any) => 
      n.id === notificationId ? { ...n, viewed: true, read: true } : n
    )
    localStorage.setItem('notifications', JSON.stringify(updatedSaved))
    
    // Atualizar estado em tempo real
    const currentNotifications = getNotificationsByType(activeTab)
    setNotifications(currentNotifications)
  }

  const markAsRead = async (notificationId: string) => {
    // Atualizar localStorage diretamente
    const allSaved = JSON.parse(localStorage.getItem('notifications') || '[]')
    const updatedSaved = allSaved.map((n: any) => 
      n.id === notificationId ? { ...n, read: true } : n
    )
    localStorage.setItem('notifications', JSON.stringify(updatedSaved))
    
    // Atualizar estado em tempo real
    const currentNotifications = getNotificationsByType(activeTab)
    setNotifications(currentNotifications)
  }

  const markAllAsViewed = async () => {
    // Atualizar localStorage diretamente
    const allSaved = JSON.parse(localStorage.getItem('notifications') || '[]')
    const updatedSaved = allSaved.map((n: any) => ({ ...n, viewed: true, read: true }))
    localStorage.setItem('notifications', JSON.stringify(updatedSaved))
    
    // Atualizar estado em tempo real
    const currentNotifications = getNotificationsByType(activeTab)
    setNotifications(currentNotifications)
  }

  const deleteNotification = (notificationId: string) => {
    // Marcar como deletada no localStorage
    const allSaved = JSON.parse(localStorage.getItem('notifications') || '[]')
    const updatedSaved = allSaved.map((n: any) => 
      n.id === notificationId ? { ...n, deleted: true } : n
    )
    localStorage.setItem('notifications', JSON.stringify(updatedSaved))
    
    // Atualizar estado em tempo real
    const currentNotifications = getNotificationsByType(activeTab)
    setNotifications(currentNotifications)
  }

  const restoreNotification = (notificationId: string) => {
    // Restaurar notificação
    const allSaved = JSON.parse(localStorage.getItem('notifications') || '[]')
    const updatedSaved = allSaved.map((n: any) => 
      n.id === notificationId ? { ...n, deleted: false } : n
    )
    localStorage.setItem('notifications', JSON.stringify(updatedSaved))
    
    // Atualizar estado em tempo real
    const currentNotifications = getNotificationsByType(activeTab)
    setNotifications(currentNotifications)
  }

  const markAsUnread = (notificationId: string) => {
    // Marcar como não lida
    const allSaved = JSON.parse(localStorage.getItem('notifications') || '[]')
    const updatedSaved = allSaved.map((n: any) => 
      n.id === notificationId ? { ...n, read: false, viewed: false } : n
    )
    localStorage.setItem('notifications', JSON.stringify(updatedSaved))
    
    // Atualizar estado em tempo real
    const currentNotifications = getNotificationsByType(activeTab)
    setNotifications(currentNotifications)
  }

  const getNotificationIcon = (type: RealTimeNotification['type']) => {
    switch (type) {
      case 'process_created':
        return <FileText className="h-4 w-4 text-blue-500" />
      case 'process_updated':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'deadline_approaching':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'process_expired':
        return <Calendar className="h-4 w-4 text-red-500" />
      case 'group_assigned':
        return <Users className="h-4 w-4 text-purple-500" />
      case 'process_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: RealTimeNotification['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50'
      case 'medium':
        return 'border-l-orange-500 bg-orange-50'
      case 'low':
        return 'border-l-blue-500 bg-blue-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = getProcessDate(timestamp)
    const now = getToday()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Agora'
    if (diffMinutes < 60) return `${diffMinutes}m atrás`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h atrás`
    return date.toLocaleDateString('pt-BR')
  }

  // Atualizar notificações existentes no localStorage
  const updateNotificationsInStorage = (updatedNotifications: RealTimeNotification[]) => {
    try {
      // Carregar todas as notificações existentes
      const allSaved = JSON.parse(localStorage.getItem('notifications') || '[]')
      
      // Filtrar notificações antigas (mais de 7 dias)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoKey = `${sevenDaysAgo.getFullYear()}-${String(sevenDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysAgo.getDate()).padStart(2, '0')}`
      
      const recentNotifications = allSaved.filter((n: any) => {
        const notificationDate = n.createdDate || n.timestamp
        const date = getProcessDate(notificationDate)
        const notificationKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        return notificationKey >= sevenDaysAgoKey
      })
      
      // Atualizar notificações existentes com as novas
      const updatedMap = new Map()
      
      // Adicionar notificações antigas (incluindo deletadas para manter o estado)
      recentNotifications.forEach((n: any) => {
        updatedMap.set(n.id, n)
      })
      
      // Atualizar com as novas (não deletadas)
      updatedNotifications.forEach(n => {
        updatedMap.set(n.id, n)
      })
      
      const finalNotifications = Array.from(updatedMap.values())
      localStorage.setItem('notifications', JSON.stringify(finalNotifications))
    } catch (error) {
      console.log('Erro ao atualizar notificações no localStorage:', error)
    }
  }

  // Limpar notificações deletadas antigas do localStorage
  const cleanupDeletedNotifications = () => {
    try {
      const allSaved = JSON.parse(localStorage.getItem('notifications') || '[]')
      
      // Remover notificações deletadas que são mais antigas que 1 dia
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)
      const oneDayAgoKey = `${oneDayAgo.getFullYear()}-${String(oneDayAgo.getMonth() + 1).padStart(2, '0')}-${String(oneDayAgo.getDate()).padStart(2, '0')}`
      
      const cleanedNotifications = allSaved.filter((n: any) => {
        // Se não foi deletada, manter
        if (!n.deleted) {
          return true
        }
        
        // Se foi deletada, verificar se é recente (menos de 1 dia)
        const notificationDate = n.createdDate || n.timestamp
        const date = getProcessDate(notificationDate)
        const notificationKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        return notificationKey >= oneDayAgoKey
      })
      
      localStorage.setItem('notifications', JSON.stringify(cleanedNotifications))
    } catch (error) {
      console.log('Erro ao limpar notificações deletadas:', error)
    }
  }

  return (
    <div className="relative">
      {/* Botão de notificações */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Painel de notificações */}
      {showNotifications && (
        <>
          {/* Backdrop para melhorar legibilidade */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-20 z-40"
            onClick={() => setShowNotifications(false)}
          />
          <Card className="absolute top-12 right-0 w-[500px] z-50 shadow-xl bg-white border border-gray-200">
            <CardHeader className="pb-3 bg-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notificações</CardTitle>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && activeTab === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={markAllAsViewed}
                      className="text-xs"
                    >
                      Ler todas
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNotifications(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Abas */}
              <div className="flex border-b border-gray-200 mt-3">
                <button
                  onClick={() => setActiveTab('active')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'active'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Ativas ({getNotificationsByType('active').length})
                </button>
                <button
                  onClick={() => setActiveTab('read')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'read'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Lidas ({getNotificationsByType('read').length})
                </button>
                <button
                  onClick={() => setActiveTab('deleted')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'deleted'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Lixeira ({getNotificationsByType('deleted').length})
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0 bg-white">
              <div className="max-h-[600px] overflow-y-auto bg-white">
                {(() => {
                  const currentNotifications = getNotificationsByType(activeTab)
                  
                  if (currentNotifications.length === 0) {
                    return (
                      <div className="p-8 text-center text-gray-500 bg-white">
                        <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg">
                          {activeTab === 'active' && 'Nenhuma notificação ativa'}
                          {activeTab === 'read' && 'Nenhuma notificação lida'}
                          {activeTab === 'deleted' && 'Lixeira vazia'}
                        </p>
                      </div>
                    )
                  }
                  
                  return (
                    <div className="space-y-2 bg-white p-2">
                      {currentNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-l-4 hover:bg-gray-50 transition-colors cursor-pointer bg-white rounded-lg ${
                            notification.read ? 'opacity-60' : ''
                          } ${getPriorityColor(notification.priority)}`}
                          onClick={async () => {
                            if (activeTab === 'active') {
                              if (!notification.read) {
                                await markAsRead(notification.id)
                              }
                              if (!notification.viewed) {
                                await markAsViewed(notification.id)
                              }
                              if (notification.processId) {
                                onProcessClick?.(notification.processId)
                              }
                            }
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              {getNotificationIcon(notification.type)}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm">{notification.title}</h4>
                                <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatTimestamp(notification.timestamp)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {activeTab === 'active' && !notification.viewed && (
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              )}
                              {activeTab === 'active' && !notification.read && notification.viewed && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                              
                              {/* Botões específicos por aba */}
                              {activeTab === 'active' && !notification.viewed && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    markAsViewed(notification.id)
                                  }}
                                  className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                                  title="Marcar como visualizada"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                              )}
                              
                              {activeTab === 'read' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    markAsUnread(notification.id)
                                  }}
                                  className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                                  title="Marcar como não lida"
                                >
                                  <Clock className="h-3 w-3" />
                                </Button>
                              )}
                              
                              {activeTab === 'deleted' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    restoreNotification(notification.id)
                                  }}
                                  className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                                  title="Restaurar notificação"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                              )}
                              
                              {activeTab !== 'deleted' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteNotification(notification.id)
                                  }}
                                  className="h-6 w-6 p-0"
                                  title="Excluir notificação"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
} 