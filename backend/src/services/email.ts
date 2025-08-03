// src/services/email.ts
import nodemailer from 'nodemailer'
import { config } from '../config/env'
import { logger } from '../utils/logger'

// Verificar se as configurações de email estão definidas
if (!config.GMAIL_USER || !config.GMAIL_APP_PASSWORD) {
  logger.error('❌ Configuração de email incompleta! Configure GMAIL_USER e GMAIL_APP_PASSWORD no arquivo .env')
}

// Configurar transporter do Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.GMAIL_USER,
    pass: config.GMAIL_APP_PASSWORD, // Senha de app do Gmail
  },
})

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

interface GroupAssignmentData {
  to: string
  processNumber: string
  processTitle: string
  groupName: string
  recipientName: string
}

interface DailyReportData {
  to: string
  recipientName: string
  groupName: string
  processes: Array<{
    processNumber: string
    title: string
    type: string
    status: string
    daysWaiting: number
  }>
}

class EmailService {
  private async sendEmail(to: string, subject: string, html: string) {
    try {
      // Verificar se as configurações estão definidas
      if (!config.GMAIL_USER || !config.GMAIL_APP_PASSWORD) {
        throw new Error('Configuração de email incompleta. Configure GMAIL_USER e GMAIL_APP_PASSWORD no arquivo .env')
      }

      await transporter.sendMail({
        from: config.GMAIL_USER,
        to,
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
    const subject = `🔔 Processo ${data.processNumber} aguarda sua ação (${data.daysWaiting} dias)`
    
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
          .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔔 Sistema de Processos SEI</h2>
          </div>
          <div class="content">
            <h3>Olá, ${data.recipientName}!</h3>
            <div class="urgent">
              <strong>⚠️ Atenção:</strong> Você foi definido como responsável pelo processo abaixo e ele aguarda sua ação!
            </div>
            <h4>Detalhes do Processo:</h4>
            <ul>
              <li><strong>Número:</strong> ${data.processNumber}</li>
              <li><strong>Título:</strong> ${data.processTitle}</li>
              <li><strong>Status Atual:</strong> ${data.statusName}</li>
              <li><strong>Aguardando há:</strong> ${data.daysWaiting} dias</li>
            </ul>
            <p>Por favor, acesse o sistema e tome as providências necessárias para dar continuidade ao processo.</p>
            <a href="${config.APP_URL}/processos" class="button">Acessar Processo</a>
          </div>
          <div class="footer">
            <p>Este é um e-mail automático. Não responda a esta mensagem.</p>
            <p>Sistema de Processos SEI - ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
    `

    await this.sendEmail(data.to, subject, html)
  }

  async sendGroupAssignmentNotification(data: GroupAssignmentData) {
    const subject = `📋 Processo ${data.processNumber} atribuído ao grupo ${data.groupName}`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #0f132e; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; }
          .footer { background: #fafafa; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #536d88; }
          .info { background: #dbeafe; border: 1px solid #93c5fd; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .button { background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📋 Sistema de Processos SEI</h2>
          </div>
          <div class="content">
            <h3>Olá, ${data.recipientName}!</h3>
            <div class="info">
              <strong>📋 Novo processo atribuído:</strong> Um processo foi atribuído ao seu grupo e requer atenção!
            </div>
            <h4>Detalhes do Processo:</h4>
            <ul>
              <li><strong>Número:</strong> ${data.processNumber}</li>
              <li><strong>Título:</strong> ${data.processTitle}</li>
              <li><strong>Grupo Responsável:</strong> ${data.groupName}</li>
              <li><strong>Data de Atribuição:</strong> ${new Date().toLocaleDateString('pt-BR')}</li>
            </ul>
            <p>Como membro do grupo ${data.groupName}, você receberá lembretes diários sobre este processo até que ele seja finalizado.</p>
            <a href="${config.APP_URL}/processos" class="button">Acessar Processo</a>
          </div>
          <div class="footer">
            <p>Este é um e-mail automático. Não responda a esta mensagem.</p>
            <p>Sistema de Processos SEI - ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
    `

    await this.sendEmail(data.to, subject, html)
  }

  async sendDailyProcessReport(data: DailyReportData) {
    const subject = `📊 Relatório Diário - ${data.groupName} - ${data.processes.length} processos pendentes`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #0f132e; }
          .container { max-width: 700px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; }
          .footer { background: #fafafa; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #536d88; }
          .summary { background: #f0f9ff; border: 1px solid #0ea5e9; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          .table th { background: #f8fafc; font-weight: bold; }
          .urgent { background: #fef2f2; color: #dc2626; }
          .warning { background: #fffbeb; color: #d97706; }
          .normal { background: #f0fdf4; color: #059669; }
          .button { background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📊 Relatório Diário de Processos</h2>
          </div>
          <div class="content">
            <h3>Olá, ${data.recipientName}!</h3>
            <div class="summary">
              <strong>📋 Resumo do Grupo ${data.groupName}:</strong><br>
              • Total de processos pendentes: <strong>${data.processes.length}</strong><br>
              • Data do relatório: <strong>${new Date().toLocaleDateString('pt-BR')}</strong>
            </div>
            
            <h4>📋 Processos Pendentes:</h4>
            <table class="table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Dias Aguardando</th>
                </tr>
              </thead>
              <tbody>
                ${data.processes.map(process => {
                  const urgencyClass = process.daysWaiting > 30 ? 'urgent' : 
                                     process.daysWaiting > 15 ? 'warning' : 'normal'
                  return `
                    <tr class="${urgencyClass}">
                      <td><strong>${process.processNumber}</strong></td>
                      <td>${process.title}</td>
                      <td>${process.type}</td>
                      <td>${process.status}</td>
                      <td><strong>${process.daysWaiting} dias</strong></td>
                    </tr>
                  `
                }).join('')}
              </tbody>
            </table>
            
            <p><strong>💡 Dica:</strong> Processos destacados em vermelho estão aguardando há mais de 30 dias e requerem atenção imediata.</p>
            
            <a href="${config.APP_URL}/processos" class="button">Acessar Sistema</a>
          </div>
          <div class="footer">
            <p>Este é um e-mail automático. Não responda a esta mensagem.</p>
            <p>Sistema de Processos SEI - ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
    `

    await this.sendEmail(data.to, subject, html)
  }
}

export const emailService = new EmailService()

// Função simples para testes
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  try {
    // Verificar se as configurações estão definidas
    if (!config.GMAIL_USER || !config.GMAIL_APP_PASSWORD) {
      logger.warn('⚠️ Configuração de email incompleta. Simulando envio...')
      logger.info(`📧 [SIMULAÇÃO] E-mail enviado para: ${to}`)
      logger.info(`📧 [SIMULAÇÃO] Assunto: ${subject}`)
      return
    }

    await transporter.sendMail({
      from: config.GMAIL_USER,
      to,
      subject,
      html,
    })
    logger.info(`📧 E-mail enviado para: ${to}`)
  } catch (error) {
    logger.error(`❌ Erro ao enviar e-mail para ${to}:`, error)
    throw error
  }
}