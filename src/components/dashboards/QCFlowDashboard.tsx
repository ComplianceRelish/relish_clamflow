"use client"

import React, { useState, useEffect } from 'react'
import clamflowAPI, { ApiResponse } from '../../lib/clamflow-api'
import { User } from '../../types/auth'
import QCFlowForm from './QCFlowForm'
import DepurationForm from '../forms/DepurationForm'

interface QCFlowDashboardProps {
  currentUser: User | null
}

interface QCMetrics {
  totalTests: number
  passedTests: number
  failedTests: number
  pendingTests: number
  averageTestTime: number
  complianceRate: number
  criticalFailures: number
  testsToday: number
}

interface QCTest {
  id: string
  test_type: string
  sample_id: string
  lot_id: string
  status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'conditional'
  priority: 'low' | 'medium' | 'high' | 'critical'
  qc_staff: string
  started_at: string
  completed_at?: string
  result_summary: string
  compliance_status: boolean
}

interface TestParameter {
  name: string
  expected_range: string
  actual_value: string
  status: 'pass' | 'fail' | 'warning'
}

const QCFlowDashboard: React.FC<QCFlowDashboardProps> = ({ currentUser }) => {
  const [activeView, setActiveView] = useState<'dashboard' | 'new_test' | 'depuration' | 'results' | 'compliance'>('dashboard')
  const [qcMetrics, setQCMetrics] = useState<QCMetrics>({
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    pendingTests: 0,
    averageTestTime: 0,
    complianceRate: 0,
    criticalFailures: 0,
    testsToday: 0
  })
  const [activeTests, setActiveTests] = useState<QCTest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [selectedTest, setSelectedTest] = useState<QCTest | null>(null)
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
    loadQCData()
    // Refresh every 90 seconds for real-time QC monitoring
    const interval = setInterval(loadQCData, 90000)
    return () => clearInterval(interval)
  }, [])

  const loadQCData = async () => {
    setLoading(true)
    setError('')

    try {
      // ✅ FIXED: Using ClamFlow API
      const [
        qcFormsResponse,
        depurationResponse,
        lotsResponse,
        auditResponse
      ] = await Promise.all([
        clamflowAPI.getQCForms(),
        clamflowAPI.getDepurationForms(),
        clamflowAPI.getLots(),
        clamflowAPI.getAuditLogs()
      ])

      // Process QC test data
      const tests: QCTest[] = []

      // Add QC forms as tests
      if (qcFormsResponse.success && qcFormsResponse.data) {
        qcFormsResponse.data.forEach(form => {
          tests.push({
            id: form.id,
            test_type: form.form_type || 'General QC',
            sample_id: form.sample_id || `QC-${form.id.slice(-6)}`,
            lot_id: form.lot_id,
            status: mapFormStatusToTestStatus(form.status),
            priority: calculateTestPriority(form),
            qc_staff: form.qc_staff_name || 'Unknown',
            started_at: form.created_at,
            completed_at: form.updated_at,
            result_summary: generateResultSummary(form),
            compliance_status: form.pass_fail_status !== 'fail'
          })
        })
      }

      // Add depuration tests
      if (depurationResponse.success && depurationResponse.data) {
        depurationResponse.data.forEach(form => {
          tests.push({
            id: form.id,
            test_type: 'Depuration Quality Check',
            sample_id: form.sample_id || `DEP-${form.id.slice(-6)}`,
            lot_id: form.lot_id,
            status: mapFormStatusToTestStatus(form.status),
            priority: calculateTestPriority(form),
            qc_staff: form.qc_staff_name || 'Unknown',
            started_at: form.created_at,
            completed_at: form.updated_at,
            result_summary: `Tank ${form.depuration_tank_id} - ${form.planned_duration}hrs`,
            compliance_status: form.status === 'completed'
          })
        })
      }

      setActiveTests(tests)
      calculateQCMetrics(tests)

    } catch (err: any) {
      console.error('❌ Failed to load QC data:', err)
      setError(err.message || 'Failed to load QC dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const mapFormStatusToTestStatus = (status: string): 'pending' | 'in_progress' | 'passed' | 'failed' | 'conditional' => {
    const statusMap = {
      'pending': 'pending',
      'pending_approval': 'in_progress',
      'approved': 'passed',
      'rejected': 'failed',
      'completed': 'passed',
      'active': 'in_progress'
    }
    return statusMap[status] || 'pending'
  }

  const calculateTestPriority = (form: any): 'low' | 'medium' | 'high' | 'critical' => {
    const age = calculateAgeInHours(form.created_at)
    if (form.pass_fail_status === 'fail') return 'critical'
    if (age > 24) return 'high'
    if (age > 8) return 'medium'
    return 'low'
  }

  const generateResultSummary = (form: any): string => {
    if (form.pass_fail_status === 'pass') return 'All parameters within acceptable range'
    if (form.pass_fail_status === 'fail') return 'Critical parameters failed - requires action'
    if (form.pass_fail_status === 'conditional') return 'Conditional pass - monitoring required'
    return 'Test in progress'
  }

  const calculateAgeInHours = (createdAt: string): number => {
    const now = new Date()
    const created = new Date(createdAt)
    return Math.round((now.getTime() - created.getTime()) / (1000 * 60 * 60))
  }

  const calculateQCMetrics = (tests: QCTest[]) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const testsToday = tests.filter(test => {
      const testDate = new Date(test.started_at)
      return testDate >= today
    }).length

    const passedTests = tests.filter(test => test.status === 'passed').length
    const failedTests = tests.filter(test => test.status === 'failed').length
    const pendingTests = tests.filter(test => test.status === 'pending' || test.status === 'in_progress').length
    const criticalFailures = tests.filter(test => test.priority === 'critical' && test.status === 'failed').length

    const completedTests = tests.filter(test => test.completed_at)
    const avgTestTime = completedTests.length > 0 ? 
      completedTests.reduce((sum, test) => {
        const start = new Date(test.started_at)
        const end = new Date(test.completed_at!)
        return sum + Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60))
      }, 0) / completedTests.length : 0

    const complianceTests = tests.filter(test => test.status !== 'pending' && test.status !== 'in_progress')
    const complianceRate = complianceTests.length > 0 ? 
      (complianceTests.filter(test => test.compliance_status).length / complianceTests.length) * 100 : 0

    const metrics: QCMetrics = {
      totalTests: tests.length,
      passedTests,
      failedTests,
      pendingTests,
      averageTestTime: avgTestTime,
      complianceRate,
      criticalFailures,
      testsToday
    }

    setQCMetrics(metrics)
  }

  const getStatusColor = (status: string): string => {
    const colors = {
      'pending': 'bg-gray-100 text-gray-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'passed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'conditional': 'bg-yellow-100 text-yellow-800'
    }
    return colors[status] || colors.pending
  }

  const getPriorityColor = (priority: string): string => {
    const colors = {
      'low': 'bg-gray-50 border-gray-200 text-gray-700',
      'medium': 'bg-yellow-50 border-yellow-200 text-yellow-800',
      'high': 'bg-orange-50 border-orange-200 text-orange-800',
      'critical': 'bg-red-50 border-red-200 text-red-800'
    }
    return colors[priority] || colors.low
  }

  const navigationItems = [
    { id: 'dashboard', label: 'QC Overview', icon: '🔬' },
    { id: 'new_test', label: 'New QC Test', icon: '➕' },
    { id: 'depuration', label: 'Depuration', icon: '💧' },
    { id: 'results', label: 'Test Results', icon: '📊' },
    { id: 'compliance', label: 'Compliance', icon: '📋' }
  ]

  // Handle navigation - close sidebar on mobile after selection
  const handleNavClick = (viewId: 'dashboard' | 'new_test' | 'depuration' | 'results' | 'compliance') => {
    setActiveView(viewId)
    if (isMobile) {
      setIsSidebarOpen(false)
    }
  }

  if (loading && activeTests.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading QC Dashboard...</p>
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
              <h1 className="text-xl font-bold text-gray-900">QC Control</h1>
              <p className="text-sm text-gray-600">Quality Control Center</p>
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
                  ? 'bg-green-100 text-green-700 border-l-4 border-green-700'
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
                QC Inspector: {currentUser?.full_name}
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
                qcMetrics.complianceRate >= 95 ? 'bg-green-100 text-green-800' :
                qcMetrics.complianceRate >= 85 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
              }`}>
                Compliance: {qcMetrics.complianceRate.toFixed(1)}%
              </div>
              <button
                onClick={loadQCData}
                disabled={loading}
                className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? '...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {activeView === 'dashboard' && (
            <div className="space-y-6">
              {/* QC Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                  <h3 className="text-sm font-medium text-gray-500">Total Tests</h3>
                  <p className="text-2xl font-bold text-blue-600">{qcMetrics.totalTests}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                  <h3 className="text-sm font-medium text-gray-500">Passed</h3>
                  <p className="text-2xl font-bold text-green-600">{qcMetrics.passedTests}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
                  <h3 className="text-sm font-medium text-gray-500">Failed</h3>
                  <p className="text-2xl font-bold text-red-600">{qcMetrics.failedTests}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
                  <h3 className="text-sm font-medium text-gray-500">Pending</h3>
                  <p className="text-2xl font-bold text-yellow-600">{qcMetrics.pendingTests}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
                  <h3 className="text-sm font-medium text-gray-500">Today</h3>
                  <p className="text-2xl font-bold text-purple-600">{qcMetrics.testsToday}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500">
                  <h3 className="text-sm font-medium text-gray-500">Avg Time (hrs)</h3>
                  <p className="text-2xl font-bold text-indigo-600">{qcMetrics.averageTestTime.toFixed(1)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-emerald-500">
                  <h3 className="text-sm font-medium text-gray-500">Compliance</h3>
                  <p className="text-2xl font-bold text-emerald-600">{qcMetrics.complianceRate.toFixed(1)}%</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-rose-500">
                  <h3 className="text-sm font-medium text-gray-500">Critical</h3>
                  <p className="text-2xl font-bold text-rose-600">{qcMetrics.criticalFailures}</p>
                </div>
              </div>

              {/* Active Tests */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Active QC Tests</h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sample ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inspector</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {activeTests.slice(0, 10).map(test => (
                        <tr key={test.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{test.test_type}</p>
                              <p className="text-sm text-gray-500">{test.result_summary}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                              {test.sample_id}
                            </code>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(test.status)}`}>
                              {test.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs rounded border ${getPriorityColor(test.priority)}`}>
                              {test.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{test.qc_staff}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {new Date(test.started_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedTest(test)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Critical Failures Alert */}
              {qcMetrics.criticalFailures > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <span className="text-red-600 text-2xl mr-3">⚠️</span>
                    <div>
                      <h3 className="text-lg font-semibold text-red-900">Critical QC Failures</h3>
                      <p className="text-red-700">
                        {qcMetrics.criticalFailures} test(s) have critical failures requiring immediate corrective action
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === 'new_test' && (
            <QCFlowForm
              currentUser={currentUser}
              onSubmit={() => {
                loadQCData()
                setActiveView('dashboard')
              }}
            />
          )}

          {activeView === 'depuration' && (
            <DepurationForm
              currentUser={currentUser}
              onSubmit={() => {
                loadQCData()
                setActiveView('dashboard')
              }}
            />
          )}

          {activeView === 'results' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Test Results Analysis</h3>
              
              {/* Test Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTests.filter(test => test.status === 'passed' || test.status === 'failed').map(test => (
                  <div key={test.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-gray-900">{test.test_type}</h4>
                      <span className={`px-2 py-1 text-xs rounded ${getStatusColor(test.status)}`}>
                        {test.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p><strong>Sample:</strong> {test.sample_id}</p>
                      <p><strong>Inspector:</strong> {test.qc_staff}</p>
                      <p><strong>Result:</strong> {test.result_summary}</p>
                      <p><strong>Completed:</strong> {test.completed_at ? new Date(test.completed_at).toLocaleString() : 'In Progress'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'compliance' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Compliance Dashboard</h3>
              
              {/* Compliance Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-6 border rounded-lg">
                  <div className={`text-4xl font-bold mb-2 ${
                    qcMetrics.complianceRate >= 95 ? 'text-green-600' :
                    qcMetrics.complianceRate >= 85 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {qcMetrics.complianceRate.toFixed(1)}%
                  </div>
                  <p className="text-gray-600">Overall Compliance Rate</p>
                </div>
                <div className="text-center p-6 border rounded-lg">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {qcMetrics.passedTests}
                  </div>
                  <p className="text-gray-600">Compliant Tests</p>
                </div>
                <div className="text-center p-6 border rounded-lg">
                  <div className="text-4xl font-bold text-red-600 mb-2">
                    {qcMetrics.failedTests}
                  </div>
                  <p className="text-gray-600">Non-Compliant Tests</p>
                </div>
              </div>

              {/* Compliance Actions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Generate Compliance Report</h4>
                    <p className="text-sm text-gray-600">Create detailed compliance analysis</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Generate
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Review Critical Failures</h4>
                    <p className="text-sm text-gray-600">Investigate and document critical issues</p>
                  </div>
                  <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                    Review
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Test Details Modal */}
      {selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Test Details</h3>
                <button
                  onClick={() => setSelectedTest(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div><strong>Test Type:</strong> {selectedTest.test_type}</div>
                <div><strong>Sample ID:</strong> {selectedTest.sample_id}</div>
                <div><strong>Lot ID:</strong> {selectedTest.lot_id}</div>
                <div><strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 text-xs rounded ${getStatusColor(selectedTest.status)}`}>
                    {selectedTest.status}
                  </span>
                </div>
                <div><strong>Priority:</strong> 
                  <span className={`ml-2 px-2 py-1 text-xs rounded border ${getPriorityColor(selectedTest.priority)}`}>
                    {selectedTest.priority}
                  </span>
                </div>
                <div><strong>Inspector:</strong> {selectedTest.qc_staff}</div>
                <div><strong>Started:</strong> {new Date(selectedTest.started_at).toLocaleString()}</div>
                {selectedTest.completed_at && (
                  <div><strong>Completed:</strong> {new Date(selectedTest.completed_at).toLocaleString()}</div>
                )}
                <div><strong>Result Summary:</strong> {selectedTest.result_summary}</div>
                <div><strong>Compliance:</strong> 
                  <span className={`ml-2 ${selectedTest.compliance_status ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedTest.compliance_status ? '✅ Compliant' : '❌ Non-Compliant'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QCFlowDashboard