'use client'
import { useEffect, useState } from 'react'
import { SEIProcess } from '@/types/shared'
import { useGroups } from '@/lib/hooks/use-groups'
import { useSEIProcesses } from '@/lib/hooks/use-sei-processes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface ProcessFormProps {
  initialData?: Partial<SEIProcess>
  onSuccess: () => void
  onCancel: () => void
}

export function ProcessForm({ initialData, onSuccess, onCancel }: ProcessFormProps) {
  const { fetchGroups } = useGroups()
  const { createProcess, updateProcess, loading, error } = useSEIProcesses()
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState<Partial<SEIProcess>>(initialData || {})
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => { 
    fetchGroups().then(setGroups) 
  }, [fetchGroups])

  function updateField(field: keyof SEIProcess, value: any) {
    setForm(f => ({ ...f, [field]: value }))
    setFormError(null) // Limpar erro quando usuário edita
  }

  // Função para validar dados antes do envio
  function validateForm(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!form.process_number?.trim()) {
      errors.push('Número do processo é obrigatório')
    }
    
    if (!form.type) {
      errors.push('Tipo é obrigatório')
    }
    
    if (!form.title?.trim()) {
      errors.push('Título é obrigatório')
    }
    
    if (!form.group_id) {
      errors.push('Grupo responsável é obrigatório')
    }
    
    if (!form.status) {
      errors.push('Status é obrigatório')
    }
    
    // Validar valores numéricos
    if (form.value && isNaN(Number(form.value))) {
      errors.push('Valor deve ser um número válido')
    }
    
    if (form.estimated_value && isNaN(Number(form.estimated_value))) {
      errors.push('Valor estimado deve ser um número válido')
    }
    
    // Validar datas
    if (form.start_date && form.end_date && new Date(form.start_date) > new Date(form.end_date)) {
      errors.push('Data de início não pode ser posterior à data de término')
    }
    
    return { isValid: errors.length === 0, errors }
  }

  // Função para preparar dados para envio
  function prepareData() {
    const prepared = { ...form }
    
    // Converter valores numéricos
    if (prepared.value !== undefined && prepared.value !== '') {
      prepared.value = Number(prepared.value)
    } else {
      delete prepared.value
    }
    
    if (prepared.estimated_value !== undefined && prepared.estimated_value !== '') {
      prepared.estimated_value = Number(prepared.estimated_value)
    } else {
      delete prepared.estimated_value
    }
    
    // Remover campos vazios
    Object.keys(prepared).forEach(key => {
      if (prepared[key] === '' || prepared[key] === undefined || prepared[key] === null) {
        delete prepared[key]
      }
    })
    
    // Remover campos que não devem ser enviados
    delete prepared.id
    delete prepared.created_at
    delete prepared.updated_at
    delete prepared.group
    
    return prepared
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const validation = validateForm()
    if (!validation.isValid) {
      setFormError(validation.errors.join(', '))
      return
    }
    
    try {
      const data = prepareData()
      console.log('📤 Dados preparados para envio:', data)
      
      if (form.id) {
        await updateProcess(form.id, data)
      } else {
        await createProcess(data)
      }
      
      onSuccess()
    } catch (err) {
      console.error('❌ Erro ao salvar processo:', err)
      setFormError('Erro ao salvar processo. Tente novamente.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold mb-4">
        {form.id ? 'Editar Processo' : 'Novo Processo'}
      </h2>
      
      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {formError}
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Número do Processo *</label>
          <Input 
            value={form.process_number || ''} 
            onChange={e => updateField('process_number', e.target.value)} 
            placeholder="Ex: 000007895-3/2025"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Tipo *</label>
          <select 
            value={form.type || ''} 
            onChange={e => updateField('type', e.target.value)} 
            required
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Selecione</option>
            <option value="contrato">Contrato</option>
            <option value="licitacao">Licitação</option>
            <option value="dispensa">Dispensa</option>
          </select>
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Título *</label>
          <Input 
            value={form.title || ''} 
            onChange={e => updateField('title', e.target.value)} 
            placeholder="Título do processo"
            required
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Descrição</label>
          <Textarea 
            value={form.description || ''} 
            onChange={e => updateField('description', e.target.value)} 
            placeholder="Descrição detalhada do processo"
            rows={3}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Grupo Responsável *</label>
          <select 
            value={form.group_id || ''} 
            onChange={e => updateField('group_id', e.target.value)} 
            required
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Selecione um grupo</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Status *</label>
          <select 
            value={form.status || ''} 
            onChange={e => updateField('status', e.target.value)} 
            required
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Selecione</option>
            <option value="em_andamento">Em andamento</option>
            <option value="finalizado">Finalizado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Fornecedor</label>
          <Input 
            value={form.supplier || ''} 
            onChange={e => updateField('supplier', e.target.value)} 
            placeholder="Nome do fornecedor"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Data de Início</label>
          <Input 
            type="date" 
            value={form.start_date || ''} 
            onChange={e => updateField('start_date', e.target.value)} 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Data de Término</label>
          <Input 
            type="date" 
            value={form.end_date || ''} 
            onChange={e => updateField('end_date', e.target.value)} 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Valor (R$)</label>
          <Input 
            type="number" 
            step="0.01" 
            value={form.value || ''} 
            onChange={e => updateField('value', e.target.value)} 
            placeholder="0,00"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Valor Estimado (R$)</label>
          <Input 
            type="number" 
            step="0.01" 
            value={form.estimated_value || ''} 
            onChange={e => updateField('estimated_value', e.target.value)} 
            placeholder="0,00"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Data de Abertura</label>
          <Input 
            type="date" 
            value={form.opening_date || ''} 
            onChange={e => updateField('opening_date', e.target.value)} 
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : (form.id ? 'Atualizar' : 'Criar')}
        </Button>
      </div>
    </form>
  )
}
