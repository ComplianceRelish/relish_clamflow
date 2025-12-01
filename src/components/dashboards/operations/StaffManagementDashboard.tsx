'use client';

import React, { useState, useEffect } from 'react';
import clamflowAPI from '../../../lib/clamflow-api';

interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  checkInTime: string;
  checkOutTime: string | null;
  station: string;
  status: 'present' | 'late' | 'absent';
  hoursWorked: number;
}

interface StaffLocation {
  staffId: string;
  staffName: string;
  currentLocation: string;
  lastSeen: string;
  activity: string;
}

interface PerformanceMetric {
  staffId: string;
  staffName: string;
  role: string;
  lotsProcessed: number;
  averageProcessingTime: number;
  qualityScore: number;
  efficiency: number;
}

const StaffManagementDashboard: React.FC = () => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [locations, setLocations] = useState<StaffLocation[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    loadStaffData();
    const interval = setInterval(loadStaffData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadStaffData = async () => {
    try {
      const [attendanceRes, locationsRes, performanceRes] = await Promise.all([
        clamflowAPI.getStaffAttendance(),
        clamflowAPI.getStaffLocations(),
        clamflowAPI.getStaffPerformance()
      ]);

      if (attendanceRes.success && attendanceRes.data) {
        setAttendance(attendanceRes.data as AttendanceRecord[]);
      }

      if (locationsRes.success && locationsRes.data) {
        setLocations(locationsRes.data as StaffLocation[]);
      }

      if (performanceRes.success && performanceRes.data) {
        setPerformance(performanceRes.data as PerformanceMetric[]);
      }

      setLastUpdated(new Date().toLocaleTimeString());
      setError('');
    } catch (err) {
      setError('Failed to load staff data');
      console.error('Staff data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-300';
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'absent': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff data...</p>
        </div>
      </div>
    );
  }

  const presentStaff = attendance.filter(a => a.status === 'present').length;
  const lateStaff = attendance.filter(a => a.status === 'late').length;
  const absentStaff = attendance.filter(a => a.status === 'absent').length;
  const totalHours = attendance.reduce((sum, a) => sum + (a.hoursWorked || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff Management Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {lastUpdated || 'Never'}
          </p>
        </div>
        <button
          onClick={loadStaffData}
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
          <div className="text-sm font-medium text-gray-600">Present Today</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{presentStaff}</div>
          <div className="text-xs text-gray-500 mt-1">Staff members</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="text-sm font-medium text-gray-600">Late Arrivals</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{lateStaff}</div>
          <div className="text-xs text-gray-500 mt-1">Staff members</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="text-sm font-medium text-gray-600">Absent Today</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{absentStaff}</div>
          <div className="text-xs text-gray-500 mt-1">Staff members</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="text-sm font-medium text-gray-600">Total Hours Today</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{totalHours.toFixed(1)}</div>
          <div className="text-xs text-gray-500 mt-1">Working hours</div>
        </div>
      </div>

      {/* Live Attendance Overview */}
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
                  Station
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours Worked
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
                attendance.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.staffName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {record.station}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(record.checkInTime).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {record.hoursWorked.toFixed(1)}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getAttendanceStatusColor(record.status)}`}>
                        {record.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Location Tracking */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Current Staff Locations</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                No location data available
              </div>
            ) : (
              locations.map((location) => (
                <div
                  key={location.staffId}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{location.staffName}</h4>
                      <p className="text-sm text-gray-600">{location.currentLocation}</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full border bg-blue-100 text-blue-800 border-blue-300">
                      ACTIVE
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Activity: {location.activity}</div>
                    <div>Last seen: {new Date(location.lastSeen).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Staff Performance Metrics</h3>
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
                  Lots Processed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Time (min)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quality Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Efficiency
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {performance.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No performance data available
                  </td>
                </tr>
              ) : (
                performance.map((metric) => (
                  <tr key={metric.staffId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {metric.staffName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {metric.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {metric.lotsProcessed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {metric.averageProcessingTime.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      <span className={getPerformanceColor(metric.qualityScore)}>
                        {metric.qualityScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      <span className={getPerformanceColor(metric.efficiency)}>
                        {metric.efficiency.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffManagementDashboard;
