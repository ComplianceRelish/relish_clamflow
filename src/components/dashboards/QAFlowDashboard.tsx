"use client"

import React, { useState, useEffect } from 'react'
import clamflowAPI, { ApiResponse } from '../../lib/clamflow-api'
import { User } from '../../types/auth'
import WeightNoteForm from '../forms/WeightNoteForm'
import PPCForm from '../forms/PPCForm'
import FPForm from '../forms/FPForm'
import SampleExtractionForm from '../forms/SampleExtractionForm'

interface QAFlowDashboardProps {
  currentUser: User | null
}

interface QAMetrics {
  totalForms: number
  pendingReviews: number
  completedToday: number
  passRate: number
  averageProcessingTime: number
  criticalIssues: number
}

interface QAWorkflowItem {
  id: string
  type: 'weight_note' | 'ppc_form' | 'fp_form' | 'sample_extraction'
  title: string
  status: 'pending' | 'in_progress' | 'completed' | 'rejected'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assigned_to: string
  created_at: string
  updated_at: string
  completion_percentage: number
}

const QAFlowDashboard: React.FC<QAFlowDashboardProps> = ({ currentUser }) => {
  const [activeView, setActiveView] = useState<'dashboard' | 'weight_note' | 'ppc_form' | 'fp_form' | 'sample_extraction'>('dashboard')
  const [qaMetrics, setQAMetrics] = useState<QAMetrics>({
    totalForms: 0,
    pendingReviews: 0,
    completedToday: 0,
    passRate: 0,
    averageProcessingTime: 0,
    criticalIssues: 0
  })
  const [workflowItems, setWorkflowItems] = useState<QAWorkflowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    loadQAData()
    // Refresh every 2 minutes
    const interval = setInterval(loadQAData, 120000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadQAData = async () => {
    setLoading(true)
    setError('')

    try {
      // ✅ FIXED: Using ClamFlow API
      const [
        weightNotesResponse,
        ppcFormsResponse,
        fpFormsResponse,
        pendingApprovalsResponse
      ] = await Promise.all([
        clamflowAPI.getWeightNotes(),
        clamflowAPI.getPPCForms(),
        clamflowAPI.getFPForms(),
        clamflowAPI.getPendingApprovals()
      ])

      // Combine all forms into workflow items
      const workflows: QAWorkflowItem[] = []

      // Add weight notes
      if (weightNotesResponse.success && weightNotesResponse.data) {
        weightNotesResponse.data.forEach(note => {
          workflows.push({
            id: note.id,
            type: 'weight_note',
            title: `Weight Note - Box ${note.box_number}`,
            status: getStatusFromForm(note),
            priority: getPriorityFromForm(note),
            assigned_to: note.qc_staff_name || 'Unassigned',
            created_at: note.created_at,
            updated_at: note.updated_at,
            completion_percentage: calculateCompletion(note.status || 'pending')
          })
        })
      }

      // Add PPC forms
      if (ppcFormsResponse.success && ppcFormsResponse.data) {
        ppcFormsResponse.data.forEach(form => {
          workflows.push({
            id: form.id,
            type: 'ppc_form',
            title: `PPC Form - Box ${form.box_number}`,
            status: getStatusFromForm(form),
            priority: getPriorityFromForm(form),
            assigned_to: form.qc_staff_name || 'Unassigned',
            created_at: form.created_at,
            updated_at: form.updated_at,
            completion_percentage: calculateCompletion(form.status || 'pending')
          })
        })
      }

      // Add FP forms
      if (fpFormsResponse.success && fpFormsResponse.data) {
        fpFormsResponse.data.forEach(form => {
          workflows.push({
            id: form.id,
            type: 'fp_form',
            title: `Final Product - Box ${form.box_number}`,
            status: getStatusFromForm(form),
            priority: getPriorityFromForm(form),
            assigned_to: form.qc_staff_name || 'Unassigned',
            created_at: form.created_at,
            updated_at: form.updated_at,
            completion_percentage: calculateCompletion(form.status || 'pending')
          })
        })
      }

      setWorkflowItems(workflows)
      calculateQAMetrics(workflows, pendingApprovalsResponse.data || [])

    } catch (err: any) {
      console.error('❌ Failed to load QA data:', err)
      setError(err.message || 'Failed to load QA dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusFromForm = (form: any): 'pending' | 'in_progress' | 'completed' | 'rejected' => {
    if (form.status === 'approved') return 'completed'
    if (form.status === 'rejected') return 'rejected'
    if (form.status === 'pending_approval') return 'in_progress'
    return 'pending'
  }

  const getPriorityFromForm = (form: any): 'low' | 'medium' | 'high' | 'critical' => {
    const age = calculateAgeInHours(form.created_at)
    if (age > 48) return 'critical'
    if (age > 24) return 'high'
    if (age > 8) return 'medium'
    return 'low'
  }

  const calculateAgeInHours = (createdAt: string): number => {
    const now = new Date()
    const created = new Date(createdAt)
    return Math.round((now.getTime() - created.getTime()) / (1000 * 60 * 60))
  }

  const calculateCompletion = (status: string): number => {
    const completionMap: Record<string, number> = {
      'pending': 0,
      'in_progress': 50,
      'completed': 100,
      'rejected': 0
    }
    return completionMap[status] || 0
  }

  const calculateQAMetrics = (workflows: QAWorkflowItem[], pendingApprovals: any[]) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const completedToday = workflows.filter(item => {
      const updated = new Date(item.updated_at)
      return updated >= today && item.status === 'completed'
    }).length

    const totalCompleted = workflows.filter(item => item.status === 'completed').length
    const totalItems = workflows.length

    const metrics: QAMetrics = {
      totalForms: totalItems,
      pendingReviews: pendingApprovals.length,
      completedToday,
      passRate: totalItems > 0 ? (totalCompleted / totalItems) * 100 : 0,
      averageProcessingTime: calculateAverageProcessingTime(workflows),
      criticalIssues: workflows.filter(item => item.priority === 'critical').length
    }

    setQAMetrics(metrics)
  }

  const calculateAverageProcessingTime = (workflows: QAWorkflowItem[]): number => {
    const completedItems = workflows.filter(item => item.status === 'completed')
    if (completedItems.length === 0) return 0

    const totalHours = completedItems.reduce((sum, item) => {
      const created = new Date(item.created_at)
      const updated = new Date(item.updated_at)
      return sum + Math.round((updated.getTime() - created.getTime()) / (1000 * 60 * 60))
    }, 0)

    return totalHours / completedItems.length
  }

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'pending': 'bg-gray-100 text-gray-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    }
    return colors[status] || colors.pending
  }

  const getPriorityColor = (priority: string): string => {
    const colors: Record<string, string> = {
      'low': 'bg-green-100 text-green-800 border-green-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'high': 'bg-orange-100 text-orange-800 border-orange-200',
      'critical': 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[priority] || colors.low
  }

  const navigationItems = [
    { id: 'dashboard', label: 'QA Overview', icon: '📊' },
    { id: 'weight_note', label: 'Weight Notes', icon: '⚖️' },
    { id: 'ppc_form', label: 'PPC Forms', icon: '📦' },
    { id: 'fp_form', label: 'Final Products', icon: '✅' },
    { id: 'sample_extraction', label: 'Sampling', icon: '🧪' }
  ]

  // Handle navigation - close sidebar on mobile after selection
  const handleNavClick = (viewId: 'dashboard' | 'weight_note' | 'ppc_form' | 'fp_form' | 'sample_extraction') => {
    setActiveView(viewId)
    if (isMobile) {
      setIsSidebarOpen(false)
    }
  }

  if (loading && workflowItems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading QA Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100 relative">
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <div 
        className={`
          ${isMobile 
            ? `fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : 'relative flex-shrink-0'
          }
          w-64 bg-white shadow-lg
        `}
      >
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">QA Flow</h1>
              <p className="text-sm text-gray-600">Quality Assurance</p>
            </div>
            {isMobile && (
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="text-gray-500 p-1 hover:bg-gray-100 rounded"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        <nav className="p-4 overflow-y-auto max-h-[calc(100vh-100px)]">
          {navigationItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id as any)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 text-left transition-colors ${
                activeView === item.id
                  ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto min-w-0">
        {/* Header */}
        <div className="bg-white shadow-sm p-4 md:p-6 border-b sticky top-0 z-10">
          <div className="flex flex-wrap items-center gap-3">
            {/* Hamburger Menu Button for Mobile */}
            {isMobile && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                {navigationItems.find(item => item.id === activeView)?.label}
              </h2>
              <p className="text-gray-600 text-sm truncate">
                QA Staff: {currentUser?.full_name}
              </p>
            </div>
            
            <button
              onClick={loadQAData}
              disabled={loading}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div className="m-4 md:m-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="p-4 md:p-6">
          {activeView === 'dashboard' && (
            <div className="space-y-6">
              {/* QA Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                  <h3 className="text-sm font-medium text-gray-500">Total Forms</h3>
                  <p className="text-2xl font-bold text-blue-600">{qaMetrics.totalForms}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                  <h3 className="text-sm font-medium text-gray-500">Pending Reviews</h3>
                  <p className="text-2xl font-bold text-yellow-600">{qaMetrics.pendingReviews}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                  <h3 className="text-sm font-medium text-gray-500">Completed Today</h3>
                  <p className="text-2xl font-bold text-green-600">{qaMetrics.completedToday}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-emerald-500">
                  <h3 className="text-sm font-medium text-gray-500">Pass Rate</h3>
                  <p className="text-2xl font-bold text-emerald-600">{(qaMetrics.passRate ?? 0).toFixed(1)}%</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                  <h3 className="text-sm font-medium text-gray-500">Avg Time (hrs)</h3>
                  <p className="text-2xl font-bold text-purple-600">{(qaMetrics.averageProcessingTime ?? 0).toFixed(1)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
                  <h3 className="text-sm font-medium text-gray-500">Critical Issues</h3>
                  <p className="text-2xl font-bold text-red-600">{qaMetrics.criticalIssues}</p>
                </div>
              </div>

              {/* Workflow Items */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Active QA Workflows</h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {workflowItems.slice(0, 10).map(item => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{item.title}</p>
                              <p className="text-sm text-gray-500">{item.type.replace('_', ' ')}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                              {item.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded border ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{item.assigned_to}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${item.completion_percentage}%` }}
                                ></div>
                              </div>
                              <span className="ml-2 text-xs text-gray-600">{item.completion_percentage}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {calculateAgeInHours(item.created_at)}h
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Critical Items Alert */}
              {qaMetrics.criticalIssues > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <span className="text-red-600 text-2xl mr-3">🚨</span>
                    <div>
                      <h3 className="text-lg font-semibold text-red-900">Critical Issues Detected</h3>
                      <p className="text-red-700">
                        {qaMetrics.criticalIssues} item(s) require immediate attention (over 48 hours old)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === 'weight_note' && (
            <WeightNoteForm
              currentUser={currentUser}
              onSubmit={() => {
                loadQAData()
                setActiveView('dashboard')
              }}
              onCancel={() => setActiveView('dashboard')}
            />
          )}

          {activeView === 'ppc_form' && (
            <PPCForm
              currentUser={currentUser}
              onSubmit={() => {
                loadQAData()
                setActiveView('dashboard')
              }}
            />
          )}

          {activeView === 'fp_form' && (
            <FPForm
              currentUser={currentUser}
              onSubmit={() => {
                loadQAData()
                setActiveView('dashboard')
              }}
            />
          )}

          {activeView === 'sample_extraction' && (
            <SampleExtractionForm
              currentUser={currentUser}
              onSubmit={() => {
                loadQAData()
                setActiveView('dashboard')
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default QAFlowDashboard