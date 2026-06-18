'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import InteractiveShiftCalendar from '../../components/InteractiveShiftCalendar'

export default function ShiftSchedulingPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  const getDepartmentFromRole = (role: string): string => {
    switch (role) {
      case 'Production Lead':
      case 'Production Staff':
        return 'PPC'
      case 'QC Lead':
      case 'QC Staff':
        return 'FP'
      case 'Admin':
      case 'Super Admin':
      case 'Staff Lead':
        return 'Both'
      case 'Security Guard':
        return 'Security'
      default:
        return 'Both'
    }
  }

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login')
        return
      }

      const authorizedRoles = ['Production Lead', 'QC Lead', 'Staff Lead', 'Admin', 'Super Admin']
      const hasPermission = authorizedRoles.includes(user.role)
      
      if (!hasPermission) {
        router.push('/dashboard')
        return
      }

      setIsAuthorized(true)
    }
  }, [user, isLoading, router])

  // NOTE: shift saves are handled entirely inside InteractiveShiftCalendar via
  // clamflowAPI.createShiftAssignment() → POST /api/shifts/shift-assignments
  // No page-level save handler is needed.

  const handleConflictDetected = (conflicts: any[]) => {
    console.warn('Shift conflicts detected:', conflicts)
    alert(`Shift conflict detected! ${conflicts.length} conflicting shifts found. Please resolve before saving.`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Shift Scheduling...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    )
  }

  const currentUser = user ? {
    role: user.role,
    department: getDepartmentFromRole(user.role)
  } : undefined

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Back Navigation Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-12">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-md transition-colors"
            >
              <span className="mr-1">←</span> Back to Dashboard
            </button>
            <span className="ml-4 text-sm font-medium text-gray-800">Shift Scheduling</span>
          </div>
        </div>
      </div>

      <InteractiveShiftCalendar 
        currentUser={currentUser}
        onConflictDetected={handleConflictDetected}
      />
    </div>
  )
}