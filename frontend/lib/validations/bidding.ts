// lib/validations/bidding.ts
import { z } from 'zod'

export const biddingProcessSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  process_number: z.string().min(1, 'Número do processo é obrigatório'),
  estimated_value: z.number().positive().optional(),
  opening_date: z.string().optional(),
  current_status_id: z.string().uuid(),
})

export type BiddingProcessFormData = z.infer<typeof biddingProcessSchema>