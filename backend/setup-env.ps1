# Script para configurar o arquivo .env
Write-Host "🔧 Configurando arquivo .env para o sistema de emails" -ForegroundColor Green
Write-Host ""

# Verificar se o arquivo .env já existe
if (Test-Path ".env") {
    Write-Host "⚠️  Arquivo .env já existe. Deseja sobrescrever? (s/n)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -ne "s") {
        Write-Host "❌ Operação cancelada." -ForegroundColor Red
        exit
    }
}

Write-Host "📧 Configuração do Gmail SMTP:" -ForegroundColor Cyan
Write-Host ""

# Solicitar dados do Gmail
$gmailUser = Read-Host "Digite seu email Gmail (ex: seu@gmail.com)"
$gmailPassword = Read-Host "Digite a senha de app do Gmail (16 caracteres)" -AsSecureString
$gmailPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($gmailPassword))

Write-Host ""
Write-Host "🌐 Configuração do App:" -ForegroundColor Cyan
$appUrl = Read-Host "URL do app (deixe vazio para http://localhost:3000)"
if ([string]::IsNullOrEmpty($appUrl)) {
    $appUrl = "http://localhost:3000"
}

Write-Host ""
Write-Host "🔑 Configuração de Segurança:" -ForegroundColor Cyan
$jwtSecret = Read-Host "Chave JWT (deixe vazio para gerar automaticamente)"
if ([string]::IsNullOrEmpty($jwtSecret)) {
    $jwtSecret = "jwt-secret-" + [System.Guid]::NewGuid().ToString()
}

$cronSecret = Read-Host "Chave Cron (deixe vazio para gerar automaticamente)"
if ([string]::IsNullOrEmpty($cronSecret)) {
    $cronSecret = "cron-secret-" + [System.Guid]::NewGuid().ToString()
}

# Criar conteúdo do arquivo .env
$envContent = @"
# Supabase Configuration
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui

# Gmail SMTP Configuration (Email)
GMAIL_USER=$gmailUser
GMAIL_APP_PASSWORD=$gmailPasswordPlain

# App Configuration
APP_URL=$appUrl
APP_NAME=Sistema de Gestão de Contratos

# Security
JWT_SECRET=$jwtSecret
CRON_SECRET_KEY=$cronSecret

# Server
PORT=3001
NODE_ENV=development
"@

# Salvar arquivo .env
$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host ""
Write-Host "✅ Arquivo .env criado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "1. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env" -ForegroundColor White
Write-Host "2. Certifique-se de que a verificação em 2 etapas está ativa no Gmail" -ForegroundColor White
Write-Host "3. Use a senha de app do Gmail (não sua senha normal)" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Links úteis:" -ForegroundColor Cyan
Write-Host "- Verificação em 2 etapas: https://myaccount.google.com/security" -ForegroundColor White
Write-Host "- Senhas de app: https://myaccount.google.com/apppasswords" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Para testar, execute: npm run dev" -ForegroundColor Green 