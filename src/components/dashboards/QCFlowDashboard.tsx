import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface QCFlowDashboardProps {
  authToken?: string;
  currentUserRole?: string;
}

interface QCStats {
  totalLots: number;
  activeLots: number;
  completedLots: number;
  pendingApprovals: number;
  microbiologyPending: number;
  readyForShipment: number;
}

interface DepurationData {
  id: string;
  lot_id: string;
  lot_number: string;
  tank_number: string;
  test_date: string;
  status: string;
  results: any;
}

const QCFlowDashboard: React.FC<QCFlowDashboardProps> = ({ 
  authToken, 
  currentUserRole 
}) => {
  const [qcStats, setQcStats] = useState<QCStats>({
    totalLots: 0,
    activeLots: 0,
    completedLots: 0,
    pendingApprovals: 0,
    microbiologyPending: 0,
    readyForShipment: 0
  });

  const [depurationData, setDepurationData] = useState<DepurationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'depuration' | 'microbiology'>('overview');

  useEffect(() => {
    fetchQCDashboardData();
  }, []);

  const fetchQCDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, depurationRes] = await Promise.all([
        fetch('https://clamflowbackend-production.up.railway.app/qc-lead/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }),
        fetch('https://clamflowbackend-production.up.railway.app/qc-lead/depuration-results', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        })
      ]);

      if (statsRes.ok) {
        const stats = await statsRes.json();
        setQcStats(stats);
      }

      if (depurationRes.ok) {
        const depuration = await depurationRes.json();
        setDepurationData(depuration);
      }
    } catch (error) {
      console.error('Failed to fetch QC dashboard data:', error);
      // Mock data for development
      setQcStats({
        totalLots: 15,
        activeLots: 8,
        completedLots: 7,
        pendingApprovals: 3,
        microbiologyPending: 5,
        readyForShipment: 2
      });

      setDepurationData([
        {
          id: '1',
          lot_id: 'lot-001',
          lot_number: 'LOT-2024-001',
          tank_number: 'T-05',
          test_date: new Date().toISOString(),
          status: 'completed',
          results: { ph: 7.2, salinity: 3.5, bacterial_count: 50 }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const approveMicrobiology = async (lotId: string) => {
    try {
      const reportUrl = prompt('Enter microbiology report URL:');
      if (!reportUrl) return;

      const response = await fetch(`https://clamflowbackend-production.up.railway.app/qc-lead/lots/${lotId}/approve-microbiology?report_url=${encodeURIComponent(reportUrl)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        alert('Microbiology approved successfully!');
        fetchQCDashboardData(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Failed to approve microbiology:', error);
      alert('Failed to approve microbiology');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">QC Lead Dashboard</h1>

      {/* Role Notice */}
      <div className="mb-6 p-4 bg-purple-50 rounded-lg">
        <p className="text-purple-800">
          <strong>Current Role:</strong> {currentUserRole || 'QC Lead'} | 
          <strong> Responsibilities:</strong> Final Quality Control, Microbiology Approval, Depuration Oversight
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-4 mb-8">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'depuration', label: 'Depuration Results' },
          { key: 'microbiology', label: 'Microbiology Approvals' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key as any)}
            className={`px-6 py-3 rounded-md font-medium ${
              selectedTab === tab.key
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Lots</h3>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-blue-600">{qcStats.totalLots}</span>
                <div className="bg-blue-100 p-2 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Active Lots</h3>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-yellow-600">{qcStats.activeLots}</span>
                <div className="bg-yellow-100 p-2 rounded-full">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Ready for Shipment</h3>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-green-600">{qcStats.readyForShipment}</span>
                <div className="bg-green-100 p-2 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Pending Approvals</h3>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-red-600">{qcStats.pendingApprovals}</span>
                <div className="bg-red-100 p-2 rounded-full">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Microbiology Pending</h3>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-purple-600">{qcStats.microbiologyPending}</span>
                <div className="bg-purple-100 p-2 rounded-full">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Completed Lots</h3>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-indigo-600">{qcStats.completedLots}</span>
                <div className="bg-indigo-100 p-2 rounded-full">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Depuration Results Tab */}
      {selectedTab === 'depuration' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Depuration Test Results</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lot Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    pH Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salinity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {depurationData.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.lot_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.tank_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(item.test_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.results?.ph || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.results?.salinity || 'N/A'}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => approveMicrobiology(item.lot_id)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Approve Microbiology
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Microbiology Approvals Tab */}
      {selectedTab === 'microbiology' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Microbiology Approvals</h2>
          <div className="text-center py-8 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <p className="text-lg">Microbiology approvals interface</p>
            <p className="text-sm mt-2">View and approve microbiology test results for final quality control</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors">
          <div className="text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-sm font-medium">New Depuration Form</span>
          </div>
        </button>

        <button className="bg-indigo-600 text-white p-4 rounded-lg hover:bg-indigo-700 transition-colors">
          <div className="text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <span className="text-sm font-medium">Approve Microbiology</span>
          </div>
        </button>

        <button className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors">
          <div className="text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium">View Reports</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default QCFlowDashboard;