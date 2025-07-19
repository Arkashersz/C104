// src/jobs/contract-notifications.ts
import cron from 'node-cron'
import { supabase } from '../config/supabase'
import { emailService } from '../services/email'
import { logger } from '../utils/logger'

// Executa diariamente às 9h
cron.schedule('0 9 * * *', async () => {
  logger.info('🔔 Iniciando verificação de contratos próximos ao vencimento')
  
  try {
    // Buscar contratos que precisam de notificação
    const today = new Date()
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select(`
        *,
        created_by:users(email, name)
      `)
      .eq('status', 'active')

    if (error) throw error

    for (const contract of contracts || []) {
      const endDate = new Date(contract.end_date)
      const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      // Verificar se deve enviar notificação
      if (contract.notification_days?.includes(daysUntilExpiry)) {
        await emailService.sendContractExpiryNotification({
          to: contract.created_by.email,
          contractNumber: contract.contract_number,
          contractTitle: contract.title,
          supplier: contract.supplier,
          expiryDate: contract.end_date,
          daysUntilExpiry,
          recipientName: contract.created_by.name,
        })

        // Registrar notificação no banco
        await supabase
          .from('notifications')
          .insert({
            type: 'contract_expiry',
            recipient_id: contract.created_by,
            title: `Contrato ${contract.contract_number} vence em ${daysUntilExpiry} dias`,
            message: `O contrato "${contract.title}" com ${contract.supplier} vencerá em ${daysUntilExpiry} dias.`,
            contract_id: contract.id,
            sent_at: new Date().toISOString(),
          })

        logger.info(`📧 Notificação enviada para contrato ${contract.contract_number}`)
      }
    }
  } catch (error) {
    logger.error('❌ Erro na verificação de contratos:', error)
  }
})