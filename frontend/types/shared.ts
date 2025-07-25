// Tipos compartilhados para processos SEI unificados

export type SEIProcessType = 'contrato' | 'licitacao' | 'dispensa' | 'outro';
export type SEIProcessStatus = 'em_andamento' | 'finalizado' | 'cancelado';

export interface SEIProcess {
  id?: string;
  process_number: string;
  type: SEIProcessType;
  title: string;
  description?: string;
  supplier?: string;
  value?: number;
  start_date?: string;
  end_date?: string;
  estimated_value?: number;
  opening_date?: string;
  status: SEIProcessStatus;
  notification_days?: number[];
  group_id?: string;
  group?: { id: string; name: string };
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SEIProcessWithRelations extends SEIProcess {
  id: string;
  group?: { id: string; name: string };
  created_by_user?: { id: string; name: string; email: string };
} 