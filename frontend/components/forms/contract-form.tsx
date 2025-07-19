// components/forms/contract-form.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contractFormSchema, type ContractFormData } from '@/lib/validations/contract'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { generateContractNumber } from '@/lib/utils'

// Componente Textarea inline
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

const Textarea = ({ className, error, ...props }: TextareaProps) => (
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
  contractId 
}: ContractFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  // Configuração do form com tipos corretos
  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      contract_number: initialData?.contract_number || generateContractNumber(),
      title: initialData?.title || '',
      description: initialData?.description || '',
      supplier: initialData?.supplier || '',
      value: initialData?.value || 0,
      start_date: initialData?.start_date || '',
      end_date: initialData?.end_date || '',
      notification_days: initialData?.notification_days || [90, 60, 30, 15, 7],
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = form

  // Watch notification_days com fallback
  const watchedNotificationDays = watch('notification_days')
  const notificationDays = watchedNotificationDays || [90, 60, 30, 15, 7]

  // Submit handler com tipagem correta
  const onSubmit = handleSubmit(async (formData: ContractFormData) => {
    setIsLoading(true)
    
    try {
      const { data: user } = await supabase.auth.getUser()
      
      if (!user.user) {
        throw new Error('Usuário não autenticado')
      }

      // Processar dados garantindo que notification_days existe
      const processedData = {
        ...formData,
        notification_days: formData.notification_days || [90, 60, 30, 15, 7]
      }

      if (mode === 'create') {
        const { error } = await supabase
          .from('contracts')
          .insert([{
            ...processedData,
            created_by: user.user.id,
          }])

        if (error) throw error

        toast.success(
          'Contrato criado com sucesso!',
          `Contrato ${processedData.contract_number} foi cadastrado no sistema.`
        )
      } else if (contractId) {
        const { error } = await supabase
          .from('contracts')
          .update(processedData)
          .eq('id', contractId)

        if (error) throw error

        toast.success(
          'Contrato atualizado com sucesso!',
          `As alterações do contrato ${processedData.contract_number} foram salvas.`
        )
      }

      // Reset do formulário
      reset({
        contract_number: generateContractNumber(),
        title: '',
        description: '',
        supplier: '',
        value: 0,
        start_date: '',
        end_date: '',
        notification_days: [90, 60, 30, 15, 7],
      })
      
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
  })

  const handleNotificationDaysChange = (days: number, checked: boolean) => {
    const currentDays = notificationDays
    if (checked) {
      setValue('notification_days', [...currentDays, days].sort((a, b) => b - a))
    } else {
      setValue('notification_days', currentDays.filter((d: number) => d !== days))
    }
  }

  const generateNewContractNumber = () => {
    setValue('contract_number', generateContractNumber())
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

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número do Contrato *
            </label>
            <Input
              {...register('contract_number')}
              placeholder="CTR-2025-001"
              error={errors.contract_number?.message}
              disabled={mode === 'edit'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fornecedor *
            </label>
            <Input
              {...register('supplier')}
              placeholder="Nome do fornecedor"
              error={errors.supplier?.message}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título do Contrato *
            </label>
            <Input
              {...register('title')}
              placeholder="Título do contrato"
              error={errors.title?.message}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <Textarea
              {...register('description')}
              placeholder="Descrição detalhada do contrato"
              rows={3}
              error={errors.description?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor (R$) *
            </label>
            <Input
              {...register('value', { 
                valueAsNumber: true,
                setValueAs: (value: string) => value === '' ? 0 : parseFloat(value) || 0
              })}
              type="number"
              step="0.01"
              placeholder="0,00"
              error={errors.value?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Início *
            </label>
            <Input
              {...register('start_date')}
              type="date"
              error={errors.start_date?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Término *
            </label>
            <Input
              {...register('end_date')}
              type="date"
              error={errors.end_date?.message}
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
                  checked={notificationDays.includes(days)}
                  onChange={(e) => handleNotificationDaysChange(days, e.target.checked)}
                  className="rounded border-gray-300 text-primary-medium focus:ring-primary-medium"
                />
                <span className="text-sm font-medium">{days} dias</span>
              </label>
            ))}
          </div>
          {errors.notification_days && (
            <p className="mt-2 text-sm text-red-600">{errors.notification_days.message}</p>
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => {
              reset({
                contract_number: generateContractNumber(),
                title: '',
                description: '',
                supplier: '',
                value: 0,
                start_date: '',
                end_date: '',
                notification_days: [90, 60, 30, 15, 7],
              })
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