// components/bidding/bidding-card.tsx
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
import { BiddingProcessWithRelations } from '@/types/bidding'

interface BiddingCardProps {
  bidding: BiddingProcessWithRelations
  onEdit?: (bidding: BiddingProcessWithRelations) => void
  onDelete?: (id: string) => void
}

export function BiddingCard({ bidding, onEdit, onDelete }: BiddingCardProps) {
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

  const getStatusColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      'blue': 'bg-blue-100 text-blue-800',
      'yellow': 'bg-yellow-100 text-yellow-800',
      'green': 'bg-green-100 text-green-800',
      'red': 'bg-red-100 text-red-800',
      'gray': 'bg-gray-100 text-gray-800',
      'purple': 'bg-purple-100 text-purple-800',
      'orange': 'bg-orange-100 text-orange-800'
    }
    return colorMap[color] || 'bg-gray-100 text-gray-800'
  }

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir este processo de licitação?')) {
      setIsDeleting(true)
      try {
        if (onDelete) {
          await onDelete(bidding.id)
        }
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const getCreatorName = () => {
    if (bidding.created_by && typeof bidding.created_by === 'object' && 'name' in bidding.created_by) {
      return (bidding.created_by as any).name || (bidding.created_by as any).email || 'Usuário'
    }
    return 'Usuário'
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
              {bidding.title}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              {bidding.current_status && (
                <Badge className={getStatusColor(bidding.current_status.color)}>
                  {bidding.current_status.name}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/bidding/${bidding.id}`)}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(bidding)}
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
          <span className="text-gray-600">Número:</span>
          <span className="font-medium">{bidding.process_number}</span>
        </div>

        {bidding.estimated_value && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Valor Estimado:</span>
            <span className="font-medium">{formatCurrency(bidding.estimated_value)}</span>
          </div>
        )}

        {bidding.opening_date && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Data de Abertura:</span>
            <span className="font-medium">{formatDate(bidding.opening_date)}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-500" />
          <span className="text-gray-600">Criado por:</span>
          <span className="font-medium">{getCreatorName()}</span>
        </div>

        {bidding.description && (
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-600 line-clamp-2">
              {bidding.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 