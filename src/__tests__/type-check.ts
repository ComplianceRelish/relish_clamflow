// Type checking tests for ClamFlow Frontend

import { User, UserRole } from '../types';
import { ApiResponse } from '../types/api';

// Test User type
const testUser: User = {
  id: '1',
  username: 'test_user',
  full_name: 'Test User',
  role: 'Production Staff', // Fixed: Use valid role
  station: 'Station 1',
  is_active: true,
  last_login: '2023-01-01T00:00:00Z',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  password_reset_required: false,
  login_attempts: 0,
};

// Test UserRole type
const testRole: UserRole = 'QC Staff'; // Fixed: Use valid role

// Test ApiResponse type
const testApiResponse: ApiResponse<User> = {
  success: true,
  data: testUser,
};

// Test all valid roles
const validRoles: UserRole[] = [
  'Super Admin',
  'Admin',
  'Production Lead',
  'QC Lead',
  'Staff Lead',
  'QC Staff',
  'Production Staff',
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

console.log('Type checking passed!');