// __tests__/type-check.ts - SCHEMA COMPLIANT TESTS

import { User, UserRole } from '../types/auth';

// ✅ FIXED: Schema-compliant test user (snake_case)
const testUser: User = {
  id: '1',
  username: 'test_user',
  full_name: 'Test User',
  role: 'production_staff', // ✅ Correct snake_case format
  station: 'Station 1',
  is_active: true,
  last_login: '2023-01-01T00:00:00Z',
  created_at: '2023-01-01T00:00:00Z',
  password_reset_required: false,
  login_attempts: 0,
};

// ✅ FIXED: Schema-compliant role test
const testRole: UserRole = 'qc_staff'; // ✅ Correct snake_case format

// ✅ FIXED: All valid roles from schema CHECK constraint (snake_case)
const validRoles: UserRole[] = [
  'super_admin',
  'admin',
  'staff_lead',
  'production_lead',
  'production_staff',
  'qc_staff',
  'qc_lead',
  'security_guard'
];

// Test role validation function
function isValidRole(role: string): role is UserRole {
  return validRoles.includes(role as UserRole);
}

// Example usage
const sampleRole = 'qc_staff';
if (isValidRole(sampleRole)) {
  console.log(`${sampleRole} is a valid role`);
}

console.log('Type checking passed!');