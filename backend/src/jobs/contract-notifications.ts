// src/jobs/contract-notifications.ts
import cron from 'node-cron'
import { supabase } from '../config/supabase'
import { emailService } from '../services/email'
import { logger } from '../utils/logger'

// Executa diariamente às 9h
cron.schedule('0 9 * * *', async () => {
  logger.info('🔔 Iniciando verificação de processos para lembretes diários')

  try {
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)

    // Buscar processos que precisam de notificação
    const { data: processes, error } = await supabase
      .from('sei_processes')
      .select(`
        *,
        responsible:users!responsible_id(email, name)
      `)
      .not('responsible_id', 'is', null)

    if (error) throw error

    for (const process of processes || []) {
      // Verifica se há datas relevantes e notification_days
      const notificationDays = process.notification_days || [1]
      let targetDate = null
      let daysUntilTarget = null
      if (process.end_date) {
        const endDate = new Date(process.end_date)
        daysUntilTarget = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        targetDate = endDate
      } else if (process.opening_date) {
        const openingDate = new Date(process.opening_date)
        daysUntilTarget = Math.ceil((openingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        targetDate = openingDate
      }
      if (targetDate && notificationDays.includes(daysUntilTarget)) {
        await emailService.sendProcessReminderNotification({
          to: process.responsible.email,
          processNumber: process.process_number,
          processTitle: process.title,
          statusName: process.status,
          recipientName: process.responsible.name,
          daysWaiting: daysUntilTarget,
        })
        logger.info(`📧 Lembrete enviado para processo ${process.process_number} (${process.title}) para ${process.responsible.email}`)
      }
    }
  } catch (err) {
    logger.error('Erro ao enviar lembretes de processos:', err)
  }
})