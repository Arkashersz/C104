// components/forms/contract-form-simple.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { generateContractNumber } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

// Componente Textarea inline
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

const Textarea = ({ className, error, ...props }: TextareaProps) => (
  <div className="w-full">
    <textarea
      className={`flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-red-500 focus:ring-red-500' : ''
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
      // Usando alert como substituto para um sistema de toast completo
      alert(`✅ ${title}${message ? `\n${message}` : ''}`)
    },
    error: (title: string, message?: string) => {
      console.error('ERROR:', title, message)
      alert(`❌ ${title}${message ? `\n${message}` : ''}`)
    }
  }
  return { toast }
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado. Faça o login para continuar.');
      }
      const token = session.access_token;

      const response = await fetch('http://localhost:3001/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Falha ao criar o contrato.');
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
              Número do Contrato *
            </label>
            <Input
              value={formData.contract_number}
              onChange={(e) => updateField('contract_number', e.target.value)}
              placeholder="CTR-2025-001"
              error={errors.contract_number}
              disabled={mode === 'edit'}
              className="text-lg font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
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
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Título do Contrato *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Título do contrato"
              error={errors.title}
              className="text-lg"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Descrição
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Descrição detalhada do contrato"
              rows={4}
              error={errors.description}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Valor (R$) *
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.value}
              onChange={(e) => updateField('value', parseFloat(e.target.value) || 0)}
              placeholder="0,00"
              error={errors.value}
              className="text-lg font-semibold"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Vigência
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              defaultValue="12"
            >
              <option value="12">12 meses</option>
              <option value="24">24 meses</option>
              <option value="36">36 meses</option>
              <option value="48">48 meses</option>
            </select>
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
          </div>
        </div>

        {/* Seção de alertas */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            ⚠️ Alertas de Vencimento
          </label>
          <p className="text-sm text-gray-600 mb-4">
            Selecione quantos dias antes do vencimento você deseja receber notificações por e-mail:
          </p>
          <div className="flex flex-wrap gap-3">
            {[90, 60, 30, 15, 7, 1].map((days) => (
              <label key={days} className="flex items-center space-x-2 bg-white px-4 py-3 rounded-lg border hover:bg-yellow-50 cursor-pointer transition-colors shadow-sm">
                <input
                  type="checkbox"
                  checked={formData.notification_days.includes(days)}
                  onChange={(e) => handleNotificationDaysChange(days, e.target.checked)}
                  className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-gray-700">{days} dias</span>
              </label>
            ))}
          </div>
        </div>

        {/* Seção de documentos */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            📎 Documentos
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm">
                Arraste arquivos aqui ou{' '}
                <span className="text-blue-500 hover:text-blue-600 cursor-pointer font-semibold">
                  clique para selecionar
                </span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PDF, DOC, DOCX até 10MB
              </p>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end space-x-4 pt-8 border-t-2 border-gray-100">
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
            className="px-8 py-3"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 text-lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
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