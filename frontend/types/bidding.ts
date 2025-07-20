// types/bidding.ts
import { Database } from './database'

export type BiddingProcess = Database['public']['Tables']['bidding_processes']['Row']
export type BiddingProcessInsert = Database['public']['Tables']['bidding_processes']['Insert']
export type BiddingProcessUpdate = Database['public']['Tables']['bidding_processes']['Update']

export type BiddingProcessWithRelations = BiddingProcess & {
  created_by: {
    name: string
    email: string
  } | null
  current_status: {
    id: string
    name: string
    color: string
    description: string | null
  } | null
  status_history?: Array<{
    id: string
    status: {
      id: string
      name: string
      color: string
    }
    changed_by: {
      name: string
      email: string
    } | null
    notes: string | null
    created_at: string
  }>
}

export type ProcessStatus = Database['public']['Tables']['process_statuses']['Row']

export interface BiddingFilters {
  status?: string
  search?: string
  page?: number
  limit?: number
  orderBy?: 'created_at' | 'title' | 'process_number' | 'estimated_value' | 'opening_date'
  orderDirection?: 'asc' | 'desc'
}

export interface BiddingListResponse {
  data: BiddingProcessWithRelations[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface BiddingStats {
  total: number
  draft: number
  approval: number
  published: number
  closed: number
  active: number
}
