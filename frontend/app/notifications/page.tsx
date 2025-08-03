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
  // Configurações de horário
  daily_time?: string // HH:MM
  weekly_day?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  weekly_time?: string // HH:MM
  monthly_day?: number // 1-31
  monthly_time?: string // HH:MM
  // Configurações de relatórios
  report_processes_near_expiry: boolean
  report_group_processes: boolean
  report_expiry_days: number // Dias antes do vencimento
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
        console.log('🔍 Buscando configurações para usuário:', user.id)
        
        // Carregar configurações do localStorage primeiro
        const savedSettings = localStorage.getItem(`notification_settings_${user.id}`)
        console.log('📦 Dados do localStorage:', savedSettings)
        
        if (savedSettings) {
          try {
            const parsedSettings = JSON.parse(savedSettings)
            console.log('✅ Configurações parseadas:', parsedSettings)
            setSettings({
              daily_reports: parsedSettings.daily_reports ?? true,
              process_updates: parsedSettings.process_updates ?? true,
              group_assignments: parsedSettings.group_assignments ?? true,
              reminders: parsedSettings.reminders ?? true,
              email_frequency: parsedSettings.email_frequency || 'daily',
              daily_time: parsedSettings.daily_time || '09:00',
              weekly_day: parsedSettings.weekly_day || 'monday',
              weekly_time: parsedSettings.weekly_time || '09:00',
              monthly_day: parsedSettings.monthly_day || 1,
              monthly_time: parsedSettings.monthly_time || '09:00',
              report_processes_near_expiry: parsedSettings.report_processes_near_expiry ?? true,
              report_group_processes: parsedSettings.report_group_processes ?? true,
              report_expiry_days: parsedSettings.report_expiry_days || 7
            })
            console.log('✅ Configurações carregadas do localStorage com sucesso')
            return
          } catch (error) {
            console.error('❌ Erro ao parsear configurações do localStorage:', error)
          }
        }

        // Se não há configurações salvas, usar padrão
        console.log('🔄 Usando configurações padrão - localStorage vazio')
        setSettings({
          daily_reports: true,
          process_updates: true,
          group_assignments: true,
          reminders: true,
          email_frequency: 'daily',
          daily_time: '09:00',
          weekly_day: 'monday',
          weekly_time: '09:00',
          monthly_day: 1,
          monthly_time: '09:00',
          report_processes_near_expiry: true,
          report_group_processes: true,
          report_expiry_days: 7
        })
      }
    } catch (error) {
      console.error('❌ Erro ao carregar configurações:', error)
      // Em caso de erro, usar configurações padrão
      setSettings({
        daily_reports: true,
        process_updates: true,
        group_assignments: true,
        reminders: true,
        email_frequency: 'daily',
        daily_time: '09:00',
        weekly_day: 'monday',
        weekly_time: '09:00',
        monthly_day: 1,
        monthly_time: '09:00',
        report_processes_near_expiry: true,
        report_group_processes: true,
        report_expiry_days: 7
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
        console.log('💾 Salvando configurações:', updatedSettings)
        
        // Salvar no localStorage
        const localStorageKey = `notification_settings_${user.id}`
        localStorage.setItem(localStorageKey, JSON.stringify(updatedSettings))
        console.log('✅ Configurações salvas no localStorage com chave:', localStorageKey)
        
        // Verificar se foi salvo corretamente
        const savedData = localStorage.getItem(localStorageKey)
        console.log('🔍 Verificação - dados salvos:', savedData)
        
        // Sincronizar com o backend
        try {
          const response = await fetch(`/api/sync-user-settings`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              settings: updatedSettings
            })
          })
          
          if (response.ok) {
            console.log('✅ Configurações sincronizadas com o backend')
          } else {
            console.log('⚠️ Erro ao sincronizar com o backend:', response.status)
          }
        } catch (error) {
          console.log('⚠️ Erro ao sincronizar com o backend:', error)
        }
        
        // Atualizar estado
        setSettings(updatedSettings)
        toast.success('Configurações salvas com sucesso')
        
        // Tentar salvar no banco de dados em background (sem bloquear a UI)
        try {
          console.log('🔄 Tentando salvar no banco de dados...')
          const { data: tableExists } = await supabase
            .from('user_notification_settings')
            .select('id')
            .limit(1)

          if (tableExists !== null) {
            console.log('✅ Tabela existe, salvando no banco...')
            // Tabela existe, tentar salvar no banco
            const { data: existingData } = await supabase
              .from('user_notification_settings')
              .select('id')
              .eq('user_id', user.id)
              .single()

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
              
              if (updateError) {
                console.log('⚠️ Erro ao atualizar no banco:', updateError)
              } else {
                console.log('✅ Configurações atualizadas no banco com sucesso')
              }
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
              
              if (insertError) {
                console.log('⚠️ Erro ao inserir no banco:', insertError)
              } else {
                console.log('✅ Configurações inseridas no banco com sucesso')
              }
            }
          } else {
            console.log('⚠️ Tabela não existe no banco de dados')
          }
        } catch (error) {
          console.log('⚠️ Erro ao salvar no banco de dados (não crítico):', error)
          // Não mostrar erro para o usuário, pois localStorage já salvou
        }
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar configurações:', error)
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

  // Função para verificar status das configurações
  async function checkSettingsStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const localStorageKey = `notification_settings_${user.id}`
        const savedData = localStorage.getItem(localStorageKey)
        
        console.log('🔍 === VERIFICAÇÃO DE STATUS ===')
        console.log('👤 Usuário ID:', user.id)
        console.log('📦 localStorage key:', localStorageKey)
        console.log('💾 Dados salvos:', savedData)
        console.log('⚙️ Configurações atuais:', settings)
        console.log('===============================')
        
        return {
          userExists: !!user,
          localStorageKey,
          savedData: savedData ? JSON.parse(savedData) : null,
          currentSettings: settings
        }
      } else {
        console.log('❌ Usuário não autenticado')
        return null
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error)
      return null
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

                {/* Configurações de Horário */}
                {settings.email_frequency === 'daily' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Horário do envio diário</label>
                    <input
                      type="time"
                      value={settings.daily_time || '09:00'}
                      onChange={(e) => updateSettings({ daily_time: e.target.value })}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                )}

                {settings.email_frequency === 'weekly' && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">Dia da semana</label>
                      <select
                        value={settings.weekly_day || 'monday'}
                        onChange={(e) => updateSettings({ weekly_day: e.target.value as any })}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="monday">Segunda-feira</option>
                        <option value="tuesday">Terça-feira</option>
                        <option value="wednesday">Quarta-feira</option>
                        <option value="thursday">Quinta-feira</option>
                        <option value="friday">Sexta-feira</option>
                        <option value="saturday">Sábado</option>
                        <option value="sunday">Domingo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Horário</label>
                      <input
                        type="time"
                        value={settings.weekly_time || '09:00'}
                        onChange={(e) => updateSettings({ weekly_time: e.target.value })}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                  </div>
                )}

                {settings.email_frequency === 'monthly' && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">Dia do mês</label>
                      <select
                        value={settings.monthly_day || 1}
                        onChange={(e) => updateSettings({ monthly_day: parseInt(e.target.value) })}
                        className="w-full p-2 border rounded-md"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Horário</label>
                      <input
                        type="time"
                        value={settings.monthly_time || '09:00'}
                        onChange={(e) => updateSettings({ monthly_time: e.target.value })}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                  </div>
                )}

                {/* Configurações de Relatórios */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-3">Configurações de Relatórios</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={settings.report_processes_near_expiry}
                          onChange={(e) => updateSettings({ report_processes_near_expiry: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm">Processos próximos do vencimento</span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={settings.report_group_processes}
                          onChange={(e) => updateSettings({ report_group_processes: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm">Processos do meu grupo</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Dias antes do vencimento</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={settings.report_expiry_days || 7}
                        onChange={(e) => updateSettings({ report_expiry_days: parseInt(e.target.value) })}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                  </div>
                </div>

                {/* Botões de Debug */}
                <div className="pt-4 border-t space-y-2">
                  <Button 
                    onClick={async () => {
                      await checkSettingsStatus()
                      toast.info('Verifique o console para detalhes')
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    🔍 Verificar Status
                  </Button>
                  
                  <Button 
                    onClick={async () => {
                      try {
                        const { data: { user } } = await supabase.auth.getUser()
                        if (user) {
                          const response = await fetch(`/api/test-email`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              email: user.email,
                              name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário'
                            })
                          })
                          
                          if (response.ok) {
                            const result = await response.json()
                            toast.success(result.message)
                            console.log('✅ Teste de email:', result)
                          } else {
                            const error = await response.json()
                            toast.error(`Erro: ${error.error}`)
                            console.error('❌ Erro no teste:', error)
                          }
                        }
                      } catch (error) {
                        console.error('Erro ao enviar relatório de teste:', error)
                        toast.error('Erro ao enviar relatório de teste')
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    📧 Enviar Relatório de Teste
                  </Button>
                  
                  <Button 
                    onClick={async () => {
                      try {
                        const { data: { user } } = await supabase.auth.getUser()
                        if (user) {
                          const response = await fetch(`/api/test-scheduled-email`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              userId: user.id,
                              settings: settings
                            })
                          })
                          
                          if (response.ok) {
                            const result = await response.json()
                            toast.success(result.message)
                            console.log('✅ Teste de agendamento:', result)
                          } else {
                            const error = await response.json()
                            toast.error(`Erro: ${error.error}`)
                            console.error('❌ Erro no agendamento:', error)
                          }
                        }
                      } catch (error) {
                        console.error('Erro ao testar agendamento:', error)
                        toast.error('Erro ao testar agendamento')
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    📅 Testar Agendamento
                  </Button>
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