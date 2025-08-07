-- =====================================================
-- CRIAR TABELA DE NOTAS DOS USUÁRIOS
-- =====================================================

-- 1. CRIAR TABELA user_notes
CREATE TABLE IF NOT EXISTS user_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Nova Nota',
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_updated_at ON user_notes(updated_at DESC);

-- 3. CRIAR TRIGGER PARA ATUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_user_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_notes_updated_at
  BEFORE UPDATE ON user_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_user_notes_updated_at();

-- 4. CRIAR POLÍTICAS RLS (Row Level Security)
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias notas
CREATE POLICY "Users can view their own notes" ON user_notes
  FOR SELECT USING (auth.uid() = user_id);

-- Política para usuários criarem suas próprias notas
CREATE POLICY "Users can create their own notes" ON user_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem suas próprias notas
CREATE POLICY "Users can update their own notes" ON user_notes
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para usuários deletarem suas próprias notas
CREATE POLICY "Users can delete their own notes" ON user_notes
  FOR DELETE USING (auth.uid() = user_id);

-- 5. VERIFICAR SE A TABELA FOI CRIADA
SELECT 
  'Tabela user_notes criada:' as info,
  COUNT(*) as colunas
FROM information_schema.columns 
WHERE table_name = 'user_notes';

-- 6. VERIFICAR POLÍTICAS RLS
SELECT 
  'Políticas RLS criadas:' as info,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'user_notes'; 