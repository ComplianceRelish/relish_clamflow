// src/types/weight-note.ts
export interface WeightNote {
  id: string;
  staff_id: string;
  vessel_name: string;
  clam_source: string;
  gross_weight: number;
  tare_weight: number;
  net_weight: number;
  unit: 'kg' | 'lbs';
  moisture_content: number;
  quality_grade: 'Premium' | 'Standard' | 'Reject';
  station: string;
  timestamp: string;
  status: 'pending' | 'verified' | 'approved';
  verified_by?: string;
  approved_by?: string;
}