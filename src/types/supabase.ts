// CORRECTED Supabase Types - Based on ACTUAL ClamFlow Schema
// Generated from your real database schema

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
      user_profiles: {
        Row: {
          id: string;
          full_name: string;
          role: 'Super Admin' | 'Admin' | 'Staff Lead' | 'Production Lead' | 'Production Staff' | 'QC Staff' | 'QC Lead' | 'Security Guard';
          station?: string;
          created_at?: string;
          username?: string;
          password_hash?: string;
          is_active?: boolean;
          last_login?: string;
          login_attempts?: number;
          password_reset_required?: boolean;
        };
        Insert: {
          id?: string;
          full_name: string;
          role: 'Super Admin' | 'Admin' | 'Staff Lead' | 'Production Lead' | 'Production Staff' | 'QC Staff' | 'QC Lead' | 'Security Guard';
          station?: string;
          created_at?: string;
          username?: string;
          password_hash?: string;
          is_active?: boolean;
          last_login?: string;
          login_attempts?: number;
          password_reset_required?: boolean;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: 'Super Admin' | 'Admin' | 'Staff Lead' | 'Production Lead' | 'Production Staff' | 'QC Staff' | 'QC Lead' | 'Security Guard';
          station?: string;
          created_at?: string;
          username?: string;
          password_hash?: string;
          is_active?: boolean;
          last_login?: string;
          login_attempts?: number;
          password_reset_required?: boolean;
        };
      };
      weight_notes: {
        Row: {
          id: string;
          lot_id: string; // NOT NULL - Required
          supplier_id: string; // NOT NULL - Required  
          box_number: string; // NOT NULL - Required
          weight: number; // NOT NULL - Required (note: it's 'weight' not 'weight_kg')
          qc_staff_id: string; // NOT NULL - Required
          qc_approved?: boolean;
          qc_approved_at?: string;
          qc_approved_by?: string;
          created_at?: string;
          // NEW columns from migration (already exist in your schema!)
          authentication_step?: number;
          production_staff_id?: string;
          supplier_authenticated_by?: string;
          production_auth_method?: 'face_recognition' | 'rfid' | 'fallback';
          supplier_auth_method?: 'face_recognition' | 'rfid' | 'fallback';
          qc_approval_status?: 'pending' | 'approved' | 'rejected';
          rejection_reason?: string;
          production_lead_notified?: boolean;
          production_lead_notified_at?: string;
          production_auth_at?: string;
          supplier_auth_at?: string;
          workflow_completed?: boolean;
          workflow_completed_at?: string;
        };
        Insert: {
          id?: string;
          lot_id: string; // Required
          supplier_id: string; // Required
          box_number: string; // Required
          weight: number; // Required
          qc_staff_id: string; // Required
          qc_approved?: boolean;
          qc_approved_at?: string;
          qc_approved_by?: string;
          created_at?: string;
          authentication_step?: number;
          production_staff_id?: string;
          supplier_authenticated_by?: string;
          production_auth_method?: 'face_recognition' | 'rfid' | 'fallback';
          supplier_auth_method?: 'face_recognition' | 'rfid' | 'fallback';
          qc_approval_status?: 'pending' | 'approved' | 'rejected';
          rejection_reason?: string;
          production_lead_notified?: boolean;
          production_lead_notified_at?: string;
          production_auth_at?: string;
          supplier_auth_at?: string;
          workflow_completed?: boolean;
          workflow_completed_at?: string;
        };
        Update: {
          id?: string;
          lot_id?: string;
          supplier_id?: string;
          box_number?: string;
          weight?: number;
          qc_staff_id?: string;
          qc_approved?: boolean;
          qc_approved_at?: string;
          qc_approved_by?: string;
          created_at?: string;
          authentication_step?: number;
          production_staff_id?: string;
          supplier_authenticated_by?: string;
          production_auth_method?: 'face_recognition' | 'rfid' | 'fallback';
          supplier_auth_method?: 'face_recognition' | 'rfid' | 'fallback';
          qc_approval_status?: 'pending' | 'approved' | 'rejected';
          rejection_reason?: string;
          production_lead_notified?: boolean;
          production_lead_notified_at?: string;
          production_auth_at?: string;
          supplier_auth_at?: string;
          workflow_completed?: boolean;
          workflow_completed_at?: string;
        };
      };
      suppliers: {
        Row: {
          id: string;
          type: 'boat_owner' | 'agent';
          first_name: string;
          last_name: string;
          address: string;
          contact_number: string;
          aadhar_number?: string;
          face_image?: string;
          boat_registration_number?: string;
          gst_number?: string;
          linked_boat_owners?: Json;
          start_date?: string;
          status?: 'pending' | 'approved' | 'rejected';
          submitted_by?: string;
          approved_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          type: 'boat_owner' | 'agent';
          first_name: string;
          last_name: string;
          address: string;
          contact_number: string;
          aadhar_number?: string;
          face_image?: string;
          boat_registration_number?: string;
          gst_number?: string;
          linked_boat_owners?: Json;
          start_date?: string;
          status?: 'pending' | 'approved' | 'rejected';
          submitted_by?: string;
          approved_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: 'boat_owner' | 'agent';
          first_name?: string;
          last_name?: string;
          address?: string;
          contact_number?: string;
          aadhar_number?: string;
          face_image?: string;
          boat_registration_number?: string;
          gst_number?: string;
          linked_boat_owners?: Json;
          start_date?: string;
          status?: 'pending' | 'approved' | 'rejected';
          submitted_by?: string;
          approved_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      lots: {
        Row: {
          id: string;
          lot_number: string;
          status?: 'in_progress' | 'completed' | 'rejected';
          created_at?: string;
          created_by: string;
          completed_at?: string;
          updated_at?: string;
          microbiology_approved?: boolean;
          microbiology_approved_at?: string;
          microbiology_approved_by?: string;
          microbiology_report_url?: string;
        };
        Insert: {
          id?: string;
          lot_number: string;
          status?: 'in_progress' | 'completed' | 'rejected';
          created_at?: string;
          created_by: string;
          completed_at?: string;
          updated_at?: string;
          microbiology_approved?: boolean;
          microbiology_approved_at?: string;
          microbiology_approved_by?: string;
          microbiology_report_url?: string;
        };
        Update: {
          id?: string;
          lot_number?: string;
          status?: 'in_progress' | 'completed' | 'rejected';
          created_at?: string;
          created_by?: string;
          completed_at?: string;
          updated_at?: string;
          microbiology_approved?: boolean;
          microbiology_approved_at?: string;
          microbiology_approved_by?: string;
          microbiology_report_url?: string;
        };
      };
      authentication_sessions: {
        Row: {
          id: string;
          weight_note_id: string;
          session_type: 'weight_note_creation' | 'qc_approval' | 'production_lead_review';
          current_step: number;
          qc_staff_id: string;
          production_staff_id?: string;
          supplier_id?: string;
          production_auth_method?: 'face_recognition' | 'rfid' | 'fallback';
          supplier_auth_method?: 'face_recognition' | 'rfid' | 'fallback';
          session_data?: Json;
          notes?: string;
          status?: 'active' | 'completed' | 'cancelled' | 'expired';
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          weight_note_id: string;
          session_type: 'weight_note_creation' | 'qc_approval' | 'production_lead_review';
          current_step?: number;
          qc_staff_id: string;
          production_staff_id?: string;
          supplier_id?: string;
          production_auth_method?: 'face_recognition' | 'rfid' | 'fallback';
          supplier_auth_method?: 'face_recognition' | 'rfid' | 'fallback';
          session_data?: Json;
          notes?: string;
          status?: 'active' | 'completed' | 'cancelled' | 'expired';
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          weight_note_id?: string;
          session_type?: 'weight_note_creation' | 'qc_approval' | 'production_lead_review';
          current_step?: number;
          qc_staff_id?: string;
          production_staff_id?: string;
          supplier_id?: string;
          production_auth_method?: 'face_recognition' | 'rfid' | 'fallback';
          supplier_auth_method?: 'face_recognition' | 'rfid' | 'fallback';
          session_data?: Json;
          notes?: string;
          status?: 'active' | 'completed' | 'cancelled' | 'expired';
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Add other tables as needed...
      staff: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          address: string;
          contact_number: string;
          aadhar_number: string;
          face_image?: string;
          designation: string;
          start_date?: string;
          status?: 'pending' | 'approved' | 'rejected';
          submitted_by?: string;
          approved_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          address: string;
          contact_number: string;
          aadhar_number: string;
          face_image?: string;
          designation: string;
          start_date?: string;
          status?: 'pending' | 'approved' | 'rejected';
          submitted_by?: string;
          approved_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          address?: string;
          contact_number?: string;
          aadhar_number?: string;
          face_image?: string;
          designation?: string;
          start_date?: string;
          status?: 'pending' | 'approved' | 'rejected';
          submitted_by?: string;
          approved_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_weight_note_auth_status: {
        Args: {
          note_id: string;
        };
        Returns: {
          current_step: number;
          qc_staff_name: string;
          production_staff_name: string;
          supplier_authenticated: boolean;
          qc_approval_status: string;
          workflow_complete: boolean;
        }[];
      };
      advance_weight_note_workflow: {
        Args: {
          note_id: string;
          staff_id: string;
          auth_method?: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Helper type aliases
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type WeightNote = Database['public']['Tables']['weight_notes']['Row'];
export type Supplier = Database['public']['Tables']['suppliers']['Row'];
export type Lot = Database['public']['Tables']['lots']['Row'];
export type AuthenticationSession = Database['public']['Tables']['authentication_sessions']['Row'];

// Extended types with joined data
export type WeightNoteWithStaff = WeightNote & {
  qc_staff?: { full_name: string; role: string };
  production_staff?: { full_name: string; role: string };
  supplier_auth?: { full_name: string; role: string };
  supplier?: Supplier;
  lot?: Lot;
};

// Form data types based on ACTUAL required fields
export type WeightNoteFormData = {
  lot_id: string; // Required
  supplier_id: string; // Required
  box_number: string; // Required
  weight: number; // Required (note: 'weight' not 'weight_kg')
  qc_staff_id: string; // Required
};