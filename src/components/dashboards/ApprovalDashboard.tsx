"use client"

import React, { useState, useEffect } from 'react'
import clamflowAPI, { ApiResponse } from '../../lib/clamflow-api'
import { User } from '../../types/auth'
import PendingFormViewer from '../forms/PendingFormViewer'

interface ApprovalDashboardProps {
  currentUser: User | null
}

interface ApprovalStats {
  totalPending: number
  highPriority: number
  mediumPriority: number
  lowPriority: number
  approvedToday: number
  rejectedToday: number
  avgApprovalTime: number
}

interface ApprovalItem {
  id: string
  form_type: 'weight_note' | 'ppc_form' | 'fp_form' | 'qc_form' | 'depuration_form'
  form_id: string
  submitted_by: string
  submitted_at: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'approved' | 'rejected'
  aging_hours: number
}

const ApprovalDashboard: React.FC<ApprovalDashboardProps> = ({ currentUser }) => {
  const [approvalItems, setApprovalItems] = useState<ApprovalItem[]>([])
  const [stats, setStats] = useState<ApprovalStats>({
    totalPending: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
    approvedToday: 0,
    rejectedToday: 0,
    avgApprovalTime: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [selectedView, setSelectedView] = useState<'dashboard' | 'detailed'>('dashboard')

  useEffect(() => {
    loadApprovalData()
    // Refresh every minute for real-time updates
    const interval = setInterval(loadApprovalData, 60000)
    return () => clearInterval(interval)
  }, [])

  const loadApprovalData = async () => {
    setLoading(true)
    setError('')

    try {
      // ✅ FIXED: Using ClamFlow API
      const [pendingResponse, auditResponse] = await Promise.all([
        clamflowAPI.getPendingApprovals(),
        clamflowAPI.getAuditLogs()
      ])

      if (pendingResponse.success && pendingResponse.data) {
        const items = pendingResponse.data.map(item => ({
          ...item,
          aging_hours: calculateAgingHours(item.submitted_at)
        }))
        setApprovalItems(items)
        calculateStats(items, auditResponse.data || [])
      }

    } catch (err: any) {
      console.error('❌ Failed to load approval data:', err)
      setError(err.message || 'Failed to load approval data')
    } finally {
      setLoading(false)
    }
  }

  const calculateAgingHours = (submittedAt: string): number => {
    const now = new Date()
    const submitted = new Date(submittedAt)
    return Math.round((now.getTime() - submitted.getTime()) / (1000 * 60 * 60))
  }

  const calculateStats = (items: ApprovalItem[], auditLogs: any[]) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const newStats: ApprovalStats = {
      totalPending: items.length,
      highPriority: items.filter(item => item.priority === 'high').length,
      mediumPriority: items.filter(item => item.priority === 'medium').length,
      lowPriority: items.filter(item => item.priority === 'low').length,
      approvedToday: 0, // Calculate from audit logs
      rejectedToday: 0, // Calculate from audit logs
      avgApprovalTime: items.reduce((sum, item) => sum + item.aging_hours, 0) / (items.length || 1)
    }

    // Calculate daily approvals/rejections from audit logs
    const todayLogs = auditLogs.filter(log => {
      const logDate = new Date(log.created_at)
      return logDate >= today
    })

    newStats.approvedToday = todayLogs.filter(log => log.action?.includes('approve')).length
    newStats.rejectedToday = todayLogs.filter(log => log.action?.includes('reject')).length

    setStats(newStats)
  }

  const getPriorityColor = (priority: string): string => {
    const colors = {
      'high': 'bg-red-100 text-red-800 border-red-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'low': 'bg-green-100 text-green-800 border-green-200'
    }
    return colors[priority] || colors.low
  }

  const getAgingColor = (hours: number): string => {
    if (hours > 24) return 'text-red-600 font-bold'
    if (hours > 8) return 'text-yellow-600 font-medium'
    return 'text-green-600'
  }

  const formatFormType = (type: string): string => {
    const typeMap = {
      'weight_note': 'Weight Note',
      'ppc_form': 'PPC Form',
      'fp_form': 'Final Product',
      'qc_form': 'QC Form',
      'depuration_form': 'Depuration'
    }
    return typeMap[type] || type
  }

  const handleFormApproved = (formId: string, formType: string) => {
    setApprovalItems(prev => prev.filter(item => item.id !== formId))
    loadApprovalData() // Refresh data
  }

  const handleFormRejected = (formId: string, formType: string) => {
    setApprovalItems(prev => prev.filter(item => item.id !== formId))
    loadApprovalData() // Refresh data
  }

  const canApprove = (formType: string): boolean => {
    if (!currentUser) return false
    
    const role = currentUser.role
    const approvalMatrix = {
      'weight_note': ['Super Admin', 'Admin', 'Production Lead'],
      'ppc_form': ['Super Admin', 'Admin', 'Production Lead'],
      'fp_form': ['Super Admin', 'Admin', 'Production Lead'],
      'qc_form': ['Super Admin', 'Admin', 'QC Lead'],
      'depuration_form': ['Super Admin', 'Admin', 'QC Lead']
    }
    
    return approvalMatrix[formType]?.includes(role) || false
  }

  const filteredItems = approvalItems.filter(item => 
    filter === 'all' || item.priority === filter
  )

  if (loading && approvalItems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading approval data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Approval Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage pending approvals and track workflow progress
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setSelectedView('dashboard')}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedView === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Dashboard View
          </button>
          <button
            onClick={() => setSelectedView('detailed')}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedView === 'detailed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Detailed View
          </button>
          <button
            onClick={loadApprovalData}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Dashboard View */}
      {selectedView === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
              <h3 className="text-sm font-medium text-gray-500">Total Pending</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.totalPending}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
              <h3 className="text-sm font-medium text-gray-500">High Priority</h3>
              <p className="text-2xl font-bold text-red-600">{stats.highPriority}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
              <h3 className="text-sm font-medium text-gray-500">Medium Priority</h3>
              <p className="text-2xl font-bold text-yellow-600">{stats.mediumPriority}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
              <h3 className="text-sm font-medium text-gray-500">Low Priority</h3>
              <p className="text-2xl font-bold text-green-600">{stats.lowPriority}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-emerald-500">
              <h3 className="text-sm font-medium text-gray-500">Approved Today</h3>
              <p className="text-2xl font-bold text-emerald-600">{stats.approvedToday}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-rose-500">
              <h3 className="text-sm font-medium text-gray-500">Rejected Today</h3>
              <p className="text-2xl font-bold text-rose-600">{stats.rejectedToday}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
              <h3 className="text-sm font-medium text-gray-500">Avg Time (hrs)</h3>
              <p className="text-2xl font-bold text-purple-600">{stats.avgApprovalTime.toFixed(1)}</p>
            </div>
          </div>

          {/* Priority Filter */}
          <div className="flex space-x-2">
            {['all', 'high', 'medium', 'low'].map(priority => (
              <button
                key={priority}
                onClick={() => setFilter(priority as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === priority
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {priority === 'all' ? 'All Items' : `${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority`}
              </button>
            ))}
          </div>

          {/* Approval Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">✅</div>
                <h3 className="text-xl font-semibold text-gray-600">No Pending Approvals</h3>
                <p className="text-gray-500">All caught up! Great work.</p>
              </div>
            ) : (
              filteredItems.map(item => (
                <div key={item.id} className="bg-white rounded-lg shadow-lg border hover:shadow-xl transition-shadow">
                  {/* Header */}
                  <div className="p-4 border-b">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-900">
                        {formatFormType(item.form_type)}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">ID: {item.form_id}</p>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Submitted by:</span>
                        <span className="font-medium">{item.submitted_by}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Submitted:</span>
                        <span className="font-medium">
                          {new Date(item.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Aging:</span>
                        <span className={`font-medium ${getAgingColor(item.aging_hours)}`}>
                          {item.aging_hours}h
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {canApprove(item.form_type) ? (
                    <div className="p-4 bg-gray-50 rounded-b-lg">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleFormApproved(item.id, item.form_type)}
                          className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => handleFormRejected(item.id, item.form_type)}
                          className="flex-1 bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-50 rounded-b-lg">
                      <p className="text-yellow-800 text-sm text-center">
                        Insufficient permissions for {formatFormType(item.form_type)}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Detailed View */}
      {selectedView === 'detailed' && (
        <PendingFormViewer
          currentUser={currentUser}
          onFormApproved={handleFormApproved}
          onFormRejected={handleFormRejected}
        />
      )}
    </div>
  )
}

export default ApprovalDashboard