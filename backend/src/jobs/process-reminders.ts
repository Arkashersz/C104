// src/jobs/process-reminders.ts
import cron from 'node-cron'
import { supabase } from '../config/supabase'
import { emailService } from '../services/email'
import { logger } from '../utils/logger'

// Tipos para os dados
interface GroupUser {
  user: {
    id: string
    email: string
    name: string
  }
}

interface Process {
  id: string
  process_number: string
  title: string
  type: string
  status: string
  group_id: string
  end_date: string | null
  opening_date: string | null
  created_at: string
  notification_days: number[] | null
}

// Função para enviar relatório diário de processos pendentes por grupo
async function sendDailyGroupReports() {
  logger.info('📊 Iniciando envio de relatórios diários por grupo')

  try {
    // Buscar todos os grupos
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('*')

    if (groupsError) throw groupsError

    for (const group of groups || []) {
      // Buscar usuários do grupo
      const { data: groupUsers, error: usersError } = await supabase
        .from('user_groups')
        .select(`
          user:users!user_id(
            id,
            email,
            name
          )
        `)
        .eq('group_id', group.id)

      if (usersError) {
        logger.error(`Erro ao buscar usuários do grupo ${group.name}:`, usersError)
        continue
      }

      // Buscar processos pendentes do grupo (não finalizados)
      const { data: pendingProcesses, error: processesError } = await supabase
        .from('sei_processes')
        .select('*')
        .eq('group_id', group.id)
        .neq('status', 'finalizado')
        .order('created_at', { ascending: false })

      if (processesError) {
        logger.error(`Erro ao buscar processos do grupo ${group.name}:`, processesError)
        continue
      }

      // Calcular dias de espera para cada processo
      const today = new Date()
      const processesWithDays = (pendingProcesses || []).map((process: Process) => {
        const processDate = process.created_at ? new Date(process.created_at) : today
        const daysWaiting = Math.ceil((today.getTime() - processDate.getTime()) / (1000 * 60 * 60 * 24))
        
        return {
          processNumber: process.process_number,
          title: process.title,
          type: process.type,
          status: process.status,
          daysWaiting: Math.max(0, daysWaiting)
        }
      })

      // Enviar relatório para cada usuário do grupo
      for (const groupUser of (groupUsers || []) as any[]) {
        if (groupUser.user && processesWithDays.length > 0) {
          try {
            await emailService.sendDailyProcessReport({
              to: groupUser.user.email,
              recipientName: groupUser.user.name,
              groupName: group.name,
              processes: processesWithDays
            })
            logger.info(`📊 Relatório diário enviado para ${groupUser.user.email} (Grupo: ${group.name})`)
          } catch (emailError) {
            logger.error(`Erro ao enviar relatório para ${groupUser.user.email}:`, emailError)
          }
        }
      }
    }
  } catch (err) {
    logger.error('Erro ao enviar relatórios diários:', err)
  }
}

// Função para enviar lembretes de processos específicos
async function sendProcessReminders() {
  logger.info('🔔 Iniciando verificação de processos para lembretes específicos')

  try {
    const today = new Date()

    // Buscar processos que precisam de notificação específica
    const { data: processes, error } = await supabase
      .from('sei_processes')
      .select(`
        *,
        group:groups!group_id(
          id,
          name
        )
      `)
      .not('group_id', 'is', null)
      .neq('status', 'finalizado')

    if (error) throw error

    for (const process of (processes || []) as Process[]) {
      // Verifica se há datas relevantes e notification_days
      const notificationDays = process.notification_days || [1, 7, 15, 30]
      let targetDate: Date | null = null
      let daysUntilTarget: number | null = null
      
      if (process.end_date) {
        const endDate = new Date(process.end_date)
        daysUntilTarget = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        targetDate = endDate
      } else if (process.opening_date) {
        const openingDate = new Date(process.opening_date)
        daysUntilTarget = Math.ceil((openingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        targetDate = openingDate
      }

      // Se há uma data alvo e está nos dias de notificação
      if (targetDate && daysUntilTarget !== null && notificationDays.includes(Math.abs(daysUntilTarget))) {
        // Buscar usuários do grupo para enviar notificação
        const { data: groupUsers, error: usersError } = await supabase
          .from('user_groups')
          .select(`
            user:users!user_id(
              id,
              email,
              name
            )
          `)
          .eq('group_id', process.group_id)

        if (!usersError && groupUsers) {
          for (const groupUser of (groupUsers || []) as any[]) {
            if (groupUser.user) {
              try {
                await emailService.sendProcessReminderNotification({
                  to: groupUser.user.email,
                  processNumber: process.process_number,
                  processTitle: process.title,
                  statusName: process.status,
                  recipientName: groupUser.user.name,
                  daysWaiting: Math.abs(daysUntilTarget!),
                })
                logger.info(`📧 Lembrete específico enviado para processo ${process.process_number} (${process.title}) para ${groupUser.user.email}`)
              } catch (emailError) {
                logger.error(`Erro ao enviar lembrete para ${groupUser.user.email}:`, emailError)
              }
            }
          }
        }
      }
    }
  } catch (err) {
    logger.error('Erro ao enviar lembretes de processos:', err)
  }
}

// Executa diariamente às 9h - Relatório diário
cron.schedule('0 9 * * *', async () => {
  logger.info('🕘 Iniciando rotina diária de notificações')
  await sendDailyGroupReports()
  await sendProcessReminders()
})

// Executa também às 14h para reforço - Apenas relatório diário
cron.schedule('0 14 * * *', async () => {
  logger.info('🕑 Iniciando reforço de relatórios diários')
  await sendDailyGroupReports()
})

logger.info('📅 Jobs de notificação de processos configurados')