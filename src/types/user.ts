// src/types/user.ts
// In your types/user.ts or wherever User interface is defined
interface User {
  id: string
  username: string  // ✅ Required (remove the ?)
  email: string
  role: string
  station_assignment: string
  full_name: string
  is_active: boolean
  last_login?: string
  created_at: string
  biometric_enrolled: boolean
  permissions: string[]
  department?: string
  supervisor_id?: string
  emergency_contact?: string
  certification_level?: string
}