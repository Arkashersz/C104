// lib/validations/bidding.ts
import { z } from 'zod'

export const biddingFormSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  process_number: z.string().min(1, 'Número do processo é obrigatório'),
  estimated_value: z.number().positive('Valor estimado deve ser positivo').optional(),
  opening_date: z.string().optional(),
  current_status_id: z.string().optional()
})

export type BiddingFormData = z.infer<typeof biddingFormSchema>