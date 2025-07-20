'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BiddingForm } from '@/components/bidding/bidding-form'
import { useBidding } from '@/lib/hooks/use-bidding'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar, 
  DollarSign, 
  FileText, 
  User, 
  AlertCircle,
  Building,
  Clock
} from 'lucide-react'

export default function BiddingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [bidding, setBidding] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)

  const { fetchBiddingProcess, deleteBiddingProcess } = useBidding()

  useEffect(() => {
    const loadBidding = async () => {
      if (params.id) {
        setLoading(true)
        const data = await fetchBiddingProcess(params.id as string)
        if (data) {
          setBidding(data)
        } else {
          setError('Processo de licitação não encontrado')
        }
        setLoading(false)
      }
    }

    loadBidding()
  }, [params.id, fetchBiddingProcess])

  const handleDeleteBidding = async () => {
    if (confirm('Tem certeza que deseja excluir este processo de licitação?')) {
      const success = await deleteBiddingProcess(bidding.id)
      if (success) {
        router.push('/bidding')
      }
    }
  }

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

  const getStatusText = (status: any) => {
    return status?.name || 'Status não definido'
  }

  const isOpeningSoon = () => {
    if (!bidding?.opening_date) return false
    const openingDate = new Date(bidding.opening_date)
    const today = new Date()
    const diffTime = openingDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 7 && diffDays > 0
  }

  const getDaysUntilOpening = () => {
    if (!bidding?.opening_date) return 0
    const openingDate = new Date(bidding.opening_date)
    const today = new Date()
    const diffTime = openingDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getCreatorName = () => {
    if (bidding?.created_by && typeof bidding.created_by === 'object') {
      return bidding.created_by.name || bidding.created_by.email || 'Usuário'
    }
    return 'Usuário'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Carregando...</span>
        </div>
      </div>
    )
  }

  if (error || !bidding) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro</h2>
          <p className="text-gray-600 mb-4">{error || 'Processo de licitação não encontrado'}</p>
          <Button onClick={() => router.push('/bidding')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Licitações
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header com ações */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push('/bidding')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowEditForm(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              
              <Button
                variant="ghost"
                onClick={handleDeleteBidding}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </div>
          </div>

          {/* Alerta de abertura próxima */}
          {isOpeningSoon() && (
            <div className="flex items-center gap-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <Clock className="h-5 w-5 text-orange-500" />
              <span className="text-orange-700">
                Este processo abre em {getDaysUntilOpening()} dia{getDaysUntilOpening() !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Informações principais */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card principal */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                        {bidding.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        {bidding.current_status && (
                          <Badge className={getStatusColor(bidding.current_status.color)}>
                            {getStatusText(bidding.current_status)}
                          </Badge>
                        )}
                        {isOpeningSoon() && (
                          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                            Abertura em breve
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {bidding.description && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Descrição</h3>
                      <p className="text-gray-600">{bidding.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Número do Processo</p>
                        <p className="font-medium">{bidding.process_number}</p>
                      </div>
                    </div>

                    {bidding.estimated_value && (
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Valor Estimado</p>
                          <p className="font-medium">{formatCurrency(bidding.estimated_value)}</p>
                        </div>
                      </div>
                    )}

                    {bidding.opening_date && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Data de Abertura</p>
                          <p className="font-medium">{formatDate(bidding.opening_date)}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Criado por</p>
                        <p className="font-medium">{getCreatorName()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Card lateral */}
            <div className="space-y-6">
              {/* Informações do status */}
              {bidding.current_status && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Status Atual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(bidding.current_status.color)}>
                          {bidding.current_status.name}
                        </Badge>
                      </div>
                      {bidding.current_status.description && (
                        <p className="text-sm text-gray-600">
                          {bidding.current_status.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Histórico de status */}
              {bidding.status_history && bidding.status_history.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Histórico de Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {bidding.status_history.map((history: any, index: number) => (
                        <div key={history.id} className="border-l-2 border-gray-200 pl-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getStatusColor(history.status.color)}>
                              {history.status.name}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            {formatDate(history.created_at)}
                          </p>
                          {history.notes && (
                            <p className="text-sm text-gray-600 mt-1">
                              {history.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Modal de Edição */}
        <BiddingForm
          bidding={bidding}
          isOpen={showEditForm}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => {
            setShowEditForm(false)
            // Recarregar dados
            if (params.id) {
              fetchBiddingProcess(params.id as string).then(setBidding)
            }
          }}
        />
      </div>
    </div>
  )
}
