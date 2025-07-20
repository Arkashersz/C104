'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SharedLayout } from '@/components/layout/shared-layout'
import { ContractForm } from '@/components/contracts/contract-form'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Loading } from '@/components/ui/loading'
import { useContracts } from '@/lib/hooks/use-contracts'
import { ContractWithRelations, ContractInsert } from '@/types/contracts'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Building2, 
  FileText,
  User,
  Clock,
  AlertCircle,
  Download
} from 'lucide-react'

export default function ContractDetailPage() {
  const params = useParams()
  const router = useRouter()
  const contractId = params.id as string
  
  const {
    fetchContract,
    updateContract,
    deleteContract,
    loading,
    error
  } = useContracts()

  const [contract, setContract] = useState<ContractWithRelations | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadContract = async () => {
      if (contractId) {
        const data = await fetchContract(contractId)
        setContract(data)
        setIsLoading(false)
      }
    }

    loadContract()
  }, [contractId])

  const handleUpdateContract = async (data: ContractInsert) => {
    if (contract) {
      const result = await updateContract(contract.id, data)
      if (result) {
        setShowEditForm(false)
        // Recarregar dados do contrato
        const updatedContract = await fetchContract(contractId)
        setContract(updatedContract)
      }
    }
  }

  const handleDeleteContract = async () => {
    if (contract && confirm('Tem certeza que deseja excluir este contrato?')) {
      const result = await deleteContract(contract.id)
      if (result) {
        router.push('/contracts')
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'renewed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
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

  const isExpiringSoon = () => {
    if (!contract) return false
    const endDate = new Date(contract.end_date)
    const today = new Date()
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 30 && diffDays > 0
  }

  const getDaysUntilExpiration = () => {
    if (!contract) return 0
    const endDate = new Date(contract.end_date)
    const today = new Date()
    const diffTime = endDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  if (isLoading) {
    return (
      <SharedLayout title="Carregando..." subtitle="" icon="📄">
        <div className="flex items-center justify-center py-12">
          <Loading className="h-8 w-8" />
        </div>
      </SharedLayout>
    )
  }

  if (error || !contract) {
    return (
      <SharedLayout title="Erro" subtitle="" icon="📄">
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">
            {error || 'Contrato não encontrado'}
          </span>
        </div>
      </SharedLayout>
    )
  }

  return (
    <SharedLayout 
      title={contract.title} 
      subtitle="Detalhes do contrato"
      icon="📄"
    >
      <div className="space-y-6">
        {/* Header com ações */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push('/contracts')}
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
              onClick={handleDeleteContract}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>

        {/* Alerta de vencimento */}
        {isExpiringSoon() && contract.status === 'active' && (
          <div className="flex items-center gap-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <span className="text-orange-700">
              Este contrato vence em {getDaysUntilExpiration()} dia{getDaysUntilExpiration() !== 1 ? 's' : ''}
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
                      {contract.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(contract.status)}>
                        {getStatusText(contract.status)}
                      </Badge>
                      {isExpiringSoon() && contract.status === 'active' && (
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                          Vencendo em breve
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {contract.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Descrição</h3>
                    <p className="text-gray-600">{contract.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     <div className="flex items-center gap-3">
                     <FileText className="h-5 w-5 text-gray-400" />
                     <div>
                       <p className="text-sm text-gray-500">Processo SEI</p>
                       <p className="font-medium">{contract.contract_number}</p>
                     </div>
                   </div>

                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Fornecedor</p>
                      <p className="font-medium">{contract.supplier}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Valor</p>
                      <p className="font-medium">{formatCurrency(contract.value)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Período</p>
                      <p className="font-medium">
                        {formatDate(contract.start_date)} - {formatDate(contract.end_date)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar com informações adicionais */}
          <div className="space-y-6">
            {/* Informações de criação */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Criado por</p>
                    <p className="font-medium">{contract.created_by?.name || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Criado em</p>
                    <p className="font-medium">{formatDate(contract.created_at)}</p>
                  </div>
                </div>

                {contract.updated_at !== contract.created_at && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Atualizado em</p>
                      <p className="font-medium">{formatDate(contract.updated_at)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documentos */}
            {contract.documents && contract.documents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Documentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {contract.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-gray-500">
                            {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modal de edição */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <ContractForm
              contract={contract}
              onSubmit={handleUpdateContract}
              onCancel={() => setShowEditForm(false)}
              loading={loading}
            />
          </div>
        </div>
      </Dialog>
    </SharedLayout>
  )
}
