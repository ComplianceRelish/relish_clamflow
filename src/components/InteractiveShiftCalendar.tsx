// src/components/InteractiveShiftCalendar.tsx
// Rebuilt: single DndContext, PointerSensor + TouchSensor, real DragOverlay,
//           3-period shift grid (Day/Swing/Night), plant-worker-only staff,
//           Agency TBD placeholder support, responsive mobile drawer.
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import clamflowAPI from '../lib/clamflow-api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: 'PPC' | 'FP' | 'Both';
  isAvailable: boolean;
}

type ShiftPeriod = 'Day' | 'Swing' | 'Night';

interface ShiftAssignment {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  date: string;
  shiftPeriod: ShiftPeriod;
  plant: 'PPC' | 'FP';
  isPlaceholder?: boolean;
}

export interface ShiftCalendarProps {
  currentUser?: { role: string; department: string } | null;
  onShiftUpdate?: (shift: ShiftAssignment) => void;
  onConflictDetected?: (conflicts: ShiftAssignment[]) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SHIFT_PERIODS: {
  key: ShiftPeriod;
  label: string;
  time: string;
  color: string;
  bg: string;
  border: string;
}[] = [
  { key: 'Day',   label: 'Day Shift',   time: '06:00 – 14:00', color: '#1d4ed8', bg: '#dbeafe', border: '#93c5fd' },
  { key: 'Swing', label: 'Swing Shift', time: '14:00 – 22:00', color: '#b45309', bg: '#fef3c7', border: '#fcd34d' },
  { key: 'Night', label: 'Night Shift', time: '22:00 – 06:00', color: '#6d28d9', bg: '#ede9fe', border: '#c4b5fd' },
];

// Only physical plant-floor workers are schedulable.
// Admin, Super Admin, Staff Lead, IT Staff are management roles — excluded.
const PLANT_WORKER_ROLES = new Set([
  'production_staff',
  'production_lead',
  'qc_staff',
  'qc_lead',
  'maintenance_staff',
  'security_guard',
]);

const isPlantWorker = (role: string): boolean =>
  PLANT_WORKER_ROLES.has(role.toLowerCase().replace(/\s+/g, '_'));

// Role-scoped scheduling: each Lead can ONLY schedule their own staff category.
// null = no restriction (Admin / Super Admin see all plant workers).
const LEAD_SCOPE: Record<string, string[]> = {
  'Staff Lead':      ['security_guard'],
  'Production Lead': ['production_staff'],
  'QC Lead':         ['qc_staff'],
};
const getLeadScope = (role: string): string[] | null =>
  LEAD_SCOPE[role] ?? null;

const normalizeRole = (role: string): string => {
  if (!role) return '';
  return role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const mapDepartment = (dept?: string): 'PPC' | 'FP' | 'Both' => {
  if (!dept) return 'Both';
  const d = dept.toLowerCase();
  if (d.includes('ppc') || d.includes('pre-production')) return 'PPC';
  if (d.includes('fp') || d.includes('finished')) return 'FP';
  return 'Both';
};

const ROLE_PALETTE: Record<string, { bg: string; text: string; ring: string }> = {
  'Production Lead':  { bg: '#dcfce7', text: '#166534', ring: '#86efac' },
  'Qc Lead':          { bg: '#dbeafe', text: '#1e40af', ring: '#93c5fd' },
  'Production Staff': { bg: '#f0fdf4', text: '#15803d', ring: '#bbf7d0' },
  'Qc Staff':         { bg: '#eff6ff', text: '#1d4ed8', ring: '#bfdbfe' },
  'Maintenance Staff':{ bg: '#fefce8', text: '#854d0e', ring: '#fde68a' },
  'Security Guard':   { bg: '#fef2f2', text: '#991b1b', ring: '#fca5a5' },
};
const roleColor = (role: string) =>
  ROLE_PALETTE[normalizeRole(role)] ?? { bg: '#f3f4f6', text: '#374151', ring: '#d1d5db' };

const navBtnStyle: React.CSSProperties = {
  padding: '6px 12px',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  background: 'white',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 500,
  color: '#374151',
};

// ─── StaffCardView ─────────────────────────────────────────────────────────────

const StaffCardView: React.FC<{
  staff: StaffMember;
  scheduled: boolean;
  compact?: boolean;
}> = ({ staff, scheduled, compact = false }) => {
  const c = roleColor(staff.role);
  const initial = staff.name.trim().charAt(0).toUpperCase();
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: compact ? 8 : 10,
      padding: compact ? '5px 8px' : '9px 12px',
      background: scheduled ? '#f9fafb' : 'white',
      border: `1.5px solid ${scheduled ? '#e5e7eb' : c.ring}`,
      borderRadius: 10,
      opacity: scheduled ? 0.55 : 1,
      boxShadow: scheduled ? 'none' : '0 1px 4px rgba(0,0,0,0.08)',
      cursor: scheduled ? 'default' : 'grab',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      touchAction: 'none',
    }}>
      <div style={{
        width: compact ? 28 : 34, height: compact ? 28 : 34,
        borderRadius: '50%', background: c.bg, border: `2px solid ${c.ring}`,
        color: c.text, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: compact ? 12 : 14, flexShrink: 0,
      }}>
        {initial}
      </div>
      {!compact && (
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 600, fontSize: 13, color: '#111827',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {staff.name}
          </div>
          <span style={{
            display: 'inline-block', marginTop: 2,
            padding: '1px 7px', borderRadius: 999,
            fontSize: 10, fontWeight: 600, background: c.bg, color: c.text,
          }}>
            {normalizeRole(staff.role)}
          </span>
        </div>
      )}
      {!compact && (
        <div style={{ fontSize: scheduled ? 11 : 15, color: '#9ca3af', flexShrink: 0 }}>
          {scheduled ? 'Scheduled' : '⠿'}
        </div>
      )}
    </div>
  );
};

