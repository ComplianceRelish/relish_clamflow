// __tests__/type-check.ts - SCHEMA COMPLIANT TESTS

import { User, UserRole } from '../types/auth';

// ✅ Use only in type assertions or remove if not used
const testUser: User = {
  id: '1',
  username: 'test_user',
  full_name: 'Test User',
  role: 'Production Staff',
  station: 'Station 1',
  is_active: true,
  last_login: '2023-01-01T00:00:00Z',
  created_at: '2023-01-01T00:00:00Z',
};

// ✅ Remove unused variable or use it
const testRole: UserRole = 'QC Staff';

// ✅ FIXED: Schema-compliant role test (Title Case with spaces)
const validRoles: UserRole[] = [
  'Super Admin',
  'Admin',
  'Staff Lead',
  'Production Lead',
  'Production Staff',
  'QC Staff',
  'QC Lead',
  'Security Guard'
];

// Test role validation function
function isValidRole(role: string): role is UserRole {
  return validRoles.includes(role as UserRole);
}

// Example usage
const sampleRole = 'QC Staff';
if (isValidRole(sampleRole)) {
  console.log(`${sampleRole} is a valid role`);
}

// Use the variables to avoid "unused" warnings
console.log('Type checking passed!', { testUser, testRole });