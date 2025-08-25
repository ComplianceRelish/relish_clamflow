// Basic type check test for ClamFlow types
import {
  // Core types
  BaseEntity,
  Status,
  ProcessingStatus,
  Location,
  Plant,
  ContactInfo,
  
  // Form types
  WeightNoteFormData,
  PPCFormData,
  FPFormData,
  
  // API types
  APIResponse,
  
  // Auth types
  User,
  UserRole,
  
  // Label types
  LabelTemplate,
  QRCodeData,
  
  // RFID types
  RFIDTag,
  
  // Inventory types
  Product,
  InventoryItem
} from '../types'

// Type checking function to ensure all imports work
export function typeCheck() {
  console.log('✅ All ClamFlow types imported successfully!')
  
  // Sample type usage
  const user: User = {
    id: 'test-id',
    username: 'testuser',
    email: 'test@clamflow.com',
    first_name: 'Test',
    last_name: 'User',
    full_name: 'Test User',
    role: 'qa_technician',
    plant_id: 'plant_001',
    department: 'Quality Assurance',
    status: 'active',
    is_first_login: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const plant: Plant = {
    id: 'plant_001',
    name: 'Main Processing Plant',
    code: 'MPP',
    location: {
      latitude: -36.8485,
      longitude: 174.7633,
      city: 'Auckland',
      country: 'New Zealand'
    },
    status: 'active',
    capacity: 10000,
    plant_type: 'processing',
    certifications: ['HACCP', 'ISO22000'],
    contact_info: {
      email: 'plant@clamflow.com',
      phone: '+64-9-123-4567'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const api_response: APIResponse<string> = {
    success: true,
    data: 'test-data',
    message: 'Success'
  }

  return { user, plant, api_response }
}

export default typeCheck