// ─── DraggableStaff ────────────────────────────────────────────────────────────

const DraggableStaff: React.FC<{ staff: StaffMember; scheduled: boolean }> = ({
  staff, scheduled,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `staff-${staff.id}`,
    data: { staff },
    disabled: scheduled,
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined,
        opacity: isDragging ? 0 : 1,
        marginBottom: 6,
        touchAction: 'none',
      }}
    >
      <StaffCardView staff={staff} scheduled={scheduled} />
    </div>
  );
};

// ─── AssignedBadge ─────────────────────────────────────────────────────────────

const AssignedBadge: React.FC<{
  assignment: ShiftAssignment;
  period: typeof SHIFT_PERIODS[0];
  onRemove: (id: string) => void;
}> = ({ assignment, period, onRemove }) => {
  const c = roleColor(assignment.role);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'white', borderRadius: 7, padding: '4px 6px 4px 8px',
      border: `1px solid ${period.border}`,
      boxShadow: '0 1px 2px rgba(0,0,0,0.06)', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
          background: c.bg, color: c.text, border: `1.5px solid ${c.ring}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700,
        }}>
          {assignment.isPlaceholder ? '?' : assignment.staffName.trim().charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 600,
            color: assignment.isPlaceholder ? '#d97706' : '#111827',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {assignment.isPlaceholder ? '🔶 Agency – TBD' : assignment.staffName}
          </div>
          {!assignment.isPlaceholder && (
            <div style={{ fontSize: 10, color: '#6b7280' }}>{normalizeRole(assignment.role)}</div>
          )}
        </div>
      </div>
      <button
        onClick={() => onRemove(assignment.id)}
        title="Remove assignment"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#9ca3af', fontSize: 16, lineHeight: 1,
          padding: '0 2px', flexShrink: 0, transition: 'color 0.1s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
        onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}
      >
        ×
      </button>
    </div>
  );
};

// ─── ShiftCell ─────────────────────────────────────────────────────────────────

const ShiftCell: React.FC<{
  date: string;
  period: typeof SHIFT_PERIODS[0];
  assignments: ShiftAssignment[];
  onRemove: (id: string) => void;
  onAddPlaceholder?: (date: string, period: ShiftPeriod) => void;
  canAddPlaceholder: boolean;
}> = ({ date, period, assignments, onRemove, onAddPlaceholder, canAddPlaceholder }) => {
  const dropId = `${date}__${period.key}`;
  const { setNodeRef, isOver } = useDroppable({ id: dropId, data: { date, period: period.key } });
  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: 80, padding: 6, borderRadius: 8,
        background: isOver ? period.bg : assignments.length > 0 ? `${period.bg}88` : '#f9fafb',
        border: `1.5px ${isOver ? 'solid' : 'dashed'} ${
          isOver ? period.color : assignments.length > 0 ? period.border : '#d1d5db'
        }`,
        transition: 'background 0.12s, border-color 0.12s',
        display: 'flex', flexDirection: 'column', gap: 4, position: 'relative',
      }}
    >
      {assignments.length === 0 && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isOver ? period.color : '#c4c4c4',
          fontSize: 12, fontWeight: isOver ? 600 : 400,
          pointerEvents: 'none',
        }}>
          {isOver ? '↓ Drop here' : '+ Drag staff here'}
        </div>
      )}
      {assignments.map(a => (
        <AssignedBadge key={a.id} assignment={a} period={period} onRemove={onRemove} />
      ))}
      {canAddPlaceholder && assignments.length === 0 && !isOver && (
        <button
          onClick={() => onAddPlaceholder?.(date, period.key)}
          title="Add Agency Guard placeholder"
          style={{
            position: 'absolute', bottom: 5, right: 5,
            background: 'white', border: '1px dashed #f59e0b',
            borderRadius: 5, padding: '1px 6px',
            fontSize: 10, color: '#d97706', cursor: 'pointer', pointerEvents: 'all',
          }}
        >
          + Agency TBD
        </button>
      )}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

export const InteractiveShiftCalendar: React.FC<ShiftCalendarProps> = ({
  currentUser,
  onShiftUpdate,
}) => {
  const [selectedPlant, setSelectedPlant] = useState<'PPC' | 'FP'>('PPC');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeStaff, setActiveStaff] = useState<StaffMember | null>(null);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [shiftDefinitions, setShiftDefinitions] = useState<{ id: string; name: string; shiftType: string }[]>([]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const canManageSecurity = useMemo(() =>
    ['Staff Lead', 'Admin', 'Super Admin'].includes(currentUser?.role ?? ''),
    [currentUser]
  );

  // Configured sensors: 8px move = desktop drag, 200ms hold = mobile touch drag
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  // ── Staff fetch ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoadingStaff(true);
      setStaffError(null);
      try {
        // Fallback union: getStaffForScheduler and getStaff return different generics
        // Cast to a common shape to avoid TypeScript complaining about incompatible types
        type AnyApiRes = { success: boolean; data: any[] } | null;
        let res: AnyApiRes = await (clamflowAPI.getStaffForScheduler() as unknown as Promise<AnyApiRes>).catch(() => null);
        if (!res?.success) {
          res = await (clamflowAPI.getStaff() as unknown as Promise<AnyApiRes>).catch(() => null);
        }
        if (cancelled) return;
        if (res?.success && res.data) {
          const mapped: StaffMember[] = res.data
            .filter((p: any) => isPlantWorker(p.role ?? p.designation ?? ''))
            .map((p: any) => ({
              id: p.id ?? p.personId ?? p.person_id ?? String(Math.random()),
              name: (p.fullName ?? p.full_name ??
                `${p.firstName ?? p.first_name ?? ''} ${p.lastName ?? p.last_name ?? ''}`
              ).trim() || 'Unknown',
              role: p.role ?? p.designation ?? '',
              department: mapDepartment(p.department ?? p.plant),
              isAvailable:
                (p.isActive ?? p.is_active) !== false &&
                p.status !== 'inactive',
            }));
          setStaffList(mapped);
        } else {
          setStaffError('Could not load staff. Please retry.');
        }
      } catch { if (!cancelled) setStaffError('Error loading staff.'); }
      finally   { if (!cancelled) setIsLoadingStaff(false); }
    };
    load();
    const t = setInterval(load, 300_000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  // ── Shift definitions ────────────────────────────────────────────────────────
  useEffect(() => {
    clamflowAPI.getShiftDefinitions()
      .then(r => {
        if (r?.success && r.data) {
          setShiftDefinitions(
            // Backend returns shift_type → camelCase transform gives shiftType.
            // The ShiftDefinition interface still uses code (legacy), so we map explicitly.
            (r.data as any[]).map(d => ({
              id: d.id,
              name: d.name ?? '',
              shiftType: d.shiftType ?? d.shift_type ?? d.name ?? '',
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  // ── Existing assignments for visible week ────────────────────────────────────
  useEffect(() => {
    if (!staffList.length) return;
    let cancelled = false;
    const load = async () => {
      setIsLoadingAssignments(true);
      try {
        const start = format(weekStart, 'yyyy-MM-dd');
        const end   = format(addDays(weekStart, 6), 'yyyy-MM-dd');
        const res = await clamflowAPI.getShiftAssignments({
          start_date: start, end_date: end, plant: selectedPlant,
        });
        if (cancelled) return;
        if (res?.success && res.data) {
          const mapped: ShiftAssignment[] = res.data.map((a: any) => {
            // Backend enriched response returns shiftType flat (after camelCase transform)
            const shiftType = (
              a.shiftType ?? a.shift_type ?? a.shiftDefinition?.shiftType ?? ''
            ).toLowerCase();
            const period: ShiftPeriod =
              shiftType.includes('night') ? 'Night' :
              shiftType.includes('swing') || shiftType.includes('afternoon') ? 'Swing' : 'Day';
            const staff = staffList.find(s => s.id === (a.staffId ?? a.staff_id));
            return {
              id: a.id,
              staffId: a.staffId ?? a.staff_id,
              staffName: staff?.name ?? a.staffName ?? a.staff?.full_name ?? 'Unknown',
              role: staff?.role ?? a.role ?? '',
              date: a.date,
              shiftPeriod: period,
              plant: a.plant ?? selectedPlant,
            };
          });
          setAssignments(mapped);
        }
      } catch { /* fail silently */ }
      finally { if (!cancelled) setIsLoadingAssignments(false); }
    };
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart.toISOString(), selectedPlant, staffList.length]);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const visibleStaff = useMemo(() => {
    const scope = getLeadScope(currentUser?.role ?? '');
    return staffList.filter(s => {
      if (!s.isAvailable) return false;
      if (s.department !== selectedPlant && s.department !== 'Both') return false;
      // Apply lead-specific scope: only show the category they are permitted to schedule
      const rawRole = s.role.toLowerCase().replace(/\s+/g, '_');
      if (scope && !scope.includes(rawRole)) return false;
      return true;
    });
  }, [staffList, selectedPlant, currentUser?.role]);

  const staffGroups = useMemo(() => {
    const g: Record<string, StaffMember[]> = {};
    for (const s of visibleStaff) {
      const label = normalizeRole(s.role);
      if (!g[label]) g[label] = [];
      g[label].push(s);
    }
    return g;
  }, [visibleStaff]);

  const isScheduledThisWeek = useCallback(
    (id: string) => assignments.some(a => a.staffId === id),
    [assignments]
  );

  // ── DnD ──────────────────────────────────────────────────────────────────────
  const handleDragStart = (e: DragStartEvent) => {
    const staff = e.active.data.current?.staff as StaffMember | undefined;
    if (staff) setActiveStaff(staff);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveStaff(null);
    const { active, over } = event;
    if (!over) return;
    const staff = active.data.current?.staff as StaffMember | undefined;
    const dropData = over.data.current as { date: string; period: ShiftPeriod } | undefined;
    if (!staff || !dropData) return;

    // Prevent duplicate assignment on same day+period
    if (assignments.some(a =>
      a.staffId === staff.id &&
      a.date === dropData.date &&
      a.shiftPeriod === dropData.period
    )) return;

    const tempId = `temp-${Date.now()}`;
    const newAssignment: ShiftAssignment = {
      id: tempId, staffId: staff.id, staffName: staff.name,
      role: staff.role, date: dropData.date,
      shiftPeriod: dropData.period, plant: selectedPlant,
    };

    setAssignments(prev => [...prev, newAssignment]);
    onShiftUpdate?.(newAssignment);

    setIsSaving(true);
    try {
      const p = dropData.period;
      // Backend returns shiftType (camelCase after transform), not code
      const shiftDef = shiftDefinitions.find(d => {
        const type = (d.shiftType ?? d.name ?? '').toLowerCase();
        if (p === 'Night') return type.includes('night');
        if (p === 'Swing') return type.includes('swing') || type.includes('afternoon');
        return type.includes('day') || type.includes('morning');
      });

      if (!shiftDef) {
        // No matching shift definition — roll back optimistic update
        setAssignments(prev => prev.filter(a => a.id !== tempId));
        console.error(`No shift definition found for period "${p}". Check that shift definitions are seeded in the database.`);
        setIsSaving(false);
        return;
      }

      const res = await clamflowAPI.createShiftAssignment({
        staff_id: staff.id,
        shift_definition_id: shiftDef.id,
        date: dropData.date,
        plant: selectedPlant,
        notes: 'Assigned via shift calendar',
      });
      if (res?.success && res.data) {
        setAssignments(prev =>
          prev.map(a => a.id === tempId ? { ...a, id: res.data!.id } : a)
        );
      } else {
        setAssignments(prev => prev.filter(a => a.id !== tempId));
      }
    } catch {
      setAssignments(prev => prev.filter(a => a.id !== tempId));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    const found = assignments.find(a => a.id === id);
    if (!found) return;
    setAssignments(prev => prev.filter(a => a.id !== id));
    if (!id.startsWith('temp-') && !id.startsWith('placeholder-')) {
      try {
        const ok = await clamflowAPI.deleteShiftAssignment(id);
        if (!ok?.success) setAssignments(prev => [...prev, found]);
      } catch {
        setAssignments(prev => [...prev, found]);
      }
    }
  };

  const handleAddPlaceholder = (date: string, period: ShiftPeriod) => {
    setAssignments(prev => [...prev, {
      id: `placeholder-${Date.now()}`,
      staffId: 'agency-tbd',
      staffName: 'Agency Guard – TBD',
      role: 'security_guard',
      date, shiftPeriod: period, plant: selectedPlant, isPlaceholder: true,
    }]);
  };

  // ── Staff panel (desktop sidebar + mobile drawer share this) ─────────────────
  const StaffPanel = () => {
    const scopeLabel =
      currentUser?.role === 'Staff Lead'      ? 'Security Guards' :
      currentUser?.role === 'Production Lead' ? 'Production Staff' :
      currentUser?.role === 'QC Lead'         ? 'QC Staff' :
      'All Plant Workers';
    return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid #e5e7eb',
        background: '#f9fafb', flexShrink: 0,
      }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>👷 {scopeLabel}</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
          {visibleStaff.length} available · drag a card to assign
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {isLoadingStaff ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>
            <div style={{ fontSize: 24 }}>⏳</div>
            <div style={{ marginTop: 8, fontSize: 13 }}>Loading staff…</div>
          </div>
        ) : staffError ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#ef4444', fontSize: 13 }}>
            ⚠️ {staffError}
          </div>
        ) : visibleStaff.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#9ca3af', fontSize: 13 }}>
            No {selectedPlant} plant workers found.
          </div>
        ) : (
          Object.entries(staffGroups).map(([role, members]) => (
            <div key={role} style={{ marginBottom: 18 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: '#9ca3af',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: 6, paddingLeft: 2,
              }}>
                {role} ({members.length})
              </div>
              {members.map(s => (
                <DraggableStaff key={s.id} staff={s} scheduled={isScheduledThisWeek(s.id)} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    // DndContext wraps the ENTIRE layout — sidebar draggables + grid droppables
    // share the same context. This is the critical fix from the old broken code.
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100vh',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        background: '#f1f5f9', overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{
          background: 'white', borderBottom: '1px solid #e5e7eb',
          padding: '10px 20px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
          flexShrink: 0, zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src="/logo-relish.png" alt="ClamFlow"
              style={{ height: 30, objectFit: 'contain' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Shift Scheduling</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
                {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
                {isSaving && <span style={{ marginLeft: 8, color: '#2563eb', fontWeight: 500 }}>⟳ Saving…</span>}
                {isLoadingAssignments && !isSaving && <span style={{ marginLeft: 8, color: '#9ca3af' }}>Loading…</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Week nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <button onClick={() => setCurrentDate(d => addDays(d, -7))} style={navBtnStyle}>‹ Prev</button>
              <button onClick={() => setCurrentDate(new Date())} style={{ ...navBtnStyle, color: '#6b7280' }}>Today</button>
              <button onClick={() => setCurrentDate(d => addDays(d, 7))} style={navBtnStyle}>Next ›</button>
            </div>

            {/* Mobile: open staff drawer */}
            <button
              id="mobile-staff-toggle"
              onClick={() => setShowMobileDrawer(true)}
              style={{ ...navBtnStyle, display: 'none' }}
            >
              👷 Staff
            </button>
          </div>
        </div>

        {/* ── Plant tabs — full-width, prominent, mobile-friendly ── */}
        <div style={{
          display: 'flex', flexShrink: 0,
          background: 'white', borderBottom: '2px solid #e5e7eb',
        }}>
          {(['PPC', 'FP'] as const).map(p => (
            <button
              key={p}
              onClick={() => setSelectedPlant(p)}
              style={{
                flex: 1, padding: '14px 12px',
                border: 'none', cursor: 'pointer',
                background: selectedPlant === p ? '#eff6ff' : 'white',
                borderBottom: `3px solid ${selectedPlant === p ? '#2563eb' : 'transparent'}`,
                transition: 'background 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              <span style={{ fontSize: 22 }}>{p === 'PPC' ? '🏭' : '📦'}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{
                  fontWeight: 700, fontSize: 15,
                  color: selectedPlant === p ? '#1d4ed8' : '#374151',
                }}>
                  {p === 'PPC' ? 'PPC Plant' : 'FP Plant'}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                  {p === 'PPC' ? 'Pre-Processing Calendar' : 'Finished Products Calendar'}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Desktop sidebar */}
          <div id="desktop-staff-sidebar" style={{
            width: 256, flexShrink: 0, background: 'white',
            borderRight: '1px solid #e5e7eb',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <StaffPanel />
          </div>

          {/* Grid */}
          <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', padding: 16 }}>
            <div style={{
              minWidth: 680, background: 'white',
              borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden',
            }}>
              {/* Day header row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '110px repeat(7, 1fr)',
                borderBottom: '2px solid #e5e7eb',
                background: '#f9fafb',
              }}>
                <div style={{ padding: '10px 12px', borderRight: '1px solid #e5e7eb' }} />
                {weekDays.map(day => {
                  const today = isSameDay(day, new Date());
                  return (
                    <div key={day.toISOString()} style={{
                      padding: '8px 6px', textAlign: 'center',
                      borderRight: '1px solid #f0f0f0',
                      background: today ? '#eff6ff' : 'transparent',
                    }}>
                      <div style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: today ? '#2563eb' : '#6b7280',
                      }}>
                        {format(day, 'EEE')}
                      </div>
                      <div style={{
                        fontSize: 18, fontWeight: 700, marginTop: 1,
                        color: today ? '#2563eb' : '#111827',
                      }}>
                        {format(day, 'd')}
                      </div>
                      <div style={{ fontSize: 10, color: '#9ca3af' }}>{format(day, 'MMM')}</div>
                    </div>
                  );
                })}
              </div>

              {/* Shift period rows: Day / Swing / Night */}
              {SHIFT_PERIODS.map((period, pIdx) => (
                <div key={period.key} style={{
                  display: 'grid',
                  gridTemplateColumns: '110px repeat(7, 1fr)',
                  borderBottom: pIdx < SHIFT_PERIODS.length - 1 ? '1px solid #e5e7eb' : 'none',
                  minHeight: 100,
                }}>
                  {/* Period label */}
                  <div style={{
                    padding: '12px 10px', background: `${period.bg}66`,
                    borderRight: '2px solid #e5e7eb',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3,
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: period.color }}>{period.label}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af', lineHeight: 1.4 }}>{period.time}</div>
                  </div>

                  {/* Day cells */}
                  {weekDays.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const cellAssignments = assignments.filter(
                      a => a.date === dateStr && a.shiftPeriod === period.key
                    );
                    return (
                      <div key={dateStr} style={{ padding: 6, borderRight: '1px solid #f3f4f6' }}>
                        <ShiftCell
                          date={dateStr}
                          period={period}
                          assignments={cellAssignments}
                          onRemove={handleRemove}
                          canAddPlaceholder={canManageSecurity}
                          onAddPlaceholder={handleAddPlaceholder}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div style={{
              display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 14,
              padding: '10px 14px', background: 'white',
              borderRadius: 10, border: '1px solid #e5e7eb',
            }}>
              {SHIFT_PERIODS.map(p => (
                <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: 3,
                    background: p.bg, border: `1.5px solid ${p.color}`,
                  }} />
                  <span style={{ fontSize: 12, color: '#374151' }}>{p.label} · {p.time}</span>
                </div>
              ))}
              {canManageSecurity && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: 3,
                    background: '#fef3c7', border: '1.5px dashed #f59e0b',
                  }} />
                  <span style={{ fontSize: 12, color: '#374151' }}>Agency Guard Placeholder</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Mobile staff drawer ── */}
        <AnimatePresence>
          {showMobileDrawer && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowMobileDrawer(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 40 }}
              />
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 32, stiffness: 320 }}
                style={{
                  position: 'fixed', bottom: 0, left: 0, right: 0, height: '72vh',
                  background: 'white', borderRadius: '18px 18px 0 0',
                  zIndex: 50, display: 'flex', flexDirection: 'column', overflow: 'hidden',
                }}
              >
                <div style={{
                  padding: '14px 16px', borderBottom: '1px solid #e5e7eb',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  flexShrink: 0,
                }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Assign Staff</div>
                  <button
                    onClick={() => setShowMobileDrawer(false)}
                    style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                  >✕</button>
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}><StaffPanel /></div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── DragOverlay — real ghost card that follows cursor/finger ── */}
        <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
          {activeStaff && (
            <div style={{
              pointerEvents: 'none', width: 230,
              transform: 'rotate(1.5deg)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.22)',
              borderRadius: 12, border: '2px solid #2563eb',
              background: 'white', padding: '10px 12px',
            }}>
              <StaffCardView staff={activeStaff} scheduled={false} />
            </div>
          )}
        </DragOverlay>
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          #desktop-staff-sidebar { display: none !important; }
          #mobile-staff-toggle   { display: inline-flex !important; }
        }
      `}</style>
    </DndContext>
  );
};

export default InteractiveShiftCalendar;
