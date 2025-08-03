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
  processId?: string
  priority: 'low' | 'medium' | 'high'
  shownToday?: boolean
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

  // Simular notificações em tempo real
  useEffect(() => {
    const todayKey = getTodayKey()
    
    // Se já mostrou notificações hoje, não mostrar novamente
    if (lastNotificationDate === todayKey) {
      return
    }

    // Gerar notificações baseadas nos processos
    const generateNotifications = () => {
      const newNotifications: RealTimeNotification[] = []
      const today = getTodayStart()

      // Processos vencidos (data já passou)
      const expiredProcesses = processes.filter(p => {
        if (!p.end_date) return false
        const endDate = getProcessDate(p.end_date)
        endDate.setHours(0, 0, 0, 0)
        return endDate < today
      })

      expiredProcesses.forEach(process => {
        const endDate = getProcessDate(process.end_date)
        newNotifications.push({
          id: `expired-${process.id}`,
          type: 'process_expired',
          title: 'Processo Vencido',
          message: `O processo ${process.process_number} venceu em ${endDate.toLocaleDateString('pt-BR')}`,
          timestamp: new Date().toISOString(),
          read: false,
          processId: process.id,
          priority: 'high',
          shownToday: true
        })
      })

      // Processos vencendo hoje (data é hoje)
      const expiringToday = processes.filter(p => {
        if (!p.end_date) return false
        const endDate = getProcessDate(p.end_date)
        endDate.setHours(0, 0, 0, 0)
        return endDate.getTime() === today.getTime()
      })

      expiringToday.forEach(process => {
        newNotifications.push({
          id: `expiring-today-${process.id}`,
          type: 'deadline_approaching',
          title: 'Processo Vencendo Hoje',
          message: `O processo ${process.process_number} vence hoje`,
          timestamp: new Date().toISOString(),
          read: false,
          processId: process.id,
          priority: 'high',
          shownToday: true
        })
      })

      // Processos sem grupo
      const processesWithoutGroup = processes.filter(p => !p.group_id)
      if (processesWithoutGroup.length > 0) {
        newNotifications.push({
          id: 'no-group',
          type: 'group_assigned',
          title: 'Processos Sem Responsável',
          message: `${processesWithoutGroup.length} processo(s) sem grupo responsável`,
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'medium',
          shownToday: true
        })
      }

      // Processos criados recentemente (últimas 24h)
      const recentProcesses = processes.filter(p => {
        const createdDate = getProcessDate(p.created_at)
        const now = getToday()
        const diffHours = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60)
        return diffHours <= 24
      })

      recentProcesses.forEach(process => {
        newNotifications.push({
          id: `created-${process.id}`,
          type: 'process_created',
          title: 'Novo Processo Criado',
          message: `Processo ${process.process_number} foi criado`,
          timestamp: process.created_at,
          read: false,
          processId: process.id,
          priority: 'low',
          shownToday: true
        })
      })

      setNotifications(prev => {
        const existingIds = prev.map(n => n.id)
        const uniqueNewNotifications = newNotifications.filter(n => !existingIds.includes(n.id))
        return [...uniqueNewNotifications, ...prev].slice(0, 20) // Manter apenas as 20 mais recentes
      })

      // Marcar que mostrou notificações hoje
      setLastNotificationDate(todayKey)
    }

    // Gerar notificações apenas uma vez ao carregar
    generateNotifications()
  }, [processes, lastNotificationDate])

  // Atualizar contador de não lidas
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length)
  }, [notifications])

  // Mostrar toasts apenas para notificações críticas e apenas uma vez
  useEffect(() => {
    const criticalNotifications = notifications.filter(n => 
      (n.type === 'deadline_approaching' || n.type === 'process_expired') && 
      !n.read && 
      n.shownToday
    )
    
    if (criticalNotifications.length > 0) {
      // Mostrar toast apenas para notificações críticas
      criticalNotifications.forEach(notification => {
        toast.error(notification.message, {
          duration: 5000,
          action: {
            label: 'Ver',
            onClick: () => notification.processId && onProcessClick?.(notification.processId)
          }
        })
      })
    }
  }, [notifications, onProcessClick])

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
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
        <Card className="absolute top-12 right-0 w-96 z-50 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notificações</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Marcar todas como lidas
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
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>Nenhuma notificação</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-l-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        notification.read ? 'opacity-60' : ''
                      } ${getPriorityColor(notification.priority)}`}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id)
                        }
                        if (notification.processId) {
                          onProcessClick?.(notification.processId)
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
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 