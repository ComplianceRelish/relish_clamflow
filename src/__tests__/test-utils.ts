// Basic test utilities for ClamFlow Frontend
// This file provides testing utilities until E2E testing is fully configured

// Note: Install these dependencies to use the test utilities:
// npm install --save-dev @testing-library/react @testing-library/user-event @testing-library/jest-dom

// Uncomment when testing libraries are installed:
// import { render, screen } from '@testing-library/react'
// import userEvent from '@testing-library/user-event'
// import { ReactElement } from 'react'

// Test data factories
export const createTestUser = (overrides = {}) => ({
  id: 'test-user-id',
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
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createTestWeightNote = (overrides = {}) => ({
  id: 'test-weight-note-id',
  clam_id: 'clam-001',
  weight: 150,
  grade: 'A' as const,
  quality_check: true,
  notes: 'Test weight note',
  created_by: 'test-user-id',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createTestPPCForm = (overrides = {}) => ({
  id: 'test-ppc-form-id',
  batch_id: 'batch-001',
  temperature: 4.5,
  ph_level: 7.2,
  salinity: 35.0,
  operator_id: 'test-user-id',
  timestamp: new Date().toISOString(),
  approved: false,
  ...overrides,
})

// API mocking helpers
export const mockSuccessfulAPI = (data: any) => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      success: true,
      data,
      message: 'Success',
    }),
  })
}

export const mockFailedAPI = (error: string) => {
  return Promise.resolve({
    ok: false,
    json: () => Promise.resolve({
      success: false,
      error,
      message: 'API Error',
    }),
  })
}

// Utility functions
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const generateId = () => `test-id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Constants for testing
export const TEST_CONSTANTS = {
  DEFAULT_PLANT_ID: 'plant_001',
  DEFAULT_USER_ROLE: 'qa_technician',
  DEFAULT_TIMEOUT: 5000,
  API_BASE_URL: 'https://test-api.railway.app',
}

export default {
  createTestUser,
  createTestWeightNote,
  createTestPPCForm,
  mockSuccessfulAPI,
  mockFailedAPI,
  wait,
  generateId,
  TEST_CONSTANTS
}
