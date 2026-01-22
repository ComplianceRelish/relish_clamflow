// Example usage of the updated API Client with generic HTTP methods
import { apiClient } from '../lib/api-client'

// Example service using the new generic HTTP methods
export class ExampleAPIService {
  
  // Using the generic GET method
  async getUsers() {
    return await apiClient.get('/api/users/')
  }

  // Using the generic POST method
  async createUser(userData: any) {
    return await apiClient.post('/api/users/', userData)
  }

  // Using the generic PUT method
  async updateUser(id: string, userData: any) {
    return await apiClient.put(`/api/users/${id}`, userData)
  }

  // Using the generic DELETE method
  async deleteUser(id: string) {
    return await apiClient.delete(`/api/users/${id}`)
  }

  // Using the generic PATCH method
  async updateUserPartial(id: string, userData: any) {
    return await apiClient.patch(`/api/users/${id}`, userData)
  }

  // Example with custom configuration
  async getDataWithTimeout(endpoint: string) {
    return await apiClient.get(endpoint, {
      timeout: 10000,
      headers: {
        'Custom-Header': 'custom-value'
      }
    })
  }
}

// Example security event creation using updated types
export function createSecurityEvent() {
  const securityEvent = {
    id: 'sec-event-001',
    user_id: 'user-123',
    type: 'AUTH_SUCCESS' as const,
    method: 'fingerprint' as const,
    message: 'User authenticated successfully',
    timestamp: new Date().toISOString(),
    location: {
      latitude: -36.8485,
      longitude: 174.7633
    },
    metadata: {
      device: 'biometric-reader-01',
      confidence: 0.95
    }
  }
  
  return securityEvent
}

// Example biometric authentication request using updated types
export function createBiometricAuthRequest() {
  const authRequest = {
    method: 'facial' as const,
    deviceId: 'bio-device-001',
    timestamp: new Date().toISOString(),
    location: {
      latitude: -36.8485,
      longitude: 174.7633
    }
  }
  
  return authRequest
}

// Example RFID operations using updated types
export function createRFIDScanResult() {
  const scanResult = {
    tagId: 'tag-001',
    readerId: 'reader-001',
    timestamp: new Date().toISOString(),
    rssi: -45,
    location: 'Gate A',
    data: {
      employeeId: 'emp-001',
      department: 'QA'
    }
  }
  
  return scanResult
}

export function createBatchScanOperation() {
  const batchOperation = {
    readerIds: ['reader-001', 'reader-002'],
    duration: 30000, // 30 seconds
    mode: 'inventory' as const,
    filters: {
      rssiThreshold: -60,
      duplicateWindow: 5000 // 5 seconds
    }
  }
  
  return batchOperation
}

// Example updated RFID reader configuration
export function createRFIDReader() {
  const reader = {
    id: 'reader-001',
    name: 'Gate A Reader',
    location: 'Main Entrance Gate A',
    ip_address: '192.168.1.100',
    port: 8080,
    status: 'online' as const,
    read_range: 5.0,
    last_seen: new Date().toISOString(),
    firmware_version: '2.1.4',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  return reader
}

export default ExampleAPIService
