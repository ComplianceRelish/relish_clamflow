'use client';

import React, { useState, useEffect } from 'react';
import clamflowAPI from '../../../lib/clamflow-api';

interface FinishedProduct {
  id: string;
  productType: string;
  lotId: string;
  weight: number;
  packagingDate: string;
  expiryDate: string;
  status: 'in_stock' | 'shipped' | 'pending_shipment';
  location: string;
  batchNumber: string;
}

interface InventoryItem {
  id: string;
  category: string;
  itemName: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  lastRestocked: string;
  supplier: string;
  status: 'adequate' | 'low' | 'critical';
}

interface TestResult {
  id: string;
  lotId: string;
  testType: string;
  testDate: string;
  result: 'pass' | 'fail' | 'pending';
  testedBy: string;
  notes: string;
  parameters: {
    parameter: string;
    value: string;
    standard: string;
  }[];
}

const InventoryShipmentsDashboard: React.FC = () => {
  const [finishedProducts, setFinishedProducts] = useState<FinishedProduct[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'products' | 'inventory' | 'tests'>('products');

  useEffect(() => {
    loadInventoryData();
    const interval = setInterval(loadInventoryData, 45000); // Refresh every 45 seconds
    return () => clearInterval(interval);
  }, []);

  const loadInventoryData = async () => {
    try {
      const [productsRes, inventoryRes, testsRes] = await Promise.all([
        clamflowAPI.getFinishedProducts(),
        clamflowAPI.getInventoryItems(),
        clamflowAPI.getTestResults()
      ]);

      if (productsRes.success && productsRes.data) {
        setFinishedProducts(productsRes.data as FinishedProduct[]);
      }

      if (inventoryRes.success && inventoryRes.data) {
        setInventoryItems(inventoryRes.data as InventoryItem[]);
      }

      if (testsRes.success && testsRes.data) {
        setTestResults(testsRes.data as TestResult[]);
      }

      setLastUpdated(new Date().toLocaleTimeString());
      setError('');
    } catch (err) {
      setError('Failed to load inventory data');
      console.error('Inventory data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
      case 'adequate':
      case 'pass':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending_shipment':
      case 'low':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'critical':
      case 'fail':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory data...</p>
        </div>
      </div>
    );
  }

  const inStockProducts = finishedProducts.filter(p => p.status === 'in_stock').length;
  const pendingShipment = finishedProducts.filter(p => p.status === 'pending_shipment').length;
  const criticalItems = inventoryItems.filter(i => i.status === 'critical').length;
  const totalWeight = finishedProducts
    .filter(p => p.status === 'in_stock')
    .reduce((sum, p) => sum + p.weight, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory & Shipments Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {lastUpdated || 'Never'}
          </p>
        </div>
        <button
          onClick={loadInventoryData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="text-sm font-medium text-gray-600">In Stock Products</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{inStockProducts}</div>
          <div className="text-xs text-gray-500 mt-1">Ready for shipment</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="text-sm font-medium text-gray-600">Pending Shipment</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{pendingShipment}</div>
          <div className="text-xs text-gray-500 mt-1">Orders in queue</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="text-sm font-medium text-gray-600">Critical Items</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{criticalItems}</div>
          <div className="text-xs text-gray-500 mt-1">Below reorder level</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="text-sm font-medium text-gray-600">Total Stock Weight</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{totalWeight.toFixed(1)}</div>
          <div className="text-xs text-gray-500 mt-1">Kilograms</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'products'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Finished Products
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'inventory'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Inventory Items
            </button>
            <button
              onClick={() => setActiveTab('tests')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'tests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Test Results
            </button>
          </nav>
        </div>

        {/* Finished Products Tab */}
        {activeTab === 'products' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lot ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight (kg)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Packaging Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {finishedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No finished products in inventory
                    </td>
                  </tr>
                ) : (
                  finishedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.lotId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {product.productType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {product.weight.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(product.packagingDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(product.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {product.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(product.status)}`}>
                          {product.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Inventory Items Tab */}
        {activeTab === 'inventory' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reorder Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Restocked
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventoryItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No inventory items found
                    </td>
                  </tr>
                ) : (
                  inventoryItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.itemName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item.reorderLevel} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(item.lastRestocked).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item.supplier}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(item.status)}`}>
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Test Results Tab */}
        {activeTab === 'tests' && (
          <div className="p-6">
            <div className="space-y-4">
              {testResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No test results available
                </div>
              ) : (
                testResults.map((test) => (
                  <div key={test.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">Lot: {test.lotId}</h4>
                        <p className="text-sm text-gray-600">{test.testType}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(test.result)}`}>
                        {test.result.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">Test Date:</span>
                        <span className="ml-2 text-gray-900">{new Date(test.testDate).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Tested By:</span>
                        <span className="ml-2 text-gray-900">{test.testedBy}</span>
                      </div>
                    </div>
                    {test.parameters && test.parameters.length > 0 && (
                      <div className="border-t pt-3">
                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Test Parameters:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {test.parameters.map((param, idx) => (
                            <div key={idx} className="text-xs bg-gray-50 p-2 rounded">
                              <div className="font-medium text-gray-900">{param.parameter}</div>
                              <div className="text-gray-600">
                                Value: <span className="font-medium">{param.value}</span>
                              </div>
                              <div className="text-gray-600">
                                Standard: <span className="font-medium">{param.standard}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {test.notes && (
                      <div className="mt-3 text-sm text-gray-700 bg-blue-50 p-2 rounded">
                        <span className="font-medium">Notes:</span> {test.notes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryShipmentsDashboard;
