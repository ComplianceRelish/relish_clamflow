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

      // Handle attendance response - ensure array
      if (attendanceRes.success && attendanceRes.data) {
        const data = Array.isArray(attendanceRes.data) ? attendanceRes.data : [];
        setAttendance(data);
      } else {
        console.warn('Failed to fetch attendance:', attendanceRes.error);
        setAttendance([]);
      }

      // Handle locations response - ensure array
      if (locationsRes.success && locationsRes.data) {
        const data = Array.isArray(locationsRes.data) ? locationsRes.data : [];
        setLocations(data);
      } else {
        console.warn('Failed to fetch staff locations:', locationsRes.error);
        setLocations([]);
      }

      // Handle performance response - ensure array
      if (performanceRes.success && performanceRes.data) {
        const data = Array.isArray(performanceRes.data) ? performanceRes.data : [];
        setPerformance(data);
      } else {
        console.warn('Failed to fetch staff performance:', performanceRes.error);
        setPerformance([]);
      }

      // Handle shifts response - ensure array
      if (shiftsRes.success && shiftsRes.data) {
        const data = Array.isArray(shiftsRes.data) ? shiftsRes.data : [];
        setShifts(data);
      } else {
        console.warn('Failed to fetch shift schedules:', shiftsRes.error);
        setShifts([]);
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
