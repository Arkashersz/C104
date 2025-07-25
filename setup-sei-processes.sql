-- Script para criar a tabela sei_processes
-- Execute este script no Supabase SQL Editor

-- Criar tabela sei_processes
CREATE TABLE IF NOT EXISTS sei_processes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  process_number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('contrato', 'licitacao', 'dispensa', 'outro')),
  title TEXT NOT NULL,
  description TEXT,
  supplier TEXT,
  value DECIMAL(15,2),
  start_date DATE,
  end_date DATE,
  estimated_value DECIMAL(15,2),
  opening_date DATE,
  status TEXT NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'finalizado', 'cancelado')),
  notification_days INTEGER[] DEFAULT ARRAY[90, 60, 30, 15, 7],
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_sei_processes_process_number ON sei_processes(process_number);
CREATE INDEX IF NOT EXISTS idx_sei_processes_type ON sei_processes(type);
CREATE INDEX IF NOT EXISTS idx_sei_processes_status ON sei_processes(status);
CREATE INDEX IF NOT EXISTS idx_sei_processes_group_id ON sei_processes(group_id);
CREATE INDEX IF NOT EXISTS idx_sei_processes_created_by ON sei_processes(created_by);
CREATE INDEX IF NOT EXISTS idx_sei_processes_created_at ON sei_processes(created_at);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sei_processes_updated_at 
    BEFORE UPDATE ON sei_processes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Criar tabela de logs para auditoria
CREATE TABLE IF NOT EXISTS sei_process_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  process_id UUID NOT NULL REFERENCES sei_processes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para logs
CREATE INDEX IF NOT EXISTS idx_sei_process_logs_process_id ON sei_process_logs(process_id);
CREATE INDEX IF NOT EXISTS idx_sei_process_logs_created_at ON sei_process_logs(created_at);

-- Inserir alguns dados de exemplo
INSERT INTO sei_processes (process_number, type, title, description, supplier, value, start_date, end_date, status, group_id) VALUES
('SEI-2024-001', 'contrato', 'Contrato de Fornecimento de Material de Escritório', 'Fornecimento de material de escritório para o ano de 2024', 'Papelaria Central Ltda', 50000.00, '2024-01-01', '2024-12-31', 'em_andamento', NULL),
('SEI-2024-002', 'licitacao', 'Licitação para Aquisição de Equipamentos de Informática', 'Aquisição de computadores, impressoras e equipamentos de rede', NULL, NULL, NULL, NULL, 'em_andamento', NULL),
('SEI-2024-003', 'dispensa', 'Dispensa de Licitação para Serviços de Limpeza', 'Contratação de empresa para serviços de limpeza e conservação', 'Limpeza Express Ltda', 25000.00, '2024-02-01', '2024-07-31', 'finalizado', NULL)
ON CONFLICT (process_number) DO NOTHING;

-- Verificar se a tabela foi criada corretamente
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'sei_processes' 
ORDER BY ordinal_position; 