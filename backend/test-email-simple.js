// Script para testar email diretamente
// Execute: node test-email-simple.js

const nodemailer = require('nodemailer');

// Configuração do Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'knowenter@gmail.com',
    pass: 'yysa bwbd lpyw xspo'
  },
});

async function testEmail() {
  try {
    console.log('🧪 Testando envio de email...');
    
    const mailOptions = {
      from: 'knowenter@gmail.com',
      to: 'knowenter@gmail.com',
      subject: '🧪 Teste de Email - Sistema SEI',
      html: `
        <h2>Teste de Email</h2>
        <p>Este é um teste direto do sistema de notificações.</p>
        <p>Data: ${new Date().toLocaleString('pt-BR')}</p>
        <p>Se você recebeu este email, o sistema está funcionando!</p>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado com sucesso!');
    console.log('Message ID:', result.messageId);
    
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
  }
}

testEmail(); 