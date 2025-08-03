-- Script para adicionar campos read e viewed na tabela notifications
-- Execute este script no Supabase SQL Editor

-- Verificar se a tabela notifications existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        -- Criar tabela notifications se não existir
        CREATE TABLE notifications (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            process_number VARCHAR(50),
            group_name VARCHAR(100),
            status VARCHAR(20) DEFAULT 'pending',
            read BOOLEAN DEFAULT FALSE,
            viewed BOOLEAN DEFAULT FALSE,
            sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Criar índices
        CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
        CREATE INDEX idx_notifications_read ON notifications(read);
        CREATE INDEX idx_notifications_viewed ON notifications(viewed);
        CREATE INDEX idx_notifications_sent_at ON notifications(sent_at);
        
        -- Habilitar RLS
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
        
        -- Política RLS: usuários só podem ver suas próprias notificações
        CREATE POLICY "Users can view their own notifications" ON notifications
            FOR SELECT USING (auth.uid() = recipient_id);
        
        -- Política RLS: usuários só podem atualizar suas próprias notificações
        CREATE POLICY "Users can update their own notifications" ON notifications
            FOR UPDATE USING (auth.uid() = recipient_id);
        
        -- Política RLS: usuários só podem deletar suas próprias notificações
        CREATE POLICY "Users can delete their own notifications" ON notifications
            FOR DELETE USING (auth.uid() = recipient_id);
        
        -- Política RLS: sistema pode inserir notificações
        CREATE POLICY "System can insert notifications" ON notifications
            FOR INSERT WITH CHECK (true);
        
        RAISE NOTICE 'Tabela notifications criada com sucesso!';
    ELSE
        -- Adicionar campos se a tabela já existe
        BEGIN
            ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;
            RAISE NOTICE 'Campo read adicionado à tabela notifications';
        EXCEPTION
            WHEN duplicate_column THEN
                RAISE NOTICE 'Campo read já existe na tabela notifications';
        END;
        
        BEGIN
            ALTER TABLE notifications ADD COLUMN IF NOT EXISTS viewed BOOLEAN DEFAULT FALSE;
            RAISE NOTICE 'Campo viewed adicionado à tabela notifications';
        EXCEPTION
            WHEN duplicate_column THEN
                RAISE NOTICE 'Campo viewed já existe na tabela notifications';
        END;
        
        BEGIN
            ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Campo updated_at adicionado à tabela notifications';
        EXCEPTION
            WHEN duplicate_column THEN
                RAISE NOTICE 'Campo updated_at já existe na tabela notifications';
        END;
        
        -- Criar índices se não existirem
        CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
        CREATE INDEX IF NOT EXISTS idx_notifications_viewed ON notifications(viewed);
        
        RAISE NOTICE 'Campos read e viewed adicionados à tabela notifications existente!';
    END IF;
END $$;

-- Verificar estrutura da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position; 