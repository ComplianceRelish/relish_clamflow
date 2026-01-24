// src/services/onboarding.ts
import { apiClient, ApiResponse } from './api';
import { AxiosResponse } from 'axios';

export interface StaffOnboardingData {
  entity_type: string;
  full_name: string;
  username: string;
  role: string;
  contact_email: string;
  contact_phone: string;
  aadhar_number: string;
  department: string;
  work_location: string;
  shift_pattern: string;
  joining_date: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  bank_account_number: string;
  ifsc_code: string;
  bank_name: string;
  account_holder_name: string;
  attendance_method: string;
  rfid_card_number: string;
  biometric_consent: boolean;
  face_image_data?: string | null;
  date_of_birth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OnboardingResponse {
  id: string;
  entity_type: string;
  status: string;
  created_at: string;
  approved_at?: string;
}

class OnboardingService {
  private baseUrl = '/api/onboarding';

  // Returns AxiosResponse matching apiClient.post return type
  async create(staffData: StaffOnboardingData): Promise<AxiosResponse<OnboardingResponse>> {
    return await apiClient.post<OnboardingResponse>(
      `${this.baseUrl}/staff`,
      staffData
    );
  }

  async getSteps(): Promise<{ steps: [] }> {
    return { steps: [] };
  }

  async completeStep(stepId: string): Promise<{ completed: true }> {
    return { completed: true };
  }

  async getProgress(): Promise<{ progress: 0 }> {
    return { progress: 0 };
  }
}

export const onboardingService = new OnboardingService();