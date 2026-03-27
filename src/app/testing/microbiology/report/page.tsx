'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import clamflowAPI from '../../../../lib/clamflow-api';

const AUTHORIZED_ROLES = [
  'Super Admin',
  'Admin',
  'QC Lead',
  'QC Staff',
];

interface MicrobiologyReport {
  id: string;
  sample_id: string;
  lot_id: string;
  test_type: string;
  status: string;
  created_at: string;
  results?: Record<string, unknown>;
}

export default function MicrobiologyReportPage() {
  const router = useRouter();
  const { user, isLoading, token } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [reports, setReports] = useState<MicrobiologyReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login?returnUrl=/testing/microbiology/report');
        return;
      }
      const authorized = AUTHORIZED_ROLES.includes(user.role);
      setIsAuthorized(authorized);
    }
  }, [user, isLoading, router]);

  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      if (token) clamflowAPI.setToken(token);
      const response = await clamflowAPI.get('/api/v1/microbiology/reports');
      if (response.data) {
        setReports(response.data as MicrobiologyReport[]);
      }
    } catch (err) {
      console.error('Failed to fetch microbiology reports:', err);
    } finally {
      setLoadingReports(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthorized && token) {
      fetchReports();
    }
  }, [isAuthorized, token, fetchReports]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-blue-600">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-orange-600">
        <div className="text-center text-white max-w-md p-8">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="mb-4">You do not have permission to view microbiology reports.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-700 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Microbiology Reports</h1>
              <p className="text-indigo-100 mt-1">View microbiology test results and reports</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadingReports ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <div className="text-5xl mb-4">🔬</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Microbiology Reports</h3>
            <p className="text-gray-500">No microbiology test reports found yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sample ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lot ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{report.sample_id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{report.lot_id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{report.test_type}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        report.status === 'completed' ? 'bg-green-100 text-green-800' :
                        report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
