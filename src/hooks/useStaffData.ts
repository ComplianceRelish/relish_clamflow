// src/hooks/useStaffData.ts
// Real-time Staff Management data hook with 30-second polling
'use client';

import { useState, useEffect, useCallback } from 'react';
import clamflowAPI from '@/lib/clamflow-api';
import { AttendanceRecord, StaffLocation, StaffPerformance, ShiftSchedule } from '@/types/dashboard';

interface UseStaffDataReturn {
  attendance: AttendanceRecord[];
  locations: StaffLocation[];
  performance: StaffPerformance[];
  shifts: ShiftSchedule[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useStaffData(): UseStaffDataReturn {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [locations, setLocations] = useState<StaffLocation[]>([]);
  const [performance, setPerformance] = useState<StaffPerformance[]>([]);
  const [shifts, setShifts] = useState<ShiftSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      const [attendanceRes, locationsRes, performanceRes, shiftsRes] = await Promise.all([
        clamflowAPI.getStaffAttendance(),
        clamflowAPI.getStaffLocations(),
        clamflowAPI.getStaffPerformance(),
        clamflowAPI.getShiftSchedules(),
      ]);

      // Handle attendance response
      if (attendanceRes.success && attendanceRes.data) {
        setAttendance(attendanceRes.data);
      } else {
        console.warn('Failed to fetch attendance:', attendanceRes.error);
      }

      // Handle locations response
      if (locationsRes.success && locationsRes.data) {
        setLocations(locationsRes.data);
      } else {
        console.warn('Failed to fetch staff locations:', locationsRes.error);
      }

      // Handle performance response
      if (performanceRes.success && performanceRes.data) {
        setPerformance(performanceRes.data);
      } else {
        console.warn('Failed to fetch staff performance:', performanceRes.error);
      }

      // Handle shifts response
      if (shiftsRes.success && shiftsRes.data) {
        setShifts(shiftsRes.data);
      } else {
        console.warn('Failed to fetch shift schedules:', shiftsRes.error);
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
    // Initial fetch
    fetchData();

    // Poll every 30 seconds for real-time updates
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    attendance,
    locations,
    performance,
    shifts,
    loading,
    error,
    refetch: fetchData,
    lastUpdated,
  };
}
