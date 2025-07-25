'use client'
import { useEffect, useState } from 'react'
import { SEIProcess } from '@/types/shared'
import { useGroups } from '@/lib/hooks/use-groups'
import { useSEIProcesses } from '@/lib/hooks/use-sei-processes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
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
    delete prepared.created_by
    delete prepared.group
    
    return prepared
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    
    try {
      // Validar formulário
      const validation = validateForm()
      if (!validation.isValid) {
        setFormError(validation.errors.join(', '))
        return
      }
      
      const preparedData = prepareData()
      
      if (form.id) {
        // Atualizar processo existente
        const result = await updateProcess(form.id, preparedData)
        if (result) {
          console.log('Processo atualizado com sucesso:', result)
          onSuccess()
        } else {
          setFormError('Erro ao atualizar processo')
        }
      } else {
        // Criar novo processo
        const result = await createProcess(preparedData as Omit<SEIProcess, 'id'>)
        if (result) {
          console.log('Processo criado com sucesso:', result)
          onSuccess()
        } else {
          setFormError('Erro ao criar processo')
        }
      }
    } catch (err) {
      console.error('Erro no formulário:', err)
      setFormError(err instanceof Error ? err.message : 'Erro desconhecido')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {(formError || error) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {formError || error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">Número do Processo *</label>
          <Input 
            value={form.process_number || ''} 
            onChange={e => updateField('process_number', e.target.value)} 
            required 
            placeholder="Ex: SEI-2024-001"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Tipo *</label>
          <Select 
            value={form.type || ''} 
            onChange={e => updateField('type', e.target.value)} 
            required
          >
            <option value="">Selecione</option>
            <option value="contrato">Contrato</option>
            <option value="licitacao">Licitação</option>
            <option value="dispensa">Dispensa</option>
            <option value="outro">Outro</option>
          </Select>
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Título *</label>
          <Input 
            value={form.title || ''} 
            onChange={e => updateField('title', e.target.value)} 
            required 
            placeholder="Título do processo"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Descrição</label>
          <Textarea 
            value={form.description || ''} 
            onChange={e => updateField('description', e.target.value)} 
            rows={3} 
            placeholder="Descrição detalhada do processo"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Grupo Responsável *</label>
          <Select 
            value={form.group_id || ''} 
            onChange={e => updateField('group_id', e.target.value)} 
            required
          >
            <option value="">Selecione um grupo</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Status *</label>
          <Select 
            value={form.status || ''} 
            onChange={e => updateField('status', e.target.value)} 
            required
          >
            <option value="">Selecione</option>
            <option value="em_andamento">Em andamento</option>
            <option value="finalizado">Finalizado</option>
            <option value="cancelado">Cancelado</option>
          </Select>
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
