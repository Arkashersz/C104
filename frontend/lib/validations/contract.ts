// lib/validations/contract.ts
import { z } from 'zod'

// Schema que será usado no useForm - notification_days opcional para compatibilidade
export const contractFormSchema = z.object({
    title: z.string().min(1, 'Título é obrigatório'),
    description: z.string().optional(),
    contract_number: z.string().min(1, 'Processo SEI é obrigatório'),
    supplier: z.string().min(1, 'Fornecedor é obrigatório'),
    value: z.number().positive('Valor deve ser positivo'),
    start_date: z.string().min(1, 'Data de início é obrigatória'),
    end_date: z.string().min(1, 'Data de término é obrigatória'),
    // IMPORTANTE: opcional para evitar conflitos de tipagem
    notification_days: z.array(z.number()).optional(),
})

// Tipo inferido do schema (notification_days será opcional)
export type ContractFormData = z.infer<typeof contractFormSchema>

// Schema para processamento (com default aplicado)
export const contractProcessSchema = contractFormSchema.transform((data) => ({
    ...data,
    notification_days: data.notification_days || [90, 60, 30, 15, 7]
}))

// Tipo para dados processados (notification_days será obrigatório)
export type ContractProcessedData = z.infer<typeof contractProcessSchema>

// Schema para inserção no banco
export const contractInsertSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    contract_number: z.string(),
    supplier: z.string(),
    value: z.number(),
    start_date: z.string(),
    end_date: z.string(),
    notification_days: z.array(z.number()),
    id: z.string().uuid().optional(),
    status: z.enum(['active', 'expired', 'cancelled', 'renewed']).default('active'),
    created_by: z.string().uuid().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
})

export type ContractInsert = z.infer<typeof contractInsertSchema>

// Para compatibilidade com código existente
export const contractSchema = contractFormSchema