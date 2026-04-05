export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          assigned_to: string | null
          conversation_id: string | null
          created_at: string | null
          duration: number | null
          id: string
          lead_id: string | null
          notes: string | null
          reminder_sent: boolean | null
          scheduled_at: string
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          conversation_id?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          reminder_sent?: boolean | null
          scheduled_at: string
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          conversation_id?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          reminder_sent?: boolean | null
          scheduled_at?: string
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          created_at: string | null
          details: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          performed_at: string | null
          performed_by: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          performed_at?: string | null
          performed_by: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          performed_at?: string | null
          performed_by?: string
        }
        Relationships: []
      }
      consent_records: {
        Row: {
          created_at: string | null
          finance_packet_id: string | null
          granted: boolean | null
          granted_at: string | null
          id: string
          ip_address: string | null
          lead_id: string | null
          method: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          finance_packet_id?: string | null
          granted?: boolean | null
          granted_at?: string | null
          id?: string
          ip_address?: string | null
          lead_id?: string | null
          method?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          finance_packet_id?: string | null
          granted?: boolean | null
          granted_at?: string | null
          id?: string
          ip_address?: string | null
          lead_id?: string | null
          method?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_finance_packet_id_fkey"
            columns: ["finance_packet_id"]
            isOneToOne: false
            referencedRelation: "finance_packets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_records_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          ai_disclosure_sent: boolean | null
          channel: string
          created_at: string | null
          current_handler: string | null
          customer_name: string
          customer_phone: string | null
          deal_stage: string | null
          duration: string | null
          escalation_flag: boolean | null
          escalation_reason: string | null
          handler_name: string | null
          id: string
          last_message_at: string | null
          lead_id: string | null
          objection_count: number | null
          opted_out: boolean | null
          sentiment: string | null
          started_at: string | null
          status: string
          summary: string | null
          suppression_active: boolean | null
          unread_count: number | null
          updated_at: string | null
        }
        Insert: {
          ai_disclosure_sent?: boolean | null
          channel?: string
          created_at?: string | null
          current_handler?: string | null
          customer_name: string
          customer_phone?: string | null
          deal_stage?: string | null
          duration?: string | null
          escalation_flag?: boolean | null
          escalation_reason?: string | null
          handler_name?: string | null
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          objection_count?: number | null
          opted_out?: boolean | null
          sentiment?: string | null
          started_at?: string | null
          status?: string
          summary?: string | null
          suppression_active?: boolean | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_disclosure_sent?: boolean | null
          channel?: string
          created_at?: string | null
          current_handler?: string | null
          customer_name?: string
          customer_phone?: string | null
          deal_stage?: string | null
          duration?: string | null
          escalation_flag?: boolean | null
          escalation_reason?: string | null
          handler_name?: string | null
          id?: string
          last_message_at?: string | null
          lead_id?: string | null
          objection_count?: number | null
          opted_out?: boolean | null
          sentiment?: string | null
          started_at?: string | null
          status?: string
          summary?: string | null
          suppression_active?: boolean | null
          unread_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_profiles: {
        Row: {
          address: string | null
          annual_income: number | null
          city: string | null
          created_at: string | null
          date_of_birth: string | null
          drivers_license_number: string | null
          email: string | null
          employer_name: string | null
          employer_phone: string | null
          first_name: string
          id: string
          last_name: string
          lead_id: string | null
          monthly_housing_payment: number | null
          phone: string
          postal_code: string | null
          province: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          annual_income?: number | null
          city?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          drivers_license_number?: string | null
          email?: string | null
          employer_name?: string | null
          employer_phone?: string | null
          first_name: string
          id?: string
          last_name: string
          lead_id?: string | null
          monthly_housing_payment?: number | null
          phone: string
          postal_code?: string | null
          province?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          annual_income?: number | null
          city?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          drivers_license_number?: string | null
          email?: string | null
          employer_name?: string | null
          employer_phone?: string | null
          first_name?: string
          id?: string
          last_name?: string
          lead_id?: string | null
          monthly_housing_payment?: number | null
          phone?: string
          postal_code?: string | null
          province?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_profiles_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      disclosure_records: {
        Row: {
          acknowledged_at: string | null
          channel: string | null
          created_at: string | null
          finance_packet_id: string | null
          id: string
          lead_id: string | null
          sent_at: string | null
          type: string
        }
        Insert: {
          acknowledged_at?: string | null
          channel?: string | null
          created_at?: string | null
          finance_packet_id?: string | null
          id?: string
          lead_id?: string | null
          sent_at?: string | null
          type: string
        }
        Update: {
          acknowledged_at?: string | null
          channel?: string | null
          created_at?: string | null
          finance_packet_id?: string | null
          id?: string
          lead_id?: string | null
          sent_at?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "disclosure_records_finance_packet_id_fkey"
            columns: ["finance_packet_id"]
            isOneToOne: false
            referencedRelation: "finance_packets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disclosure_records_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      escalations: {
        Row: {
          assigned_to: string | null
          channel: string
          conversation_id: string | null
          created_at: string | null
          customer_name: string
          id: string
          lead_id: string | null
          reason: string
          resolution: string | null
          resolved_at: string | null
          severity: string | null
          status: string | null
        }
        Insert: {
          assigned_to?: string | null
          channel: string
          conversation_id?: string | null
          created_at?: string | null
          customer_name: string
          id?: string
          lead_id?: string | null
          reason: string
          resolution?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
        }
        Update: {
          assigned_to?: string | null
          channel?: string
          conversation_id?: string | null
          created_at?: string | null
          customer_name?: string
          id?: string
          lead_id?: string | null
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escalations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_packets: {
        Row: {
          applicant_id: string | null
          blockers: string[] | null
          co_applicant_id: string | null
          completion_percentage: number | null
          created_at: string | null
          id: string
          lead_id: string | null
          quote_id: string | null
          response_received_at: string | null
          routed_at: string | null
          routing_status: string | null
          routing_target: string | null
          status: string | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          applicant_id?: string | null
          blockers?: string[] | null
          co_applicant_id?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          quote_id?: string | null
          response_received_at?: string | null
          routed_at?: string | null
          routing_status?: string | null
          routing_target?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          applicant_id?: string | null
          blockers?: string[] | null
          co_applicant_id?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          quote_id?: string | null
          response_received_at?: string | null
          routed_at?: string | null
          routing_status?: string | null
          routing_target?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_packets_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_packets_co_applicant_id_fkey"
            columns: ["co_applicant_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_packets_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_packets_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_packets_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_tasks: {
        Row: {
          assigned_to: string | null
          channel: string | null
          completed_at: string | null
          conversation_id: string | null
          created_at: string | null
          customer_name: string
          id: string
          lead_id: string | null
          message: string | null
          priority: string | null
          scheduled_for: string
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          channel?: string | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string | null
          customer_name: string
          id?: string
          lead_id?: string | null
          message?: string | null
          priority?: string | null
          scheduled_for: string
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          channel?: string | null
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string | null
          customer_name?: string
          id?: string
          lead_id?: string | null
          message?: string | null
          priority?: string | null
          scheduled_for?: string
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_tasks_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_configs: {
        Row: {
          category: string
          created_at: string | null
          credentials: Json | null
          error_message: string | null
          id: string
          integration_id: string
          last_sync_at: string | null
          name: string
          provider: string
          status: string | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          credentials?: Json | null
          error_message?: string | null
          id?: string
          integration_id: string
          last_sync_at?: string | null
          name: string
          provider: string
          status?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          credentials?: Json | null
          error_message?: string | null
          id?: string
          integration_id?: string
          last_sync_at?: string | null
          name?: string
          provider?: string
          status?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          crm_sync_status: string | null
          email: string | null
          first_contact_at: string | null
          follow_up_overdue: boolean | null
          id: string
          is_duplicate: boolean | null
          last_activity_at: string | null
          name: string
          next_follow_up: string | null
          notes: string | null
          phone: string
          priority: string
          source: string
          stage: string
          tags: string[] | null
          updated_at: string | null
          vehicle_interests: string[] | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          crm_sync_status?: string | null
          email?: string | null
          first_contact_at?: string | null
          follow_up_overdue?: boolean | null
          id?: string
          is_duplicate?: boolean | null
          last_activity_at?: string | null
          name: string
          next_follow_up?: string | null
          notes?: string | null
          phone: string
          priority?: string
          source?: string
          stage?: string
          tags?: string[] | null
          updated_at?: string | null
          vehicle_interests?: string[] | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          crm_sync_status?: string | null
          email?: string | null
          first_contact_at?: string | null
          follow_up_overdue?: boolean | null
          id?: string
          is_duplicate?: boolean | null
          last_activity_at?: string | null
          name?: string
          next_follow_up?: string | null
          notes?: string | null
          phone?: string
          priority?: string
          source?: string
          stage?: string
          tags?: string[] | null
          updated_at?: string | null
          vehicle_interests?: string[] | null
        }
        Relationships: []
      }
      manager_reviews: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          resolved_at: string | null
          reviewer_id: string
          reviewer_name: string
          status: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          resolved_at?: string | null
          reviewer_id: string
          reviewer_name: string
          status?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          resolved_at?: string | null
          reviewer_id?: string
          reviewer_name?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manager_reviews_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          ai_generated: boolean | null
          approved: boolean | null
          channel: string
          content: string
          conversation_id: string | null
          created_at: string | null
          delivered: boolean | null
          id: string
          read: boolean | null
          requires_approval: boolean | null
          role: string
          timestamp: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          approved?: boolean | null
          channel?: string
          content: string
          conversation_id?: string | null
          created_at?: string | null
          delivered?: boolean | null
          id?: string
          read?: boolean | null
          requires_approval?: boolean | null
          role?: string
          timestamp?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          approved?: boolean | null
          channel?: string
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          delivered?: boolean | null
          id?: string
          read?: boolean | null
          requires_approval?: boolean | null
          role?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_scenarios: {
        Row: {
          biweekly_payment: number | null
          created_at: string | null
          down_payment: number | null
          fees: number | null
          id: string
          interest_rate: number
          label: string
          monthly_payment: number
          quote_id: string | null
          selling_price: number
          taxes: number | null
          term_months: number
          total_cost: number
          trade_in_value: number | null
          vehicle_id: string | null
          vehicle_summary: string
        }
        Insert: {
          biweekly_payment?: number | null
          created_at?: string | null
          down_payment?: number | null
          fees?: number | null
          id?: string
          interest_rate?: number
          label: string
          monthly_payment: number
          quote_id?: string | null
          selling_price: number
          taxes?: number | null
          term_months?: number
          total_cost: number
          trade_in_value?: number | null
          vehicle_id?: string | null
          vehicle_summary: string
        }
        Update: {
          biweekly_payment?: number | null
          created_at?: string | null
          down_payment?: number | null
          fees?: number | null
          id?: string
          interest_rate?: number
          label?: string
          monthly_payment?: number
          quote_id?: string | null
          selling_price?: number
          taxes?: number | null
          term_months?: number
          total_cost?: number
          trade_in_value?: number | null
          vehicle_id?: string | null
          vehicle_summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_scenarios_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_scenarios_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          disclosure_included: boolean | null
          expires_at: string | null
          id: string
          lead_id: string | null
          quote_number: string
          revision: number | null
          sent_at: string | null
          status: string | null
          vehicle_ids: string[] | null
          viewed_at: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          disclosure_included?: boolean | null
          expires_at?: string | null
          id?: string
          lead_id?: string | null
          quote_number: string
          revision?: number | null
          sent_at?: string | null
          status?: string | null
          vehicle_ids?: string[] | null
          viewed_at?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          disclosure_included?: boolean | null
          expires_at?: string | null
          id?: string
          lead_id?: string | null
          quote_number?: string
          revision?: number | null
          sent_at?: string | null
          status?: string | null
          vehicle_ids?: string[] | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      routing_jobs: {
        Row: {
          created_at: string | null
          error_message: string | null
          finance_packet_id: string | null
          id: string
          last_retry_at: string | null
          response_at: string | null
          retry_count: number | null
          status: string | null
          submitted_at: string | null
          target: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          finance_packet_id?: string | null
          id?: string
          last_retry_at?: string | null
          response_at?: string | null
          retry_count?: number | null
          status?: string | null
          submitted_at?: string | null
          target?: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          finance_packet_id?: string | null
          id?: string
          last_retry_at?: string | null
          response_at?: string | null
          retry_count?: number | null
          status?: string | null
          submitted_at?: string | null
          target?: string
        }
        Relationships: [
          {
            foreignKeyName: "routing_jobs_finance_packet_id_fkey"
            columns: ["finance_packet_id"]
            isOneToOne: false
            referencedRelation: "finance_packets"
            referencedColumns: ["id"]
          },
        ]
      }
      supporting_documents: {
        Row: {
          created_at: string | null
          file_url: string | null
          finance_packet_id: string | null
          id: string
          label: string
          status: string | null
          type: string
          uploaded_at: string | null
        }
        Insert: {
          created_at?: string | null
          file_url?: string | null
          finance_packet_id?: string | null
          id?: string
          label: string
          status?: string | null
          type: string
          uploaded_at?: string | null
        }
        Update: {
          created_at?: string | null
          file_url?: string | null
          finance_packet_id?: string | null
          id?: string
          label?: string
          status?: string | null
          type?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supporting_documents_finance_packet_id_fkey"
            columns: ["finance_packet_id"]
            isOneToOne: false
            referencedRelation: "finance_packets"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          body: string | null
          created_at: string | null
          days_on_lot: number | null
          estimated_payment: number | null
          exterior_color: string | null
          features: string[] | null
          id: string
          interior_color: string | null
          inventory_source: string | null
          make: string
          mileage: string | null
          model: string
          msrp: number | null
          photo_url: string | null
          price: number
          status: string | null
          stock: string
          trim: string | null
          updated_at: string | null
          vin: string | null
          year: number
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          days_on_lot?: number | null
          estimated_payment?: number | null
          exterior_color?: string | null
          features?: string[] | null
          id?: string
          interior_color?: string | null
          inventory_source?: string | null
          make: string
          mileage?: string | null
          model: string
          msrp?: number | null
          photo_url?: string | null
          price: number
          status?: string | null
          stock: string
          trim?: string | null
          updated_at?: string | null
          vin?: string | null
          year: number
        }
        Update: {
          body?: string | null
          created_at?: string | null
          days_on_lot?: number | null
          estimated_payment?: number | null
          exterior_color?: string | null
          features?: string[] | null
          id?: string
          interior_color?: string | null
          inventory_source?: string | null
          make?: string
          mileage?: string | null
          model?: string
          msrp?: number | null
          photo_url?: string | null
          price?: number
          status?: string | null
          stock?: string
          trim?: string | null
          updated_at?: string | null
          vin?: string | null
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
