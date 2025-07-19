// src/services/email.ts
import sgMail from '@sendgrid/mail'
import { config } from '../config/env'
import { logger } from '../utils/logger'

sgMail.setApiKey(config.SENDGRID_API_KEY!)

interface ContractExpiryData {
  to: string
  contractNumber: string
  contractTitle: string
  supplier: string
  expiryDate: string
  daysUntilExpiry: number
  recipientName: string
}

interface ProcessReminderData {
  to: string
  processNumber: string
  processTitle: string
  statusName: string
  recipientName: string
  daysWaiting: number
}

class EmailService {
  private async sendEmail(to: string, subject: string, html: string) {
    try {
      await sgMail.send({
        to,
        from: config.FROM_EMAIL!,
        subject,
        html,
      })
      logger.info(`📧 E-mail enviado para: ${to}`)
    } catch (error) {
      logger.error(`❌ Erro ao enviar e-mail para ${to}:`, error)
      throw error
    }
  }

  async sendContractExpiryNotification(data: ContractExpiryData) {
    const subject = `⚠️ Contrato ${data.contractNumber} vence em ${data.daysUntilExpiry} dias`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #0f132e; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0f132e 0%, #19274e 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; }
          .footer { background: #fafafa; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #536d88; }
          .alert { background: #fef3cd; border: 1px solid #fecf47; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .button { background: #19274e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🏢 Sistema de Gestão de Contratos</h2>
          </div>
          <div class="content">
            <h3>Olá, ${data.recipientName}!</h3>
            
            <div class="alert">
              <strong>⚠️ Atenção:</strong> O contrato abaixo está próximo do vencimento!
            </div>
            
            <h4>Detalhes do Contrato:</h4>
            <ul>
              <li><strong>Número:</strong> ${data.contractNumber}</li>
              <li><strong>Título:</strong> ${data.contractTitle}</li>
              <li><strong>Fornecedor:</strong> ${data.supplier}</li>
              <li><strong>Data de Vencimento:</strong> ${new Date(data.expiryDate).toLocaleDateString('pt-BR')}</li>
              <li><strong>Dias restantes:</strong> ${data.daysUntilExpiry} dias</li>
            </ul>
            
            <p>É recomendado que você tome as providências necessárias para renovação ou substituição deste contrato.</p>
            
            <a href="${config.APP_URL}/contracts" class="button">Acessar Sistema</a>
          </div>
          <div class="footer">
            <p>Este é um e-mail automático. Não responda a esta mensagem.</p>
            <p>Sistema de Gestão de Contratos - ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
    `

    await this.sendEmail(data.to, subject, html)
  }

  async sendProcessReminderNotification(data: ProcessReminderData) {
    const subject = `📋 Processo ${data.processNumber} aguarda sua ação há ${data.daysWaiting} dias`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #0f132e; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #19274e 0%, #536d88 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; }
          .footer { background: #fafafa; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #536d88; }
          .urgent { background: #fee2e2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .button { background: #b49b85; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>⚖️ Sistema de Licitações</h2>
          </div>
          <div class="content">
            <h3>Olá, ${data.recipientName}!</h3>
            
            <div class="urgent">
              <strong>🔴 Ação Necessária:</strong> Existe um processo aguardando sua ação!
            </div>
            
            <h4>Detalhes do Processo:</h4>
            <ul>
              <li><strong>Número:</strong> ${data.processNumber}</li>
              <li><strong>Título:</strong> ${data.processTitle}</li>
              <li><strong>Status Atual:</strong> ${data.statusName}</li>
              <li><strong>Aguardando há:</strong> ${data.daysWaiting} dias</li>
            </ul>
            
            <p>Por favor, acesse o sistema e tome as providências necessárias para dar continuidade ao processo.</p>
            
            <a href="${config.APP_URL}/bidding" class="button">Acessar Processo</a>
          </div>
          <div class="footer">
            <p>Este é um e-mail automático. Não responda a esta mensagem.</p>
            <p>Sistema de Gestão de Contratos - ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
    `

    await this.sendEmail(data.to, subject, html)
  }
}

export const emailService = new EmailService()