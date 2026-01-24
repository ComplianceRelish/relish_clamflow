"use client"

import React, { useState, useEffect } from 'react'
import clamflowAPI, { ApiResponse } from '../../lib/clamflow-api'
import { User } from '../../types/auth'

interface ClamYieldDashboardProps {
  currentUser: User | null
}

interface YieldData {
  lotId: string
  lotNumber: string
  rawMaterialWeight: number
  processedWeight: number
  finalProductWeight: number
  yieldPercentage: number
  wastePercentage: number
  processDate: string
  status: 'processing' | 'completed' | 'shipped'
}

interface YieldMetrics {
  totalLots: number
  avgYieldPercentage: number
  totalRawMaterial: number
  totalFinalProduct: number
  totalWaste: number
  bestYieldLot: string
  worstYieldLot: string
  efficiencyTrend: 'improving' | 'declining' | 'stable'
}

const ClamYieldDashboard: React.FC<ClamYieldDashboardProps> = ({ currentUser }) => {
  const [yieldData, setYieldData] = useState<YieldData[]>([])
  const [yieldMetrics, setYieldMetrics] = useState<YieldMetrics>({
    totalLots: 0,
    avgYieldPercentage: 0,
    totalRawMaterial: 0,
    totalFinalProduct: 0,
    totalWaste: 0,
    bestYieldLot: '',
    worstYieldLot: '',
    efficiencyTrend: 'stable'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    loadYieldData()
  }, [dateRange])

  const loadYieldData = async () => {
    setLoading(true)
    setError('')

    try {
      // ✅ FIXED: Using ClamFlow API
      const [
        lotsResponse,
        weightNotesResponse,
        ppcFormsResponse,
        fpFormsResponse
      ] = await Promise.all([
        clamflowAPI.getLots(),
        clamflowAPI.getWeightNotes(),
        clamflowAPI.getPPCForms(),
        clamflowAPI.getFPForms()
      ])

      // Process yield data by combining all form data
      const yields: YieldData[] = []

      if (lotsResponse.success && lotsResponse.data) {
        lotsResponse.data.forEach((lot: any) => {
          // Get raw material weight from weight notes
          const lotWeightNotes = weightNotesResponse.success ? 
            weightNotesResponse.data?.filter((note: any) => note.lot_id === lot.id) || [] : []
          const rawMaterialWeight = lotWeightNotes.reduce((sum, note) => sum + (note.weight || 0), 0)

          // Get processed weight from PPC forms
          const lotPPCForms = ppcFormsResponse.success ? 
            ppcFormsResponse.data?.filter((form: any) => form.lot_id === lot.id) || [] : []
          const processedWeight = lotPPCForms.reduce((sum: number, form: any) => sum + (form.weight || 0), 0)

          // Get final product weight from FP forms
          const lotFPForms = fpFormsResponse.success ? 
            fpFormsResponse.data?.filter((form: any) => form.lot_id === lot.id) || [] : []
          const finalProductWeight = lotFPForms.reduce((sum: number, form: any) => sum + (form.weight || 0), 0)

          // Calculate yield percentage
          const yieldPercentage = rawMaterialWeight > 0 ? 
            (finalProductWeight / rawMaterialWeight) * 100 : 0
          const wastePercentage = 100 - yieldPercentage

          if (rawMaterialWeight > 0) { // Only include lots with actual data
            yields.push({
              lotId: lot.id,
              lotNumber: lot.lot_number,
              rawMaterialWeight,
              processedWeight,
              finalProductWeight,
              yieldPercentage,
              wastePercentage,
              processDate: lot.created_at,
              status: determineStatus(lot, lotFPForms)
            })
          }
        })
      }

      // Filter by date range
      const filteredYields = filterByDateRange(yields, dateRange)
      setYieldData(filteredYields)
      calculateYieldMetrics(filteredYields)

    } catch (err: any) {
      console.error('❌ Failed to load yield data:', err)
      setError(err.message || 'Failed to load yield dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const determineStatus = (lot: any, fpForms: any[]): 'processing' | 'completed' | 'shipped' => {
    if (fpForms.length > 0 && fpForms.every(form => form.status === 'approved')) {
      return 'completed'
    }
    if (lot.status === 'shipped') return 'shipped'
    return 'processing'
  }

  const filterByDateRange = (data: YieldData[], range: '7d' | '30d' | '90d'): YieldData[] => {
    const now = new Date()
    const daysBack = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))

    return data.filter(item => new Date(item.processDate) >= cutoffDate)
  }

  const calculateYieldMetrics = (data: YieldData[]) => {
    if (data.length === 0) return

    const totalRawMaterial = data.reduce((sum, item) => sum + item.rawMaterialWeight, 0)
    const totalFinalProduct = data.reduce((sum, item) => sum + item.finalProductWeight, 0)
    const avgYieldPercentage = data.reduce((sum, item) => sum + item.yieldPercentage, 0) / data.length

    // Find best and worst performing lots
    const sortedByYield = [...data].sort((a, b) => b.yieldPercentage - a.yieldPercentage)
    const bestYieldLot = sortedByYield[0]?.lotNumber || ''
    const worstYieldLot = sortedByYield[sortedByYield.length - 1]?.lotNumber || ''

    // Calculate efficiency trend (simplified)
    const recentData = data.slice(-5) // Last 5 lots
    const olderData = data.slice(-10, -5) // Previous 5 lots
    const recentAvg = recentData.reduce((sum, item) => sum + item.yieldPercentage, 0) / (recentData.length || 1)
    const olderAvg = olderData.reduce((sum, item) => sum + item.yieldPercentage, 0) / (olderData.length || 1)
    
    let efficiencyTrend: 'improving' | 'declining' | 'stable' = 'stable'
    if (recentAvg > olderAvg + 2) efficiencyTrend = 'improving'
    else if (recentAvg < olderAvg - 2) efficiencyTrend = 'declining'

    const metrics: YieldMetrics = {
      totalLots: data.length,
      avgYieldPercentage,
      totalRawMaterial,
      totalFinalProduct,
      totalWaste: totalRawMaterial - totalFinalProduct,
      bestYieldLot,
      worstYieldLot,
      efficiencyTrend
    }

    setYieldMetrics(metrics)
  }

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'processing': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'shipped': 'bg-blue-100 text-blue-800'
    }
    return colors[status] || colors.processing
  }

  const getYieldColor = (percentage: number): string => {
    if (percentage >= 85) return 'text-green-600'
    if (percentage >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getTrendIcon = (trend: string): string => {
    const icons: Record<string, string> = {
      'improving': '📈',
      'declining': '📉',
      'stable': '➡️'
    }
    return icons[trend] || icons.stable
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Yield Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clam Yield Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Track processing efficiency and yield optimization
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          
          <button
            onClick={loadYieldData}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
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

      {/* Yield Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-500">Total Lots</h3>
          <p className="text-2xl font-bold text-blue-600">{yieldMetrics.totalLots}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-500">Avg Yield</h3>
          <p className="text-2xl font-bold text-green-600">{(yieldMetrics.avgYieldPercentage ?? 0).toFixed(1)}%</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <h3 className="text-sm font-medium text-gray-500">Raw Material</h3>
          <p className="text-2xl font-bold text-purple-600">{(yieldMetrics.totalRawMaterial ?? 0).toFixed(0)} kg</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-emerald-500">
          <h3 className="text-sm font-medium text-gray-500">Final Product</h3>
          <p className="text-2xl font-bold text-emerald-600">{(yieldMetrics.totalFinalProduct ?? 0).toFixed(0)} kg</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <h3 className="text-sm font-medium text-gray-500">Waste</h3>
          <p className="text-2xl font-bold text-red-600">{(yieldMetrics.totalWaste ?? 0).toFixed(0)} kg</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <h3 className="text-sm font-medium text-gray-500">Best Lot</h3>
          <p className="text-lg font-bold text-yellow-600 truncate">{yieldMetrics.bestYieldLot || 'N/A'}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-indigo-500">
          <h3 className="text-sm font-medium text-gray-500">Trend</h3>
          <p className="text-2xl font-bold text-indigo-600">
            {getTrendIcon(yieldMetrics.efficiencyTrend)}
          </p>
        </div>
      </div>

      {/* Yield Performance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Lot Yield Performance</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lot Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Raw Material (kg)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processed (kg)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final Product (kg)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yield %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waste %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Process Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {yieldData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No yield data available for the selected period
                  </td>
                </tr>
              ) : (
                yieldData.map(item => (
                  <tr key={item.lotId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm text-gray-900">{item.lotNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{(item.rawMaterialWeight ?? 0).toFixed(1)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{(item.processedWeight ?? 0).toFixed(1)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{(item.finalProductWeight ?? 0).toFixed(1)}</td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${getYieldColor(item.yieldPercentage)}`}>
                        {(item.yieldPercentage ?? 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{(item.wastePercentage ?? 0).toFixed(1)}%</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(item.processDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Overall Efficiency:</span>
              <span className={`font-medium ${getYieldColor(yieldMetrics.avgYieldPercentage)}`}>
                {(yieldMetrics.avgYieldPercentage ?? 0).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Efficiency Trend:</span>
              <span className={`font-medium ${
                yieldMetrics.efficiencyTrend === 'improving' ? 'text-green-600' :
                yieldMetrics.efficiencyTrend === 'declining' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {getTrendIcon(yieldMetrics.efficiencyTrend)} {yieldMetrics.efficiencyTrend}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Best Performing:</span>
              <span className="font-medium text-green-600">{yieldMetrics.bestYieldLot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Needs Improvement:</span>
              <span className="font-medium text-red-600">{yieldMetrics.worstYieldLot}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Recommendations</h3>
          <div className="space-y-3 text-sm">
            {yieldMetrics.avgYieldPercentage < 75 && (
              <div className="p-3 bg-red-50 rounded border-l-4 border-red-400">
                <p className="text-red-800">⚠️ Low average yield detected. Review processing procedures.</p>
              </div>
            )}
            {yieldMetrics.efficiencyTrend === 'declining' && (
              <div className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                <p className="text-yellow-800">📉 Declining trend observed. Investigate recent changes.</p>
              </div>
            )}
            {yieldMetrics.avgYieldPercentage >= 85 && (
              <div className="p-3 bg-green-50 rounded border-l-4 border-green-400">
                <p className="text-green-800">✅ Excellent yield performance! Maintain current procedures.</p>
              </div>
            )}
            <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
              <p className="text-blue-800">💡 Regular yield analysis helps identify optimization opportunities.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClamYieldDashboard