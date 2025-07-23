// components/bidding/bidding-form.tsx
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { Loader2, Save, X } from 'lucide-react'
import { biddingFormSchema, BiddingFormData } from '@/lib/validations/bidding'
import { useBidding } from '@/lib/hooks/use-bidding'
import { BiddingProcessWithRelations } from '@/types/bidding'

interface BiddingFormProps {
  bidding?: BiddingProcessWithRelations | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function BiddingForm({ bidding, isOpen, onClose, onSuccess }: BiddingFormProps) {
  const [loading, setLoading] = useState(false)
  const [statuses, setStatuses] = useState<Array<{ id: string; name: string; color: string }>>([])
  const { createBiddingProcess, updateBiddingProcess, fetchStatuses } = useBidding()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<BiddingFormData>({
    resolver: zodResolver(biddingFormSchema),
    defaultValues: {
      title: '',
      description: '',
      process_number: '',
      estimated_value: undefined,
      opening_date: '',
      current_status_id: ''
    }
  })

  useEffect(() => {
    const loadStatuses = async () => {
      const statusData = await fetchStatuses()
      setStatuses(statusData)
    }
    loadStatuses()
  }, [fetchStatuses])

  // Reset do formulário quando o modal abre
  useEffect(() => {
    if (isOpen) {
      if (bidding) {
        // Se está editando, preenche com os dados do processo
        reset({
          title: bidding.title || '',
          description: bidding.description || '',
          process_number: bidding.process_number || '',
          estimated_value: bidding.estimated_value || undefined,
          opening_date: bidding.opening_date ? new Date(bidding.opening_date).toISOString().split('T')[0] : '',
          current_status_id: bidding.current_status_id || ''
        })
      } else {
        // Se está criando, limpa todos os campos
        reset({
          title: '',
          description: '',
          process_number: '',
          estimated_value: undefined,
          opening_date: '',
          current_status_id: ''
        })
      }
    }
  }, [isOpen, bidding, reset])

  const onSubmit = async (data: BiddingFormData) => {
    setLoading(true)
    try {
      const biddingData = {
        ...data,
        estimated_value: data.estimated_value ? Number(data.estimated_value) : null,
        opening_date: data.opening_date || null,
        current_status_id: data.current_status_id || null
      }

      if (bidding) {
        // Atualizar
        const result = await updateBiddingProcess(bidding.id, biddingData)
        if (result) {
          onSuccess()
          onClose()
        }
      } else {
        // Criar
        const result = await createBiddingProcess(biddingData)
        if (result) {
          onSuccess()
          onClose()
        }
      }
    } catch (error) {
      console.error('Erro ao salvar processo de licitação:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset explícito para valores vazios
    reset({
      title: '',
      description: '',
      process_number: '',
      estimated_value: undefined,
      opening_date: '',
      current_status_id: ''
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        // Reset explícito quando o modal é fechado
        reset({
          title: '',
          description: '',
          process_number: '',
          estimated_value: undefined,
          opening_date: '',
          current_status_id: ''
        })
      }
      onClose()
    }}>
      <div className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">
            {bidding ? 'Editar Processo de Licitação' : 'Novo Processo de Licitação'}
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <Input
              {...register('title')}
              placeholder="Digite o título do processo de licitação"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Número do Processo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número do Processo *
            </label>
            <Input
              {...register('process_number')}
              placeholder="Ex: 001/2024"
              className={errors.process_number ? 'border-red-500' : ''}
            />
            {errors.process_number && (
              <p className="text-red-500 text-sm mt-1">{errors.process_number.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <Textarea
              {...register('description')}
              placeholder="Descreva o objeto da licitação"
              rows={3}
            />
          </div>

          {/* Valor Estimado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor Estimado
            </label>
            <Input
              {...register('estimated_value', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              className={errors.estimated_value ? 'border-red-500' : ''}
            />
            {errors.estimated_value && (
              <p className="text-red-500 text-sm mt-1">{errors.estimated_value.message}</p>
            )}
          </div>

          {/* Data de Abertura */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Abertura
            </label>
            <Input
              {...register('opening_date')}
              type="date"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Atual
            </label>
            <Select
              {...register('current_status_id')}
            >
              <option value="">Selecione um status</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              disabled={loading || isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            
            <Button
              type="submit"
              disabled={loading || isSubmitting}
              className="px-6"
            >
              {loading || isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {bidding ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  )
} 