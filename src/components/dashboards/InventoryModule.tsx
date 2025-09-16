"use client"

import React, { useState, useEffect } from 'react'
import clamflowAPI, { ApiResponse } from '../../lib/clamflow-api'
import { User } from '../../types/auth'

interface InventoryItem {
  id: string
  lot_id: string
  box_number: string
  product_type: string
  weight: number
  status: 'in_stock' | 'processing' | 'shipped' | 'quarantine'
  location: string
  expiry_date?: string
  created_at: string
  updated_at: string
}

interface InventoryStats {
  totalItems: number
  totalWeight: number
  inStock: number
  processing: number
  shipped: number
  quarantine: number
  lowStock: number
  expiringSoon: number
}

interface InventoryModuleProps {
  currentUser: User | null
}

const InventoryModule: React.FC<InventoryModuleProps> = ({ currentUser }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0,
    totalWeight: 0,
    inStock: 0,
    processing: 0,
    shipped: 0,
    quarantine: 0,
    lowStock: 0,
    expiringSoon: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [filter, setFilter] = useState<'all' | 'in_stock' | 'processing' | 'shipped' | 'quarantine'>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')

  useEffect(() => {
    loadInventoryData()
    // Refresh every 2 minutes
    const interval = setInterval(loadInventoryData, 120000)
    return () => clearInterval(interval)
  }, [])

  const loadInventoryData = async () => {
    setLoading(true)
    setError('')

    try {
      // ✅ FIXED: Using ClamFlow API endpoints
      const [lotsResponse, weightNotesResponse, ppcFormsResponse, fpFormsResponse] = await Promise.all([
        clamflowAPI.getLots(),
        clamflowAPI.getWeightNotes(),
        clamflowAPI.getPPCForms(),
        clamflowAPI.getFPForms()
      ])

      // Combine data to create inventory view
      const inventoryItems: InventoryItem[] = []
      
      // Add weight notes as raw inventory
      if (weightNotesResponse.success && weightNotesResponse.data) {
        weightNotesResponse.data.forEach(note => {
          if (note.status === 'approved') {
            inventoryItems.push({
              id: note.id,
              lot_id: note.lot_id,
              box_number: note.box_number,
              product_type: note.raw_material_type,
              weight: note.weight,
              status: 'in_stock',
              location: 'Raw Material Storage',
              created_at: note.created_at,
              updated_at: note.updated_at
            })
          }
        })
      }

      // Add PPC forms as processed inventory
      if (ppcFormsResponse.success && ppcFormsResponse.data) {
        ppcFormsResponse.data.forEach(form => {
          if (form.status === 'approved') {
            inventoryItems.push({
              id: form.id,
              lot_id: form.lot_id,
              box_number: form.box_number,
              product_type: form.product_type,
              weight: form.weight,
              status: 'processing',
              location: 'Processing Area',
              created_at: form.created_at,
              updated_at: form.updated_at
            })
          }
        })
      }

      // Add FP forms as finished inventory
      if (fpFormsResponse.success && fpFormsResponse.data) {
        fpFormsResponse.data.forEach(form => {
          if (form.status === 'approved') {
            inventoryItems.push({
              id: form.id,
              lot_id: form.lot_id,
              box_number: form.box_number,
              product_type: form.product_type,
              weight: form.weight,
              status: 'in_stock',
              location: 'Finished Goods',
              expiry_date: form.expiry_date,
              created_at: form.created_at,
              updated_at: form.updated_at
            })
          }
        })
      }

      setInventory(inventoryItems)
      calculateStats(inventoryItems)
    } catch (err: any) {
      console.error('❌ Failed to load inventory:', err)
      setError(err.message || 'Failed to load inventory data')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (items: InventoryItem[]) => {
    const newStats: InventoryStats = {
      totalItems: items.length,
      totalWeight: items.reduce((sum, item) => sum + item.weight, 0),
      inStock: items.filter(item => item.status === 'in_stock').length,
      processing: items.filter(item => item.status === 'processing').length,
      shipped: items.filter(item => item.status === 'shipped').length,
      quarantine: items.filter(item => item.status === 'quarantine').length,
      lowStock: 0, // This would need business logic
      expiringSoon: items.filter(item => {
        if (!item.expiry_date) return false
        const expiryDate = new Date(item.expiry_date)
        const sevenDaysFromNow = new Date()
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
        return expiryDate <= sevenDaysFromNow
      }).length
    }
    setStats(newStats)
  }

  const getStatusColor = (status: string): string => {
    const colors = {
      'in_stock': 'bg-green-100 text-green-800',
      'processing': 'bg-yellow-100 text-yellow-800',
      'shipped': 'bg-blue-100 text-blue-800',
      'quarantine': 'bg-red-100 text-red-800'
    }
    return colors[status] || colors.in_stock
  }

  const filteredInventory = inventory
    .filter(item => filter === 'all' || item.status === filter)
    .filter(item => 
      searchTerm === '' || 
      item.box_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_type.toLowerCase().includes(searchTerm.toLowerCase())
    )

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
        <button
          onClick={loadInventoryData}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-600">Total Items</h3>
          <p className="text-2xl font-bold text-blue-900">{stats.totalItems}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-600">Total Weight</h3>
          <p className="text-2xl font-bold text-green-900">{stats.totalWeight.toFixed(1)} kg</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-600">Processing</h3>
          <p className="text-2xl font-bold text-yellow-900">{stats.processing}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-red-600">Expiring Soon</h3>
          <p className="text-2xl font-bold text-red-900">{stats.expiringSoon}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Status Filter */}
        <div className="flex space-x-2">
          {['all', 'in_stock', 'processing', 'shipped', 'quarantine'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded text-sm font-medium ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Search by box number or product type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-4 py-2 text-left">Box Number</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Product Type</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Weight (kg)</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Location</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Created</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Expiry</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.length === 0 ? (
              <tr>
                <td colSpan={7} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                  No inventory items found
                </td>
              </tr>
            ) : (
              filteredInventory.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 font-mono">{item.box_number}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.product_type}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{item.weight}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(item.status)}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">{item.location}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default InventoryModule