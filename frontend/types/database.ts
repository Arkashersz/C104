// types/database.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'manager' | 'user'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: 'admin' | 'manager' | 'user'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'manager' | 'user'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          id: string
          title: string
          description: string | null
          contract_number: string
          supplier: string
          value: number
          start_date: string
          end_date: string
          status: 'active' | 'expired' | 'cancelled' | 'renewed'
          notification_days: number[]
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          contract_number: string
          supplier: string
          value: number
          start_date: string
          end_date: string
          status?: 'active' | 'expired' | 'cancelled' | 'renewed'
          notification_days?: number[]
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          contract_number?: string
          supplier?: string
          value?: number
          start_date?: string
          end_date?: string
          status?: 'active' | 'expired' | 'cancelled' | 'renewed'
          notification_days?: number[]
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      process_statuses: {
        Row: {
          id: string
          name: string
          description: string | null
          responsible_user_id: string | null
          order_sequence: number
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          responsible_user_id?: string | null
          order_sequence: number
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          responsible_user_id?: string | null
          order_sequence?: number
          color?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_statuses_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      bidding_processes: {
        Row: {
          id: string
          title: string
          description: string | null
          process_number: string
          estimated_value: number | null
          opening_date: string | null
          current_status_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          process_number: string
          estimated_value?: number | null
          opening_date?: string | null
          current_status_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          process_number?: string
          estimated_value?: number | null
          opening_date?: string | null
          current_status_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bidding_processes_current_status_id_fkey"
            columns: ["current_status_id"]
            isOneToOne: false
            referencedRelation: "process_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bidding_processes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      process_status_history: {
        Row: {
          id: string
          bidding_process_id: string
          status_id: string
          changed_by: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          bidding_process_id: string
          status_id: string
          changed_by?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          bidding_process_id?: string
          status_id?: string
          changed_by?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_status_history_bidding_process_id_fkey"
            columns: ["bidding_process_id"]
            isOneToOne: false
            referencedRelation: "bidding_processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_status_history_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "process_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          type: string
          recipient_id: string
          title: string
          message: string
          sent_at: string | null
          read_at: string | null
          contract_id: string | null
          bidding_process_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          type: string
          recipient_id: string
          title: string
          message: string
          sent_at?: string | null
          read_at?: string | null
          contract_id?: string | null
          bidding_process_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: string
          recipient_id?: string
          title?: string
          message?: string
          sent_at?: string | null
          read_at?: string | null
          contract_id?: string | null
          bidding_process_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_bidding_process_id_fkey"
            columns: ["bidding_process_id"]
            isOneToOne: false
            referencedRelation: "bidding_processes"
            referencedColumns: ["id"]
          }
        ]
      }
      documents: {
        Row: {
          id: string
          name: string
          file_path: string
          file_size: number
          mime_type: string
          contract_id: string | null
          bidding_process_id: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          file_path: string
          file_size: number
          mime_type: string
          contract_id?: string | null
          bidding_process_id?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          file_path?: string
          file_size?: number
          mime_type?: string
          contract_id?: string | null
          bidding_process_id?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_bidding_process_id_fkey"
            columns: ["bidding_process_id"]
            isOneToOne: false
            referencedRelation: "bidding_processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'manager' | 'user'
      contract_status: 'active' | 'expired' | 'cancelled' | 'renewed'
      process_status: 'draft' | 'approval' | 'published' | 'closed'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}