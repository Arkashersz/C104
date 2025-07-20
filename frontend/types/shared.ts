// Tipos compartilhados para evitar conflitos entre componentes

export interface BiddingProcess {
  id: string;
  process_number: string;
  title: string;
  current_status: { name: string; color: string } | null;
  created_by: { name: string } | null;
  updated_at: string;
}

export interface Contract {
  id: string;
  contract_number: string;
  supplier: string;
  value: number;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled' | 'renewed';
  created_by: {
    name: string;
    email: string;
  } | null;
} 