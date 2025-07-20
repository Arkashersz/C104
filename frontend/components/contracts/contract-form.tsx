// components/contracts/contract-form.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ContractWithRelations, ContractInsert } from '@/types/contracts'
import { contractFormSchema, ContractFormData } from '@/lib/validations/contract'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// Removendo import do Loading para evitar problemas
import { 
  Save, 
  X, 
  Calendar, 
  DollarSign, 
  Building2, 
  FileText,
  AlertCircle
} from 'lucide-react'

interface ContractFormProps {
  contract?: ContractWithRelations
  onSubmit: (data: ContractInsert) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function ContractForm({ 
  contract, 
  onSubmit, 
  onCancel, 
  loading = false 
}: ContractFormProps) {
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: contract ? {
      title: contract.title,
      description: contract.description || '',
      contract_number: contract.contract_number,
      supplier: contract.supplier,
      value: contract.value,
      start_date: contract.start_date,
      end_date: contract.end_date,
      notification_days: contract.notification_days
    } : {
      notification_days: [90, 60, 30, 15, 7]
    }
  })

  const handleFormSubmit = async (data: ContractFormData) => {
    try {
      setError(null)
      
      const contractData: ContractInsert = {
        ...data,
        status: contract?.status || 'active',
        notification_days: data.notification_days || [90, 60, 30, 15, 7]
      }

      await onSubmit(contractData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar contrato')
    }
  }

  const startDate = watch('start_date')
  const endDate = watch('end_date')

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {contract ? 'Editar Contrato' : 'Novo Contrato'}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <Input
                {...register('title')}
                placeholder="Título do contrato"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Processo SEI *
              </label>
              <Input
                {...register('contract_number')}
                placeholder="Número do processo SEI"
                className={errors.contract_number ? 'border-red-500' : ''}
              />
              {errors.contract_number && (
                <p className="text-red-500 text-xs mt-1">{errors.contract_number.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <Textarea
              {...register('description')}
              placeholder="Descrição do contrato (opcional)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fornecedor *
              </label>
              <Input
                {...register('supplier')}
                placeholder="Nome do fornecedor"
                className={errors.supplier ? 'border-red-500' : ''}
              />
              {errors.supplier && (
                <p className="text-red-500 text-xs mt-1">{errors.supplier.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  {...register('value', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  className={`pl-10 ${errors.value ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.value && (
                <p className="text-red-500 text-xs mt-1">{errors.value.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Início *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  {...register('start_date')}
                  type="date"
                  className={`pl-10 ${errors.start_date ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.start_date && (
                <p className="text-red-500 text-xs mt-1">{errors.start_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Término *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  {...register('end_date')}
                  type="date"
                  min={startDate}
                  className={`pl-10 ${errors.end_date ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.end_date && (
                <p className="text-red-500 text-xs mt-1">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          {contract && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select
                value={contract.status}
                onValueChange={(value) => setValue('status', value as any)}
              >
                <option value="active">Ativo</option>
                <option value="expired">Expirado</option>
                <option value="cancelled">Cancelado</option>
                <option value="renewed">Renovado</option>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={loading || isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            
            <Button
              type="submit"
              disabled={loading || isSubmitting}
              className="min-w-[120px]"
            >
              {loading || isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {contract ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 