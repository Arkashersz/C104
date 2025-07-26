'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  recipient_email: string
  sent_at: string
  status: 'sent' | 'failed' | 'pending'
  process_number?: string
  group_name?: string
}

interface NotificationSettings {
  daily_reports: boolean
  process_updates: boolean
  group_assignments: boolean
  reminders: boolean
  email_frequency: 'daily' | 'weekly' | 'monthly'
}

export default function NotificationsPage() {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [settings, setSettings] = useState<NotificationSettings>({
    daily_reports: true,
    process_updates: true,
    group_assignments: true,
    reminders: true,
    email_frequency: 'daily'
  })
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchNotifications()
    fetchSettings()
  }, [])

  async function fetchNotifications() {
    setLoading(true)
    try {
      const token = await getAuthToken()
      
      const response = await fetch('http://localhost:3001/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data.data || [])
      } else {
        console.error('Erro ao buscar notificações')
        // Mock data para demonstração
        setNotifications([
          {
            id: '1',
            type: 'group_assignment',
            title: 'Processo atribuído ao grupo',
            message: 'O processo SEI-2024-001 foi atribuído ao grupo Compras',
            recipient_email: 'knowenter@gmail.com',
            sent_at: new Date().toISOString(),
            status: 'sent',
            process_number: 'SEI-2024-001',
            group_name: 'Compras'
          },
          {
            id: '2',
            type: 'process_update',
            title: 'Processo atualizado',
            message: 'O processo SEI-2024-002 teve seu status alterado',
            recipient_email: 'knowenter@gmail.com',
            sent_at: new Date(Date.now() - 86400000).toISOString(),
            status: 'sent',
            process_number: 'SEI-2024-002'
          }
        ])
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
      toast.error('Erro ao carregar notificações')
    } finally {
      setLoading(false)
    }
  }

  async function fetchSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Buscar configurações da tabela user_notification_settings
        const { data, error } = await supabase
          .from('user_notification_settings')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows returned, que é normal se não há dados ainda
          console.error('Erro ao carregar configurações:', error)
        }

        if (data) {
          setSettings({
            daily_reports: data.daily_reports ?? true,
            process_updates: data.process_updates ?? true,
            group_assignments: data.group_assignments ?? true,
            reminders: data.reminders ?? true,
            email_frequency: data.email_frequency || 'daily'
          })
        } else {
          // Se não há dados, usar configurações padrão
          console.log('Usando configurações padrão - dados não encontrados na tabela')
          setSettings({
            daily_reports: true,
            process_updates: true,
            group_assignments: true,
            reminders: true,
            email_frequency: 'daily'
          })
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      // Em caso de erro, usar configurações padrão
      setSettings({
        daily_reports: true,
        process_updates: true,
        group_assignments: true,
        reminders: true,
        email_frequency: 'daily'
      })
    }
  }

  async function getAuthToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  async function updateSettings(newSettings: Partial<NotificationSettings>) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const updatedSettings = { ...settings, ...newSettings }
        
        // Primeiro tentar atualizar, se não existir, inserir
        const { data: existingData } = await supabase
          .from('user_notification_settings')
          .select('id')
          .eq('user_id', user.id)
          .single()

        let error
        if (existingData) {
          // Atualizar registro existente
          const { error: updateError } = await supabase
            .from('user_notification_settings')
            .update({
              daily_reports: updatedSettings.daily_reports,
              process_updates: updatedSettings.process_updates,
              group_assignments: updatedSettings.group_assignments,
              reminders: updatedSettings.reminders,
              email_frequency: updatedSettings.email_frequency
            })
            .eq('user_id', user.id)
          error = updateError
        } else {
          // Inserir novo registro
          const { error: insertError } = await supabase
            .from('user_notification_settings')
            .insert({
              user_id: user.id,
              daily_reports: updatedSettings.daily_reports,
              process_updates: updatedSettings.process_updates,
              group_assignments: updatedSettings.group_assignments,
              reminders: updatedSettings.reminders,
              email_frequency: updatedSettings.email_frequency
            })
          error = insertError
        }

        if (error) {
          console.error('Erro ao salvar configurações:', error)
          toast.error('Erro ao salvar configurações')
          return
        }

        setSettings(updatedSettings)
        toast.success('Configurações salvas com sucesso')
      }
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error)
      toast.error('Erro ao atualizar configurações')
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'group_assignment':
        return '👥'
      case 'process_update':
        return '📝'
      case 'daily_report':
        return '📊'
      case 'reminder':
        return '⏰'
      default:
        return '📧'
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'sent':
        return 'text-green-600 bg-green-100'
      case 'failed':
        return 'text-red-600 bg-red-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true
    return notification.type === filter
  })

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <h1 className="text-3xl font-bold mb-8">Notificações</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configurações */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Configurações</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.daily_reports}
                      onChange={(e) => updateSettings({ daily_reports: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Relatórios diários</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.process_updates}
                      onChange={(e) => updateSettings({ process_updates: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Atualizações de processos</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.group_assignments}
                      onChange={(e) => updateSettings({ group_assignments: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Atribuições de grupo</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.reminders}
                      onChange={(e) => updateSettings({ reminders: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Lembretes</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Frequência de emails</label>
                  <select
                    value={settings.email_frequency}
                    onChange={(e) => updateSettings({ email_frequency: e.target.value as any })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Histórico */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Histórico de Notificações</h2>
                
                <div className="flex space-x-2">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="p-2 border rounded-md text-sm"
                  >
                    <option value="all">Todas</option>
                    <option value="group_assignment">Atribuições</option>
                    <option value="process_update">Atualizações</option>
                    <option value="daily_report">Relatórios</option>
                    <option value="reminder">Lembretes</option>
                  </select>
                  
                  <Button onClick={fetchNotifications} disabled={loading}>
                    {loading ? 'Carregando...' : 'Atualizar'}
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Carregando notificações...</div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Nenhuma notificação encontrada</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotifications.map((notification) => (
                    <div key={notification.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{notification.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>📧 {notification.recipient_email}</span>
                              {notification.process_number && (
                                <span>📄 {notification.process_number}</span>
                              )}
                              {notification.group_name && (
                                <span>👥 {notification.group_name}</span>
                              )}
                              <span>
                                📅 {new Date(notification.sent_at).toLocaleString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(notification.status)}`}>
                          {notification.status === 'sent' ? 'Enviado' : 
                           notification.status === 'failed' ? 'Falhou' : 'Pendente'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}