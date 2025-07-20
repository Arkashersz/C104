// components/forms/contract-form-simple.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { syncUserWithDatabase } from '@/lib/supabase/client'

// Componente Textarea inline
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

const Textarea = ({ className, error, ...props }: TextareaProps) => (
  <textarea
    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
      error ? 'border-red-500' : 'border-gray-300'
    } ${className}`}
    {...props}
  />
)

// Hook de toast inline
const useToast = () => {
  const showToast = (type: 'success' | 'error', title: string, message?: string) => {
    // Implementação simples de toast - você pode usar uma biblioteca como react-hot-toast
    console.log(`${type.toUpperCase()}: ${title}${message ? ` - ${message}` : ''}`)
  }

  return {
    success: (title: string, message?: string) => showToast('success', title, message),
    error: (title: string, message?: string) => showToast('error', title, message)
  }
}

// Tipo para os dados do formulário
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

export function ContractForm({
  onSuccess,
  initialData,
  mode = 'create',
}: ContractFormProps) {
  const [formData, setFormData] = useState<ContractFormData>({
    contract_number: generateContractNumber(),
    title: '',
    description: '',
    supplier: '',
    value: 0,
    start_date: '',
    end_date: '',
    notification_days: [90, 60, 30, 15, 7],
    ...initialData
  })
  const [errors, setErrors] = useState<Partial<Record<keyof ContractFormData, string>>>({})
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()
  const supabase = createClient()

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ContractFormData, string>> = {}

    if (!formData.title.trim()) newErrors.title = 'Título é obrigatório'
    if (!formData.contract_number.trim()) newErrors.contract_number = 'Processo SEI é obrigatório'
    if (!formData.supplier.trim()) newErrors.supplier = 'Fornecedor é obrigatório'
    if (formData.value <= 0) newErrors.value = 'Valor deve ser maior que zero'
    if (!formData.start_date) newErrors.start_date = 'Data de início é obrigatória'
    if (!formData.end_date) newErrors.end_date = 'Data de término é obrigatória'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Função de submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    try {
      // Sincronizar usuário com a tabela users
      const user = await syncUserWithDatabase()
      if (!user) {
        throw new Error('Usuário não autenticado. Faça o login para continuar.')
      }

      const contractData = {
        ...formData,
        created_by: user.id
      }

      const { data, error } = await supabase
        .from('contracts')
        .insert([contractData])
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar contrato:', error)
        
        // Tratar erro de conflito (processo SEI duplicado)
        if (error.code === '23505' || error.message.includes('duplicate')) {
          throw new Error('Já existe um contrato com este processo SEI. Tente gerar um novo número.')
        }
        
        throw new Error(error.message || 'Falha ao criar o contrato.')
      }

      toast.success(
        'Contrato criado com sucesso!',
        `Contrato ${formData.contract_number} foi cadastrado no sistema.`
      )

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
  const updateField = <K extends keyof ContractFormData>(field: K, value: ContractFormData[K]) => {
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
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-custom border">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-primary-dark">
          {mode === 'create' ? '📄 Novo Contrato' : '✏️ Editar Contrato'}
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

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Processo SEI *
            </label>
            <Input
              value={formData.contract_number}
              onChange={(e) => updateField('contract_number', e.target.value)}
              placeholder="Digite o número do processo SEI"
              error={errors.contract_number}
            />
            {errors.contract_number && (
              <p className="text-red-500 text-sm mt-1">{errors.contract_number}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Título *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Digite o título do contrato"
              error={errors.title}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Fornecedor *
            </label>
            <Input
              value={formData.supplier}
              onChange={(e) => updateField('supplier', e.target.value)}
              placeholder="Digite o nome do fornecedor"
              error={errors.supplier}
            />
            {errors.supplier && (
              <p className="text-red-500 text-sm mt-1">{errors.supplier}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Valor *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.value.toString()}
              onChange={(e) => updateField('value', parseFloat(e.target.value) || 0)}
              placeholder="0,00"
              error={errors.value}
            />
            {errors.value && (
              <p className="text-red-500 text-sm mt-1">{errors.value}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Data de Início *
            </label>
            <Input
              type="date"
              value={formData.start_date}
              onChange={(e) => updateField('start_date', e.target.value)}
              error={errors.start_date}
            />
            {errors.start_date && (
              <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Data de Término *
            </label>
            <Input
              type="date"
              value={formData.end_date}
              onChange={(e) => updateField('end_date', e.target.value)}
              error={errors.end_date}
            />
            {errors.end_date && (
              <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Descrição
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Digite uma descrição detalhada do contrato..."
            rows={4}
            error={errors.description}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Dias para Notificação
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[90, 60, 30, 15, 7].map((days) => (
              <label key={days} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.notification_days.includes(days)}
                  onChange={(e) => handleNotificationDaysChange(days, e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">{days} dias</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onSuccess?.()}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? 'Salvando...' : mode === 'create' ? 'Criar Contrato' : 'Atualizar Contrato'}
          </Button>
        </div>
      </form>
    </div>
  )
}

function generateContractNumber(): string {
  const year = new Date().getFullYear()
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `SEI-${year}-${timestamp}-${random}`
}