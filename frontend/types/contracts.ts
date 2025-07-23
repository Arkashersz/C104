// types/contracts.ts
import { Database } from './database'

export type Contract = Database['public']['Tables']['contracts']['Row']
export type ContractInsert = Database['public']['Tables']['contracts']['Insert']
export type ContractUpdate = Database['public']['Tables']['contracts']['Update']

export type ContractWithRelations = Contract & {
  created_by: {
    name: string
    email: string
  } | null
  documents?: Array<{
    id: string
    name: string
    file_path: string
    file_size: number
    mime_type: string
    uploaded_by: string | null
    created_at: string
  }>
}

export type ContractStatus = 'active' | 'expired' | 'cancelled' | 'renewed'

export interface ContractFilters {
  status?: ContractStatus
  supplier?: string
  search?: string
  page?: number
  limit?: number
  orderBy?: 'created_at' | 'title' | 'contract_number' | 'supplier' | 'value' | 'start_date' | 'end_date'
  orderDirection?: 'asc' | 'desc'
}

export interface ContractListResponse {
  data: ContractWithRelations[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ContractStats {
  total: number
  active: number
  expired: number
  cancelled: number
  renewed: number
  expiringSoon: number
  totalValue: number
}
