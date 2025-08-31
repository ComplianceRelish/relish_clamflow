// frontend/types/supabase.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      personnel_records: {
        Row: {
          id: string
          employee_id: string
          full_name: string
          role: string
          department: string
          status: string
          contact_info: Json
          biometric_data: Json
          rfid_ids: string[] | null
          digital_signature: string | null
          qr_code_data: Json | null
          permissions: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          full_name: string
          role: string
          department: string
          status?: string
          contact_info?: Json
          biometric_data?: Json
          rfid_ids?: string[] | null
          digital_signature?: string | null
          qr_code_data?: Json | null
          permissions?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          full_name?: string
          role?: string
          department?: string
          status?: string
          contact_info?: Json
          biometric_data?: Json
          rfid_ids?: string[] | null
          digital_signature?: string | null
          qr_code_data?: Json | null
          permissions?: Json
          created_at?: string
          updated_at?: string
        }
      }
      weight_notes: {
        Row: {
          id: string
          weight_note_number: string
          product_info: Json
          supplier_info: Json
          gross_weight: number
          tare_weight: number
          net_weight: number
          quality_parameters: Json
          qc_authentication: Json | null
          production_authentication: Json | null
          supplier_authentication: Json | null
          workflow_status: string
          workflow_metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          weight_note_number?: string
          product_info: Json
          supplier_info: Json
          gross_weight: number
          tare_weight: number
          quality_parameters?: Json
          qc_authentication?: Json | null
          production_authentication?: Json | null
          supplier_authentication?: Json | null
          workflow_status?: string
          workflow_metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          weight_note_number?: string
          product_info?: Json
          supplier_info?: Json
          gross_weight?: number
          tare_weight?: number
          quality_parameters?: Json
          qc_authentication?: Json | null
          production_authentication?: Json | null
          supplier_authentication?: Json | null
          workflow_status?: string
          workflow_metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      authentication_sessions: {
        Row: {
          id: string
          session_id: string
          weight_note_id: string | null
          authentication_step: string
          required_role: string
          staff_id: string | null
          authentication_method: string | null
          authentication_data: Json | null
          session_status: string
          expires_at: string
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id?: string
          weight_note_id?: string | null
          authentication_step: string
          required_role: string
          staff_id?: string | null
          authentication_method?: string | null
          authentication_data?: Json | null
          session_status?: string
          expires_at?: string
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          weight_note_id?: string | null
          authentication_step?: string
          required_role?: string
          staff_id?: string | null
          authentication_method?: string | null
          authentication_data?: Json | null
          session_status?: string
          expires_at?: string
          completed_at?: string | null
          created_at?: string
        }
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
  }
}

// Custom types for Weight Note system
export interface WeightNoteData {
  id?: string
  weight_note_number?: string
  product_info: {
    product_code: string
    product_name: string
    batch_number?: string
    variety?: string
    grade?: string
  }
  supplier_info: {
    supplier_code: string
    supplier_name: string
    contact_person?: string
    vehicle_number?: string
  }
  gross_weight: number
  tare_weight: number
  net_weight?: number
  quality_parameters?: {
    temperature?: number
    moisture_content?: number
    foreign_objects?: boolean
    visual_inspection_notes?: string
    test_results?: Json
  }
  qc_authentication?: AuthenticationRecord
  production_authentication?: AuthenticationRecord
  supplier_authentication?: AuthenticationRecord
  workflow_status?: string
  workflow_metadata?: Json
  created_at?: string
  updated_at?: string
}

export interface AuthenticationRecord {
  staff_id: string
  staff_name: string
  timestamp: string
  method: 'face_recognition' | 'rfid' | 'fallback_approval'
  digital_signature?: string
  biometric_confidence?: number
  rfid_data?: string
  fallback_reason?: string
  production_lead_approval?: boolean
}

export interface PersonnelRecord {
  id: string
  employee_id: string
  full_name: string
  role: string
  department: string
  status: string
  contact_info: Json
  biometric_data: Json
  rfid_ids?: string[]
  digital_signature?: string
  qr_code_data?: Json
  permissions: Json
}

export interface AuthenticationSession {
  id: string
  session_id: string
  weight_note_id?: string
  authentication_step: string
  required_role: string
  staff_id?: string
  authentication_method?: string
  authentication_data?: Json
  session_status: string
  expires_at: string
  completed_at?: string
}