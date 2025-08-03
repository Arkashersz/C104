import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface Notification {
  id: string
  recipient_id: string
  type: string
  title: string
  message: string
  process_number?: string
  group_name?: string
  status: string
  read: boolean
  viewed: boolean
  sent_at: string
  updated_at: string
  created_at: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carregar notificações do backend
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notifications')
      
      if (!response.ok) {
        throw new Error('Erro ao carregar notificações')
      }
      
      const data = await response.json()
      setNotifications(data.data || [])
      setError(null)
    } catch (err) {
      console.error('Erro ao carregar notificações:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  // Marcar notificação como lida
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Erro ao marcar notificação como lida')
      }
      
      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err)
      throw err
    }
  }

  // Marcar notificação como visualizada
  const markAsViewed = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/mark-viewed`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Erro ao marcar notificação como visualizada')
      }
      
      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, viewed: true } : n)
      )
    } catch (err) {
      console.error('Erro ao marcar notificação como visualizada:', err)
      throw err
    }
  }

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Erro ao marcar todas as notificações como lidas')
      }
      
      // Atualizar estado local
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (err) {
      console.error('Erro ao marcar todas as notificações como lidas:', err)
      throw err
    }
  }

  // Marcar todas como visualizadas
  const markAllAsViewed = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-viewed', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Erro ao marcar todas as notificações como visualizadas')
      }
      
      // Atualizar estado local
      setNotifications(prev => prev.map(n => ({ ...n, viewed: true, read: true })))
    } catch (err) {
      console.error('Erro ao marcar todas as notificações como visualizadas:', err)
      throw err
    }
  }

  // Deletar notificação
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Erro ao deletar notificação')
      }
      
      // Atualizar estado local
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (err) {
      console.error('Erro ao deletar notificação:', err)
      throw err
    }
  }

  // Carregar notificações na inicialização
  useEffect(() => {
    fetchNotifications()
  }, [])

  // Configurar real-time para novas notificações
  useEffect(() => {
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        const newNotification = payload.new as Notification
        setNotifications(prev => [newNotification, ...prev])
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        const updatedNotification = payload.new as Notification
        setNotifications(prev => 
          prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
        )
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        const deletedNotification = payload.old as Notification
        setNotifications(prev => prev.filter(n => n.id !== deletedNotification.id))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAsViewed,
    markAllAsRead,
    markAllAsViewed,
    deleteNotification,
  }
}
