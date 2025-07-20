// components/contracts/contract-card.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  DollarSign, 
  FileText, 
  User, 
  Edit, 
  Trash2, 
  Eye,
  Building
} from 'lucide-react'
import { ContractWithRelations } from '@/types/contracts'

interface ContractCardProps {
  contract: ContractWithRelations
  onEdit?: (contract: ContractWithRelations) => void
  onDelete?: (id: string) => void
}

export function ContractCard({ contract, onEdit, onDelete }: ContractCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      case 'renewed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo'
      case 'expired':
        return 'Expirado'
      case 'cancelled':
        return 'Cancelado'
      case 'renewed':
        return 'Renovado'
      default:
        return status
    }
  }

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir este contrato?')) {
      setIsDeleting(true)
      try {
        if (onDelete) {
          await onDelete(contract.id)
        }
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const getCreatorName = () => {
    if (contract.created_by && typeof contract.created_by === 'object') {
      return contract.created_by.name || contract.created_by.email || 'Usuário'
    }
    return 'Usuário'
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
              {contract.title}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getStatusColor(contract.status)}>
                {getStatusText(contract.status)}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/contracts/${contract.id}`)}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(contract)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-500" />
          <span className="text-gray-600">Processo SEI:</span>
          <span className="font-medium">{contract.contract_number}</span>
        </div>

        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-gray-500" />
          <span className="text-gray-600">Fornecedor:</span>
          <span className="font-medium">{contract.supplier}</span>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-gray-500" />
          <span className="text-gray-600">Valor:</span>
          <span className="font-medium">{formatCurrency(contract.value)}</span>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-gray-600">Período:</span>
          <span className="font-medium">
            {formatDate(contract.start_date)} - {formatDate(contract.end_date)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-500" />
          <span className="text-gray-600">Criado por:</span>
          <span className="font-medium">{getCreatorName()}</span>
        </div>

        {contract.description && (
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-600 line-clamp-2">
              {contract.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 