// src/components/admin/AccountsExport.tsx
// Export onboarded Staff, Suppliers & Vendors details for Accounts (Tally & Payment Apps)
// Exports: Name, Aadhar Number, Mobile Number, Bank Details, UPI ID in CSV/XLSX format
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { AdminOnly } from '../auth/RoleBasedAccess';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://clamflowbackend-production.up.railway.app';

// ============================================
// INTERFACES
// ============================================

interface AccountsExportData {
  id: string;
  type: 'staff' | 'supplier' | 'agent';
  name: string;
  aadhar_number: string;
  mobile_number: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  account_holder_name: string;
  upi_id: string;
  onboarding_status: 'incomplete' | 'pending_verification' | 'complete';
  created_at: string;
}

interface ExportFilters {
  type: 'all' | 'staff' | 'supplier' | 'agent';
  status: 'all' | 'complete' | 'incomplete';
  dateFrom: string;
  dateTo: string;
}

// ============================================
// ACCOUNTS EXPORT COMPONENT
// ============================================

const AccountsExport: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<AccountsExportData[]>([]);
  const [filteredData, setFilteredData] = useState<AccountsExportData[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  
  const [filters, setFilters] = useState<ExportFilters>({
    type: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
  });
  
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchAccountsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  // Apply filters when data or filters change
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, filters]);

  const fetchAccountsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('clamflow_token');
      
      // Fetch from multiple endpoints
      const [staffResponse, suppliersResponse] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/suppliers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const accountsData: AccountsExportData[] = [];

      // Process staff data
      if (staffResponse.status === 'fulfilled') {
        try {
          const staffData = await staffResponse.value.json();
          if (Array.isArray(staffData.data || staffData)) {
            const staff = staffData.data || staffData;
            staff.forEach((s: any) => {
              if (s.bank_details || s.aadhar_details) {
                accountsData.push({
                  id: s.id,
                  type: 'staff',
                  name: s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim(),
                  aadhar_number: s.aadhar_details?.aadhar_number || s.aadhar_number || '',
                  mobile_number: s.phone || s.contact_number || '',
                  bank_name: s.bank_details?.bank_name || '',
                  account_number: s.bank_details?.account_number || '',
                  ifsc_code: s.bank_details?.ifsc_code || '',
                  account_holder_name: s.bank_details?.account_holder_name || '',
                  upi_id: s.bank_details?.upi_id || '',
                  onboarding_status: determineOnboardingStatus(s),
                  created_at: s.created_at || s.start_date || '',
                });
              }
            });
          }
        } catch (e) {
          console.warn('Failed to parse staff data');
        }
      }

      // Process suppliers data
      if (suppliersResponse.status === 'fulfilled') {
        try {
          const suppliersData = await suppliersResponse.value.json();
          if (Array.isArray(suppliersData.data || suppliersData)) {
            const suppliers = suppliersData.data || suppliersData;
            suppliers.forEach((s: any) => {
              accountsData.push({
                id: s.id,
                type: s.type === 'agent' ? 'agent' : 'supplier',
                name: `${s.first_name || ''} ${s.last_name || ''}`.trim(),
                aadhar_number: s.aadhar_details?.aadhar_number || s.aadhar_number || '',
                mobile_number: s.contact_number || s.phone || '',
                bank_name: s.bank_details?.bank_name || '',
                account_number: s.bank_details?.account_number || '',
                ifsc_code: s.bank_details?.ifsc_code || '',
                account_holder_name: s.bank_details?.account_holder_name || '',
                upi_id: s.bank_details?.upi_id || '',
                onboarding_status: determineOnboardingStatus(s),
                created_at: s.created_at || '',
              });
            });
          }
        } catch (e) {
          console.warn('Failed to parse suppliers data');
        }
      }

      // Handle offline/cache scenario for exports
      if (accountsData.length === 0) {
        if (!navigator.onLine) {
          console.info('[Offline] Using cached accounts data if available');
          // In PWA, service worker may serve cached API responses
        } else {
          console.info('No accounts data found - database may be empty or data still syncing');
        }
      }

      setData(accountsData);
    } catch (err: any) {
      if (!navigator.onLine) {
        setError('Network unavailable. Previously cached data may be displayed. Connect to internet for latest data.');
      } else {
        setError(err.message || 'Failed to fetch accounts data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const determineOnboardingStatus = (record: any): 'incomplete' | 'pending_verification' | 'complete' => {
    const hasAadhar = record.aadhar_details?.verified || record.aadhar_number;
    const hasBank = record.bank_details?.account_number;
    const hasFace = record.face_registration?.registered || record.face_image;
    
    if (hasAadhar && hasBank && hasFace) return 'complete';
    if (hasAadhar || hasBank || hasFace) return 'pending_verification';
    return 'incomplete';
  };

  const applyFilters = () => {
    let filtered = [...data];
    
    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(d => d.type === filters.type);
    }
    
    // Filter by status
    if (filters.status !== 'all') {
      if (filters.status === 'complete') {
        filtered = filtered.filter(d => d.onboarding_status === 'complete');
      } else {
        filtered = filtered.filter(d => d.onboarding_status !== 'complete');
      }
    }
    
    // Filter by date range
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(d => new Date(d.created_at) >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(d => new Date(d.created_at) <= toDate);
    }
    
    setFilteredData(filtered);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleRowSelection = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === filteredData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredData.map(d => d.id)));
    }
  };

  // ============================================
  // EXPORT FUNCTIONS
  // ============================================

  const getExportData = (): AccountsExportData[] => {
    if (selectedRows.size > 0) {
      return filteredData.filter(d => selectedRows.has(d.id));
    }
    return filteredData;
  };

  const exportToCSV = () => {
    setExporting(true);
    setError(null);
    
    try {
      const exportData = getExportData();
      
      if (exportData.length === 0) {
        setError('No data to export');
        setExporting(false);
        return;
      }

      // CSV Headers for Accounts/Tally
      const headers = [
        'Type',
        'Name',
        'Aadhar Number',
        'Mobile Number',
        'Bank Name',
        'Account Number',
        'IFSC Code',
        'Account Holder Name',
        'UPI ID',
        'Onboarding Status'
      ];

      // Build CSV content
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => [
          row.type,
          `"${row.name}"`,
          row.aadhar_number.replace(/\s/g, ''),
          row.mobile_number,
          `"${row.bank_name}"`,
          row.account_number,
          row.ifsc_code,
          `"${row.account_holder_name}"`,
          row.upi_id,
          row.onboarding_status
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `ClamFlow_Accounts_Export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccess(`Successfully exported ${exportData.length} records to CSV`);
    } catch (err: any) {
      setError(err.message || 'Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = () => {
    setExporting(true);
    setError(null);
    
    try {
      const exportData = getExportData();
      
      if (exportData.length === 0) {
        setError('No data to export');
        setExporting(false);
        return;
      }

      // Create XLSX-compatible XML (Excel 2003 XML format)
      const headers = [
        'Type',
        'Name',
        'Aadhar Number',
        'Mobile Number',
        'Bank Name',
        'Account Number',
        'IFSC Code',
        'Account Holder Name',
        'UPI ID',
        'Onboarding Status'
      ];

      let xlsContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Accounts Export">
<Table>
<Row>`;
      
      // Headers
      headers.forEach(h => {
        xlsContent += `<Cell><Data ss:Type="String">${h}</Data></Cell>`;
      });
      xlsContent += '</Row>';
      
      // Data rows
      exportData.forEach(row => {
        xlsContent += '<Row>';
        xlsContent += `<Cell><Data ss:Type="String">${row.type}</Data></Cell>`;
        xlsContent += `<Cell><Data ss:Type="String">${escapeXml(row.name)}</Data></Cell>`;
        xlsContent += `<Cell><Data ss:Type="String">${row.aadhar_number.replace(/\s/g, '')}</Data></Cell>`;
        xlsContent += `<Cell><Data ss:Type="String">${row.mobile_number}</Data></Cell>`;
        xlsContent += `<Cell><Data ss:Type="String">${escapeXml(row.bank_name)}</Data></Cell>`;
        xlsContent += `<Cell><Data ss:Type="String">${row.account_number}</Data></Cell>`;
        xlsContent += `<Cell><Data ss:Type="String">${row.ifsc_code}</Data></Cell>`;
        xlsContent += `<Cell><Data ss:Type="String">${escapeXml(row.account_holder_name)}</Data></Cell>`;
        xlsContent += `<Cell><Data ss:Type="String">${row.upi_id}</Data></Cell>`;
        xlsContent += `<Cell><Data ss:Type="String">${row.onboarding_status}</Data></Cell>`;
        xlsContent += '</Row>';
      });
      
      xlsContent += '</Table></Worksheet></Workbook>';

      // Download XLS
      const blob = new Blob([xlsContent], { type: 'application/vnd.ms-excel' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `ClamFlow_Accounts_Export_${new Date().toISOString().split('T')[0]}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccess(`Successfully exported ${exportData.length} records to Excel`);
    } catch (err: any) {
      setError(err.message || 'Failed to export Excel');
    } finally {
      setExporting(false);
    }
  };

  const escapeXml = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Please log in to access accounts export.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">📊 Accounts Export</h1>
              <p className="text-green-100 mt-1">
                Download Staff, Supplier & Agent details for Tally & Payment Apps
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Alerts */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            ✅ {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            ❌ {error}
          </div>
        )}

        {/* Filters & Export Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Types</option>
                <option value="staff">Staff</option>
                <option value="supplier">Suppliers</option>
                <option value="agent">Agents</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Status</option>
                <option value="complete">Complete Only</option>
                <option value="incomplete">Incomplete</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Spacer */}
            <div className="flex-grow" />

            {/* Export Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={exportToCSV}
                disabled={exporting || filteredData.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                📄 Export CSV
              </button>
              <button
                onClick={exportToExcel}
                disabled={exporting || filteredData.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
              >
                📊 Export Excel
              </button>
            </div>
          </div>

          {/* Selection Info */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <div>
              Showing {filteredData.length} of {data.length} records
              {selectedRows.size > 0 && (
                <span className="ml-2 text-green-600">
                  ({selectedRows.size} selected for export)
                </span>
              )}
            </div>
            <button
              onClick={fetchAccountsData}
              disabled={loading}
              className="text-blue-600 hover:text-blue-800"
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading accounts data...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <span className="text-6xl">📋</span>
              <p className="mt-4">No records found matching filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === filteredData.length && filteredData.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aadhar</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UPI</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((row) => (
                    <tr 
                      key={row.id} 
                      className={`hover:bg-gray-50 ${selectedRows.has(row.id) ? 'bg-green-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(row.id)}
                          onChange={() => toggleRowSelection(row.id)}
                          className="w-4 h-4 rounded"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          row.type === 'staff' 
                            ? 'bg-blue-100 text-blue-700' 
                            : row.type === 'supplier'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-purple-100 text-purple-700'
                        }`}>
                          {row.type.charAt(0).toUpperCase() + row.type.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                        {row.name}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {row.aadhar_number || <span className="text-red-400">Missing</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {row.mobile_number || <span className="text-red-400">Missing</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {row.bank_name || <span className="text-red-400">-</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {row.account_number 
                          ? `****${row.account_number.slice(-4)}` 
                          : <span className="text-red-400">-</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {row.upi_id || <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs ${
                          row.onboarding_status === 'complete'
                            ? 'bg-green-100 text-green-700'
                            : row.onboarding_status === 'pending_verification'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}>
                          {row.onboarding_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Export Information */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">📋 Export Information</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>CSV Format:</strong> Compatible with Tally, Excel, Google Sheets, and most accounting software</li>
            <li>• <strong>Excel Format:</strong> Opens directly in Microsoft Excel with proper column formatting</li>
            <li>• <strong>Exported Fields:</strong> Name, Aadhar Number, Mobile, Bank Name, Account Number, IFSC Code, Account Holder Name, UPI ID</li>
            <li>• <strong>Selection:</strong> Select specific rows to export only those records, or export all filtered records</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AccountsExport;
