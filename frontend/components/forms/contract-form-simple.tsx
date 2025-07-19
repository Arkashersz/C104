// components/forms/contract-form-simple.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { generateContractNumber } from '@/lib/utils'

// Componente Textarea inline
const Textarea = ({ 
  className, 
  error, 
  ...props 
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) => (
  <div className="w-full">
    <textarea
      className={`flex min-h-[80px] w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus:ring-2 focus:ring-primary-light focus:ring-offset-2 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${
        error ? 'border-red-500 focus:ring-red-500' : ''
      } ${className || ''}`}
      {...props}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
)

// Hook de toast inline
const useToast = () => {
  const toast = {
    success: (title: string, message?: string) => {
      console.log('SUCCESS:', title, message)
      alert(`✅ ${title}${message ? `\n${message}` : ''}`)
    },
    error: (title: string, message?: string) => {
      console.error('ERROR:', title, message)
      alert(`❌ ${title}${message ? `\n${message}` : ''}`)
    }
  }
  return { toast }
}

// Tipo simples para o formulário
interface ContractFormData {
  title: string
  description: string
  contract_number: string
  supplier: string
  value: number
  start_date: string
  end_date: string
  notification_days: number[]
}

interface ContractFormProps {
  onSuccess?: () => void
  initialData?: Partial<ContractFormData>
  mode?: 'create' | 'edit'
  contractId?: string
}

export function ContractFormSimple({ 
  onSuccess, 
  initialData, 
  mode = 'create',
  contractId 
}: ContractFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()
  const supabase = createClient()

  // Estado do formulário
  const [formData, setFormData] = useState<ContractFormData>({
    contract_number: initialData?.contract_number || generateContractNumber(),
    title: initialData?.title || '',
    description: initialData?.description || '',
    supplier: initialData?.supplier || '',
    value: initialData?.value || 0,
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || '',
    notification_days: initialData?.notification_days || [90, 60, 30, 15, 7],
  })

  // Função de validação
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) newErrors.title = 'Título é obrigatório'
    if (!formData.contract_number.trim()) newErrors.contract_number = 'Número do contrato é obrigatório'
    if (!formData.supplier.trim()) newErrors.supplier = 'Fornecedor é obrigatório'
    if (formData.value <= 0) newErrors.value = 'Valor deve ser positivo'
    if (!formData.start_date) newErrors.start_date = 'Data de início é obrigatória'
    if (!formData.end_date) newErrors.end_date = 'Data de término é obrigatória'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Função de submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Erro de validação', 'Por favor, corrija os campos destacados')
      return
    }

    setIsLoading(true)
    
    try {
      const { data: user } = await supabase.auth.getUser()
      
      if (!user.user) {
        throw new Error('Usuário não autenticado')
      }

      if (mode === 'create') {
        const { error } = await supabase
          .from('contracts')
          .insert([{
            ...formData,
            created_by: user.user.id,
          }])

        if (error) throw error

        toast.success(
          'Contrato criado com sucesso!',
          `Contrato ${formData.contract_number} foi cadastrado no sistema.`
        )
      } else if (contractId) {
        const { error } = await supabase
          .from('contracts')
          .update(formData)
          .eq('id', contractId)

        if (error) throw error

        toast.success(
          'Contrato atualizado com sucesso!',
          `As alterações do contrato ${formData.contract_number} foram salvas.`
        )
      }

      // Reset form
      setFormData({
        contract_number: generateContractNumber(),
        title: '',
        description: '',
        supplier: '',
        value: 0,
        start_date: '',
        end_date: '',
        notification_days: [90, 60, 30, 15, 7],
      })
      setErrors({})
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao salvar contrato:', error)
      toast.error(
        'Erro ao salvar contrato',
        error instanceof Error ? error.message : 'Ocorreu um erro inesperado'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Função para atualizar campo
  const updateField = (field: keyof ContractFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpar erro do campo quando ele for editado
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Função para gerenciar notification_days
  const handleNotificationDaysChange = (days: number, checked: boolean) => {
    const currentDays = formData.notification_days
    if (checked) {
      updateField('notification_days', [...currentDays, days].sort((a, b) => b - a))
    } else {
      updateField('notification_days', currentDays.filter(d => d !== days))
    }
  }

  const generateNewContractNumber = () => {
    updateField('contract_number', generateContractNumber())
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary-dark">
          {mode === 'create' ? 'Novo Contrato' : 'Editar Contrato'}
        </h2>
        {mode === 'create' && (
          <Button 
            type="button" 
            variant="ghost" 
            onClick={generateNewContractNumber}
            className="text-sm"
          >
            🎲 Gerar Número
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número do Contrato *
            </label>
            <Input
              value={formData.contract_number}
              onChange={(e) => updateField('contract_number', e.target.value)}
              placeholder="CTR-2025-001"
              error={errors.contract_number}
              disabled={mode === 'edit'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fornecedor *
            </label>
            <Input
              value={formData.supplier}
              onChange={(e) => updateField('supplier', e.target.value)}
              placeholder="Nome do fornecedor"
              error={errors.supplier}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título do Contrato *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Título do contrato"
              error={errors.title}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Descrição detalhada do contrato"
              rows={3}
              error={errors.description}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor (R$) *
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.value}
              onChange={(e) => updateField('value', parseFloat(e.target.value) || 0)}
              placeholder="0,00"
              error={errors.value}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Início *
            </label>
            <Input
              type="date"
              value={formData.start_date}
              onChange={(e) => updateField('start_date', e.target.value)}
              error={errors.start_date}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Término *
            </label>
            <Input
              type="date"
              value={formData.end_date}
              onChange={(e) => updateField('end_date', e.target.value)}
              error={errors.end_date}
            />
          </div>
        </div>

        {/* Seção de alertas */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            ⚠️ Alertas de Vencimento
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Selecione quantos dias antes do vencimento você deseja receber notificações por e-mail:
          </p>
          <div className="flex flex-wrap gap-3">
            {[90, 60, 30, 15, 7, 1].map((days) => (
              <label key={days} className="flex items-center space-x-2 bg-white px-3 py-2 rounded border hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notification_days.includes(days)}
                  onChange={(e) => handleNotificationDaysChange(days, e.target.checked)}
                  className="rounded border-gray-300 text-primary-medium focus:ring-primary-medium"
                />
                <span className="text-sm font-medium">{days} dias</span>
              </label>
            ))}
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => {
              setFormData({
                contract_number: generateContractNumber(),
                title: '',
                description: '',
                supplier: '',
                value: 0,
                start_date: '',
                end_date: '',
                notification_days: [90, 60, 30, 15, 7],
              })
              setErrors({})
              onSuccess?.()
            }}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                💾 {mode === 'create' ? 'Criar Contrato' : 'Salvar Alterações'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}