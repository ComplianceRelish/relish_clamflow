'use client';

/**
 * StaffLeadStaffPanel.tsx
 * 
 * Staff Management panel for Staff Lead role.
 * Shows: Attendance records, Staff locations
 * Does NOT show: Performance metrics (Production/QC domain per RBAC)
 * 
 * Per BACKEND_STAFF_LEAD_ACCESS_REQUIREMENTS.md:
 * - ✅ GET /api/staff/attendance - Staff attendance records
 * - ✅ GET /api/staff/locations - Current staff locations
 * - ❌ GET /api/staff/performance - NOT accessible (Production/QC domain)
 */

import React, { useState, useEffect, useCallback } from 'react';
import clamflowAPI from '../../../lib/clamflow-api';
import { AttendanceRecord, StaffLocation } from '../../../types/dashboard';

const StaffLeadStaffPanel: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [locations, setLocations] = useState<StaffLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      // Fetch attendance and locations - Staff Lead has access per backend RBAC
      const [attendanceRes, locationsRes] = await Promise.all([
        clamflowAPI.getStaffAttendance(),
        clamflowAPI.getStaffLocations(),
      ]);

      // Handle attendance response
      if (attendanceRes.success && attendanceRes.data) {
        const data = Array.isArray(attendanceRes.data) ? attendanceRes.data : [];
        setAttendance(data);
      } else {
        console.warn('Staff attendance returned non-array or failed:', attendanceRes);
        setAttendance([]);
      }

      // Handle locations response
      if (locationsRes.success && locationsRes.data) {
        const data = Array.isArray(locationsRes.data) ? locationsRes.data : [];
        setLocations(data);
      } else {
        console.warn('Staff locations returned non-array or failed:', locationsRes);
        setLocations([]);
      }

      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load staff data';
      console.error('Staff data fetch error:', err);
      setError(errorMessage);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Poll every 30 seconds for real-time updates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff data...</p>
        </div>
      </div>
    );
  }

  const checkedInStaff = attendance.filter(a => a.status === 'checked_in').length;
  const checkedOutStaff = attendance.filter(a => a.status === 'checked_out').length;
  const totalStaff = attendance.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">👥 Staff Attendance & Locations</h2>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {lastUpdated?.toLocaleTimeString() || 'Never'}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors flex items-center gap-2"
        >
          <span>🔄</span>
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Info Banner - Staff Lead access scope */}
      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
        <div className="flex items-start gap-2">
          <span className="text-lg">ℹ️</span>
          <div>
            <p className="font-medium">Staff Lead Access</p>
            <p className="text-sm mt-1">
              You have access to attendance records and staff locations. Performance metrics are managed by Production Lead and QC Lead.
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="text-sm font-medium text-gray-600">Checked In</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{checkedInStaff}</div>
          <div className="text-xs text-gray-500 mt-1">Staff members</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="text-sm font-medium text-gray-600">Checked Out</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{checkedOutStaff}</div>
          <div className="text-xs text-gray-500 mt-1">Staff members</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="text-sm font-medium text-gray-600">Total Staff</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{totalStaff}</div>
          <div className="text-xs text-gray-500 mt-1">Staff members</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="text-sm font-medium text-gray-600">Active Locations</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{locations.length}</div>
          <div className="text-xs text-gray-500 mt-1">Locations</div>
        </div>
      </div>

      {/* Today's Attendance */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Today's Attendance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No attendance records for today
                  </td>
                </tr>
              ) : (
                attendance.slice(0, 15).map((record, index) => (
                  <tr key={`attendance-${record.userId}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.fullName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {record.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {record.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {record.method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.status === 'checked_in' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.status === 'checked_in' ? '✓ Checked In' : '○ Checked Out'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {attendance.length > 15 && (
            <div className="px-6 py-3 bg-gray-50 text-center text-sm text-gray-500">
              Showing 15 of {attendance.length} records
            </div>
          )}
        </div>
      </div>

      {/* Staff Locations */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Current Staff Locations</h3>
        </div>
        <div className="p-6">
          {locations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📍</div>
              <p>No staff location data available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations.map((loc, index) => (
                <div 
                  key={`location-${loc.location}-${index}`} 
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-900 text-lg">📍 {loc.location}</span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {loc.staffCount} staff
                    </span>
                  </div>
                  <div className="space-y-2">
                    {loc.staffMembers.slice(0, 5).map((member, memberIndex) => (
                      <div key={`${member.userId}-${memberIndex}`} className="text-sm flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                        <span className="font-medium text-gray-700">{member.fullName}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{member.role}</span>
                      </div>
                    ))}
                    {loc.staffMembers.length > 5 && (
                      <div className="text-xs text-gray-500 text-center pt-1">
                        +{loc.staffMembers.length - 5} more staff members
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffLeadStaffPanel;
