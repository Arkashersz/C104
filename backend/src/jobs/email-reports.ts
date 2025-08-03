import cron from 'node-cron'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '../services/email'
import { logger } from '../utils/logger'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface UserNotificationSettings {
  user_id: string
  email_frequency: 'daily' | 'weekly' | 'monthly'
  daily_time?: string
  weekly_day?: string
  weekly_time?: string
  monthly_day?: number
  monthly_time?: string
  report_processes_near_expiry: boolean
  report_group_processes: boolean
  report_expiry_days: number
}

interface Process {
  id: string
  process_number: string
  title: string
  description: string
  status: string
  end_date: string
  created_at: string
  groups?: {
    name: string
  }
}

interface UserGroup {
  group_id: string
  group_name: string
}

// Função para buscar configurações dos usuários
async function getUserNotificationSettings(): Promise<UserNotificationSettings[]> {
  try {
    // Buscar todos os usuários
    const { data: users } = await supabase
      .from('users')
      .select('id, email, name')

    if (!users) return []

    const settings: UserNotificationSettings[] = []
    
    for (const user of users) {
      try {
        // Buscar configurações do cache/banco
        if (global.userSettings && global.userSettings.has(user.id)) {
          const userSettings = global.userSettings.get(user.id)
          settings.push({
            user_id: user.id,
            email_frequency: userSettings.email_frequency || 'daily',
            daily_time: userSettings.daily_time || '09:00',
            weekly_day: userSettings.weekly_day || 'monday',
            weekly_time: userSettings.weekly_time || '09:00',
            monthly_day: userSettings.monthly_day || 1,
            monthly_time: userSettings.monthly_time || '09:00',
            report_processes_near_expiry: userSettings.report_processes_near_expiry ?? true,
            report_group_processes: userSettings.report_group_processes ?? true,
            report_expiry_days: userSettings.report_expiry_days || 7
          })
          logger.info(`Configurações encontradas para usuário ${user.id}: ${userSettings.email_frequency} às ${userSettings.daily_time || userSettings.weekly_time || userSettings.monthly_time}`)
        } else {
          // Usar configurações padrão se não encontradas
          settings.push({
            user_id: user.id,
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
          logger.info(`Usando configurações padrão para usuário ${user.id}`)
        }
      } catch (error) {
        logger.error(`Erro ao buscar configurações do usuário ${user.id}:`, error)
        // Usar configurações padrão em caso de erro
        settings.push({
          user_id: user.id,
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

    return settings
  } catch (error) {
    logger.error('Erro ao buscar configurações de notificação:', error)
    return []
  }
}

// Função para buscar processos próximos do vencimento
async function getProcessesNearExpiry(daysBeforeExpiry: number): Promise<Process[]> {
  try {
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + daysBeforeExpiry)

    const { data: processes } = await supabase
      .from('sei_processes')
      .select(`
        id,
        process_number,
        title,
        description,
        status,
        end_date,
        created_at,
        groups (
          name
        )
      `)
      .not('end_date', 'is', null)
      .lte('end_date', expiryDate.toISOString())
      .gte('end_date', new Date().toISOString())
      .order('end_date', { ascending: true })

    logger.info(`Encontrados ${processes?.length || 0} processos próximos do vencimento`)
    return processes || []
  } catch (error) {
    logger.error('Erro ao buscar processos próximos do vencimento:', error)
    return []
  }
}

// Função para buscar processos de um grupo específico
async function getGroupProcesses(groupName: string): Promise<Process[]> {
  try {
    const { data: processes } = await supabase
      .from('sei_processes')
      .select(`
        id,
        process_number,
        title,
        description,
        status,
        end_date,
        created_at,
        groups (
          name
        )
      `)
      .eq('groups.name', groupName)
      .order('created_at', { ascending: false })

    logger.info(`Encontrados ${processes?.length || 0} processos para o grupo ${groupName}`)
    return processes || []
  } catch (error) {
    logger.error('Erro ao buscar processos do grupo:', error)
    return []
  }
}

// Função para buscar grupos de um usuário
async function getUserGroups(userId: string): Promise<UserGroup[]> {
  try {
    const { data: userGroups } = await supabase
      .from('user_groups')
      .select(`
        group_id,
        groups (
          name
        )
      `)
      .eq('user_id', userId)

    if (!userGroups) return []

    const groups = userGroups.map((ug: any) => ({
      group_id: ug.group_id,
      group_name: ug.groups?.name || 'Grupo Desconhecido'
    }))

    logger.info(`Usuário ${userId} pertence aos grupos: ${groups.map(g => g.group_name).join(', ')}`)
    return groups
  } catch (error) {
    logger.error('Erro ao buscar grupos do usuário:', error)
    return []
  }
}

// Função para gerar relatório de processos próximos do vencimento
function generateExpiryReport(processes: Process[]): string {
  if (processes.length === 0) {
    return '<p>Nenhum processo próximo do vencimento encontrado.</p>'
  }

  let html = '<h3>📅 Processos Próximos do Vencimento</h3>'
  html += '<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">'
  html += '<thead><tr style="background-color: #f3f4f6;">'
  html += '<th style="padding: 8px; border: 1px solid #d1d5db; text-align: left;">Número</th>'
  html += '<th style="padding: 8px; border: 1px solid #d1d5db; text-align: left;">Título</th>'
  html += '<th style="padding: 8px; border: 1px solid #d1d5db; text-align: left;">Status</th>'
  html += '<th style="padding: 8px; border: 1px solid #d1d5db; text-align: left;">Vencimento</th>'
  html += '<th style="padding: 8px; border: 1px solid #d1d5db; text-align: left;">Grupo</th>'
  html += '</tr></thead><tbody>'

  processes.forEach(process => {
    const expiryDate = new Date(process.end_date)
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    
    html += '<tr>'
    html += `<td style="padding: 8px; border: 1px solid #d1d5db;">${process.process_number}</td>`
    html += `<td style="padding: 8px; border: 1px solid #d1d5db;">${process.title}</td>`
    html += `<td style="padding: 8px; border: 1px solid #d1d5db;">${process.status}</td>`
    html += `<td style="padding: 8px; border: 1px solid #d1d5db; color: ${daysUntilExpiry <= 3 ? '#dc2626' : '#059669'};">${expiryDate.toLocaleDateString('pt-BR')} (${daysUntilExpiry} dias)</td>`
    html += `<td style="padding: 8px; border: 1px solid #d1d5db;">${process.groups?.name || '-'}</td>`
    html += '</tr>'
  })

  html += '</tbody></table>'
  return html
}

// Função para gerar relatório de processos do grupo
function generateGroupReport(processes: Process[], groupName: string): string {
  if (processes.length === 0) {
    return `<p>Nenhum processo encontrado para o grupo <strong>${groupName}</strong>.</p>`
  }

  let html = `<h3>👥 Processos do Grupo: ${groupName}</h3>`
  html += '<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">'
  html += '<thead><tr style="background-color: #f3f4f6;">'
  html += '<th style="padding: 8px; border: 1px solid #d1d5db; text-align: left;">Número</th>'
  html += '<th style="padding: 8px; border: 1px solid #d1d5db; text-align: left;">Título</th>'
  html += '<th style="padding: 8px; border: 1px solid #d1d5db; text-align: left;">Status</th>'
  html += '<th style="padding: 8px; border: 1px solid #d1d5db; text-align: left;">Vencimento</th>'
  html += '<th style="padding: 8px; border: 1px solid #d1d5db; text-align: left;">Criado em</th>'
  html += '</tr></thead><tbody>'

  processes.forEach(process => {
    const expiryDate = process.end_date ? new Date(process.end_date) : null
    const createdDate = new Date(process.created_at)
    
    html += '<tr>'
    html += `<td style="padding: 8px; border: 1px solid #d1d5db;">${process.process_number}</td>`
    html += `<td style="padding: 8px; border: 1px solid #d1d5db;">${process.title}</td>`
    html += `<td style="padding: 8px; border: 1px solid #d1d5db;">${process.status}</td>`
    html += `<td style="padding: 8px; border: 1px solid #d1d5db;">${expiryDate ? expiryDate.toLocaleDateString('pt-BR') : 'Não definido'}</td>`
    html += `<td style="padding: 8px; border: 1px solid #d1d5db;">${createdDate.toLocaleDateString('pt-BR')}</td>`
    html += '</tr>'
  })

  html += '</tbody></table>'
  return html
}

// Função para enviar relatório por email
async function sendReportEmail(userId: string, userEmail: string, userName: string, settings: UserNotificationSettings) {
  try {
    logger.info(`📧 Preparando relatório para ${userName} (${userEmail})`)
    logger.info(`⚙️ Configurações: ${JSON.stringify(settings)}`)

    let reportContent = `<h2>📊 Relatório de Processos</h2>`
    reportContent += `<p>Olá <strong>${userName}</strong>,</p>`
    reportContent += `<p>Aqui está seu relatório de processos:</p><br>`

    let hasContent = false

    // Relatório de processos próximos do vencimento
    if (settings.report_processes_near_expiry) {
      logger.info(`🔍 Buscando processos próximos do vencimento (${settings.report_expiry_days} dias)`)
      const expiryProcesses = await getProcessesNearExpiry(settings.report_expiry_days)
      logger.info(`📅 Encontrados ${expiryProcesses.length} processos próximos do vencimento`)
      
      const expiryReport = generateExpiryReport(expiryProcesses)
      reportContent += expiryReport
      reportContent += '<br>'
      
      if (expiryProcesses.length > 0) hasContent = true
    }

    // Relatório de processos do grupo
    if (settings.report_group_processes) {
      logger.info(`👥 Buscando grupos do usuário ${userId}`)
      const userGroups = await getUserGroups(userId)
      logger.info(`👤 Usuário pertence a ${userGroups.length} grupos`)
      
      for (const group of userGroups) {
        logger.info(`🔍 Buscando processos do grupo: ${group.group_name}`)
        const groupProcesses = await getGroupProcesses(group.group_name)
        logger.info(`📋 Encontrados ${groupProcesses.length} processos para o grupo ${group.group_name}`)
        
        const groupReport = generateGroupReport(groupProcesses, group.group_name)
        reportContent += groupReport
        reportContent += '<br>'
        
        if (groupProcesses.length > 0) hasContent = true
      }
    }

    if (!hasContent) {
      reportContent += '<p><strong>Nenhum processo encontrado para este relatório.</strong></p><br>'
    }

    reportContent += `<p>Este relatório foi gerado automaticamente em ${new Date().toLocaleString('pt-BR')}.</p>`
    reportContent += `<p>Para alterar suas configurações de notificação, acesse a seção "Notificações" no sistema.</p>`

    logger.info(`📤 Enviando relatório para ${userEmail}`)
    await sendEmail({
      to: userEmail,
      subject: '📊 Relatório de Processos - C104',
      html: reportContent
    })

    logger.info(`✅ Relatório enviado com sucesso para ${userEmail}`)
  } catch (error) {
    logger.error(`❌ Erro ao enviar relatório para ${userEmail}:`, error)
  }
}

// Função para verificar se deve enviar relatório baseado na frequência
function shouldSendReport(settings: UserNotificationSettings): boolean {
  const now = new Date()
  const currentDay = now.getDay() // 0 = Domingo, 1 = Segunda, etc.
  const currentDate = now.getDate()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()

  switch (settings.email_frequency) {
    case 'daily':
      if (!settings.daily_time) return false
      const [dailyHour, dailyMinute] = settings.daily_time.split(':').map(Number)
      return currentHour === dailyHour && currentMinute === dailyMinute

    case 'weekly':
      if (!settings.weekly_day || !settings.weekly_time) return false
      const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const targetDay = weekDays.indexOf(settings.weekly_day)
      if (currentDay !== targetDay) return false
      
      const [weeklyHour, weeklyMinute] = settings.weekly_time.split(':').map(Number)
      return currentHour === weeklyHour && currentMinute === weeklyMinute

    case 'monthly':
      if (!settings.monthly_day || !settings.monthly_time) return false
      if (currentDate !== settings.monthly_day) return false
      
      const [monthlyHour, monthlyMinute] = settings.monthly_time.split(':').map(Number)
      return currentHour === monthlyHour && currentMinute === monthlyMinute

    default:
      return false
  }
}

// Job principal que roda a cada minuto
export function startEmailReportsJob() {
  cron.schedule('* * * * *', async () => {
    try {
      logger.info('🔄 Verificando relatórios para envio...')
      
      const settings = await getUserNotificationSettings()
      
      for (const setting of settings) {
        if (shouldSendReport(setting)) {
          // Buscar dados do usuário
          const { data: user } = await supabase
            .from('users')
            .select('email, name')
            .eq('id', setting.user_id)
            .single()

          if (user) {
            await sendReportEmail(setting.user_id, user.email, user.name, setting)
          }
        }
      }
    } catch (error) {
      logger.error('Erro no job de relatórios por email:', error)
    }
  })

  logger.info('✅ Job de relatórios por email iniciado')
} 