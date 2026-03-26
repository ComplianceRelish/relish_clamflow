// src/components/InteractiveStationAssignment.tsx
// Production-ready: Uses real staff and station data from backend API
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import clamflowAPI from '../lib/clamflow-api';

// Types based on your production flow
interface StationAssignment {
  id: string;
  stationId: string;
  staffId: string;
  staffName: string;
  startTime: string;
  endTime: string;
  shiftType: 'Day' | 'Swing' | 'Night' | 'Overtime';
  skills: string[];
  certifications: string[];
}

interface ProductionStation {
  id: string;
  name: string;
  type: 'PPC' | 'FP';
  category: 'receiving' | 'depuration' | 'processing' | 'rfid' | 'freezer' | 'packing' | 'storage' | 'sentry' | 'product-store' | 'machine-room';
  capacity: number;
  currentStaff: StationAssignment[];
  requiredSkills: string[];
  status: 'operational' | 'maintenance' | 'offline';
  coordinates: { x: number; y: number };
  formType?: 'PPCForm' | 'FPForm' | 'QCFlow';
  equipmentIds?: string[];
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: 'PPC' | 'FP' | 'Both';
  avatar: string;
  isAvailable: boolean;
  skills: string[];
  certifications: string[];
  currentStation?: string;
  shiftPreference: string[];
}

// Default station configurations matching the actual PPC Plant Layout
const DEFAULT_PPC_STATIONS: ProductionStation[] = [
  {
    id: 'ppc-receiving',
    name: 'RM Station (Weight Note)',
    type: 'PPC',
    category: 'receiving',
    capacity: 2,
    currentStaff: [],
    requiredSkills: ['Material Handling', 'Weight Note'],
    status: 'operational',
    coordinates: { x: 0, y: 0 },
    equipmentIds: ['scale-01', 'scanner-01']
  },
  {
    id: 'ppc-depuration-tanks',
    name: 'Depuration Tanks (T1–T8)',
    type: 'PPC' as const,
    category: 'depuration' as const,
    capacity: 3,
    currentStaff: [],
    requiredSkills: ['Tank Operation', 'Water Quality'],
    status: 'operational' as const,
    coordinates: { x: 0, y: 0 },
    equipmentIds: ['tank-1', 'tank-2', 'tank-3', 'tank-4', 'tank-5', 'tank-6', 'tank-7', 'tank-8']
  },
  {
    id: 'ppc-processing',
    name: 'PPC Station (PPC Form)',
    type: 'PPC',
    category: 'processing',
    capacity: 4,
    currentStaff: [],
    requiredSkills: ['Processing', 'PPC Form'],
    status: 'operational',
    coordinates: { x: 0, y: 0 },
    formType: 'PPCForm',
    equipmentIds: ['rfid-tagger-01', 'conveyor-01']
  },
  {
    id: 'ppc-product-store',
    name: 'Product Store',
    type: 'PPC',
    category: 'product-store',
    capacity: 1,
    currentStaff: [],
    requiredSkills: ['Storage Management'],
    status: 'operational',
    coordinates: { x: 0, y: 0 },
    equipmentIds: []
  },
  {
    id: 'ppc-main-gate',
    name: 'Main Gate (Sentry)',
    type: 'PPC',
    category: 'sentry',
    capacity: 1,
    currentStaff: [],
    requiredSkills: ['Security'],
    status: 'operational',
    coordinates: { x: 0, y: 0 },
    equipmentIds: []
  }
];

const DEFAULT_FP_STATIONS: ProductionStation[] = [
  {
    id: 'fp-rfid-in',
    name: 'Product In RFID',
    type: 'FP',
    category: 'rfid',
    capacity: 1,
    currentStaff: [],
    requiredSkills: ['RFID Scanning', 'Inventory'],
    status: 'operational',
    coordinates: { x: 50, y: 100 },
    equipmentIds: ['rfid-scanner-02']
  },
  {
    id: 'fp-freezer',
    name: 'Freezer',
    type: 'FP',
    category: 'freezer',
    capacity: 2,
    currentStaff: [],
    requiredSkills: ['Temperature Control', 'Cold Storage'],
    status: 'operational',
    coordinates: { x: 200, y: 100 },
    equipmentIds: ['freezer-01', 'temp-monitor-01']
  },
  {
    id: 'fp-packing',
    name: 'Packing Station',
    type: 'FP',
    category: 'packing',
    capacity: 4,
    currentStaff: [],
    requiredSkills: ['Packing', 'FP Form', 'Quality Check'],
    status: 'operational',
    coordinates: { x: 400, y: 100 },
    formType: 'FPForm',
    equipmentIds: ['packing-line-01', 'labeler-01']
  },
  {
    id: 'fp-cold-storage',
    name: 'Cold Storage',
    type: 'FP',
    category: 'storage',
    capacity: 1,
    currentStaff: [],
    requiredSkills: ['Storage Management', 'Temperature Control'],
    status: 'operational',
    coordinates: { x: 600, y: 100 },
    equipmentIds: ['storage-sys-01']
  }
];

// Roles that are relevant for production floor station assignment
// Excludes: Super Admin, Admin, Staff Lead (administrative/HR roles)
const FLOOR_ROLES = [
  'Production Lead',
  'QC Lead',
  'Production Staff',
  'QC Staff',
  'Security Guard',
];

// Normalize role string to Title Case for consistent matching
const normalizeRole = (role: string): string => {
  if (!role) return '';
  // Handle snake_case: production_lead -> Production Lead
  const spaced = role.replace(/_/g, ' ');
  return spaced.replace(/\b\w/g, c => c.toUpperCase());
};

// Check if a role is a floor-relevant role
const isFloorRole = (role: string): boolean => {
  const normalized = normalizeRole(role);
  return FLOOR_ROLES.includes(normalized);
};

// Display order for staff panel grouping
const STAFF_PANEL_GROUPS = [
  { label: 'Production Lead', roles: ['Production Lead'] },
  { label: 'QC Lead', roles: ['QC Lead'] },
  { label: 'Production Staff', roles: ['Production Staff'] },
  { label: 'QC Staff', roles: ['QC Staff'] },
  { label: 'Security', roles: ['Security Guard'] },
];

// Helper to map department
const mapDepartment = (dept: string | undefined): 'PPC' | 'FP' | 'Both' => {
  if (!dept) return 'Both';
  const deptLower = dept.toLowerCase();
  if (deptLower.includes('ppc') || deptLower.includes('pre-production')) return 'PPC';
  if (deptLower.includes('fp') || deptLower.includes('finished')) return 'FP';
  return 'Both';
};

// Draggable Staff Component
const DraggableStaff: React.FC<{ staff: StaffMember; isAssigned: boolean }> = ({ 
  staff, 
  isAssigned 
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: staff.id,
    data: { staff },
    disabled: !staff.isAvailable || isAssigned
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1
  } : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`staff-card ${!staff.isAvailable ? 'unavailable' : ''} ${isAssigned ? 'assigned' : ''}`}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="staff-avatar">
        <img src={staff.avatar} alt={staff.name} onError={(e) => {
          (e.target as HTMLImageElement).src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="%23667eea"/><text x="20" y="25" text-anchor="middle" fill="white" font-size="16" font-weight="bold">${staff.name.charAt(0)}</text></svg>`;
        }} />
      </div>
      <div className="staff-info">
        <div className="staff-name">{staff.name}</div>
        <div className="staff-role">{staff.role} - {staff.department}</div>
        <div className="staff-skills">
          {staff.skills.slice(0, 2).map(skill => (
            <span key={skill} className="skill-badge">{skill}</span>
          ))}
          {staff.skills.length > 2 && <span className="skill-more">+{staff.skills.length - 2}</span>}
        </div>
        <div className="staff-certs">
          {staff.certifications.map(cert => (
            <span key={cert} className="cert-badge">{cert}</span>
          ))}
        </div>
      </div>
      <div className={`status-indicator ${staff.isAvailable ? 'available' : 'unavailable'}`}>
        {isAssigned ? '📍' : staff.isAvailable ? '✅' : '⏸️'}
      </div>
    </motion.div>
  );
};

// Droppable Station Component — shows assigned staff with name & photo
const StationDropZone: React.FC<{
  station: ProductionStation;
  onStationClick: (station: ProductionStation) => void;
  isSelected: boolean;
  compact?: boolean;
}> = ({ station, onStationClick, isSelected, compact = false }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: station.id,
    data: { station }
  });

  const getStationColor = () => {
    switch (station.status) {
      case 'operational': return '#E3F2FD';
      case 'maintenance': return '#FFF3E0';
      case 'offline': return '#FFEBEE';
      default: return '#F5F5F5';
    }
  };

  const getStationIcon = () => {
    switch (station.category) {
      case 'receiving': return '📦';
      case 'depuration': return '🏊';
      case 'processing': return '⚙️';
      case 'rfid': return '📡';
      case 'freezer': return '❄️';
      case 'packing': return '📋';
      case 'storage': return '🏪';
      case 'sentry': return '🛡️';
      case 'product-store': return '🏬';
      case 'machine-room': return '🔧';
      default: return '🏭';
    }
  };

  const staffInitialAvatar = (name: string) => 
    `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="%23667eea"/><text x="16" y="21" text-anchor="middle" fill="white" font-size="14" font-weight="bold">${encodeURIComponent(name.charAt(0))}</text></svg>`;

  return (
    <motion.div
      ref={setNodeRef}
      className={`station-zone ${isOver ? 'drop-hover' : ''} ${isSelected ? 'selected' : ''} ${compact ? 'compact' : ''}`}
      style={{
        backgroundColor: getStationColor(),
        borderColor: isSelected ? '#667eea' : isOver ? '#4CAF50' : 'rgba(0,0,0,0.12)'
      }}
      onClick={() => onStationClick(station)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="station-header">
        <div className="station-icon">{getStationIcon()}</div>
        <div className="station-name">{station.name}</div>
        <div className={`station-status ${station.status}`}>
          <div className="status-dot"></div>
        </div>
      </div>
      
      <div className="station-info">
        <div className="capacity-info">
          👤 {station.currentStaff.length}/{station.capacity}
        </div>
        {station.formType && (
          <div className="form-indicator">{station.formType}</div>
        )}
      </div>

      {/* Assigned Staff with Photos */}
      <div className="assigned-staff-photos">
        {station.currentStaff.length === 0 ? (
          <div className="empty-slot">Drop staff here</div>
        ) : (
          station.currentStaff.map(assignment => (
            <div key={assignment.id} className="staff-photo-card">
              <img 
                className="staff-photo" 
                src={staffInitialAvatar(assignment.staffName)}
                alt={assignment.staffName}
              />
              <div className="staff-photo-info">
                <div className="staff-photo-name">{assignment.staffName}</div>
                <div className="staff-photo-time">{assignment.startTime}-{assignment.endTime}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

// Main Component
export const InteractiveStationAssignment: React.FC = () => {
  const router = useRouter();
  const [selectedPlant, setSelectedPlant] = useState<'PPC' | 'FP'>('PPC');
  const [stations, setStations] = useState<ProductionStation[]>([...DEFAULT_PPC_STATIONS, ...DEFAULT_FP_STATIONS]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStation, setSelectedStation] = useState<ProductionStation | null>(null);
  const [assignments, setAssignments] = useState<StationAssignment[]>([]);
  const [showStaffPanel, setShowStaffPanel] = useState(true);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [isLoadingStations, setIsLoadingStations] = useState(true);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch stations from backend API
  useEffect(() => {
    const fetchStations = async () => {
      setIsLoadingStations(true);
      try {
        const response = await clamflowAPI.getStationsWithAssignments(selectedDate, selectedPlant);
        
        // Start from default stations for the complete plant layout
        const defaults = selectedPlant === 'PPC' ? DEFAULT_PPC_STATIONS : DEFAULT_FP_STATIONS;
        
        if (response.success && response.data && response.data.length > 0) {
          // Build a lookup of backend stations by code
          const backendByCode: Record<string, any> = {};
          for (const station of response.data) {
            const code = station.code || '';
            if (code) backendByCode[code] = station;
          }

          // Merge: for each default, if backend has a matching code use the backend UUID id
          // For non-matching defaults, auto-create in backend so we get a real UUID
          const mergedStations: ProductionStation[] = [];
          for (const def of defaults) {
            const backendMatch = backendByCode[def.id]; // def.id IS the code (e.g. 'ppc-receiving')
            if (backendMatch) {
              // Use backend UUID, keep frontend display properties
              mergedStations.push({
                ...def,
                id: backendMatch.id, // UUID from backend
                capacity: backendMatch.capacity || def.capacity,
                currentStaff: (backendMatch.assignments || []).map((a: any) => ({
                  id: a.id,
                  stationId: backendMatch.id,
                  staffId: a.staffId || a.staff_id,
                  staffName: a.staff?.full_name || a.staffName || a.staff_name || 'Unknown',
                  startTime: a.startTime || a.start_time || '08:00',
                  endTime: a.endTime || a.end_time || '16:00',
                  shiftType: 'Day' as const,
                  skills: [],
                  certifications: []
                })),
                status: (backendMatch.status || def.status) as 'operational' | 'maintenance' | 'offline',
              });
              delete backendByCode[def.id]; // mark as used
            } else {
              // Default station not in backend — auto-create it
              try {
                const createResp = await clamflowAPI.createStation({
                  name: def.name,
                  code: def.id, // def.id is the code string
                  plant_type: def.type,
                  station_type: def.category,
                  capacity: def.capacity,
                  status: def.status || 'operational',
                  station_order: defaults.indexOf(def),
                  required_skills: def.requiredSkills.join(', '),
                  description: def.name,
                });
                if (createResp.success && createResp.data) {
                  mergedStations.push({ ...def, id: createResp.data.id });
                } else {
                  // Fallback: keep string id (assignment will fail gracefully)
                  mergedStations.push(def);
                }
              } catch {
                mergedStations.push(def);
              }
            }
          }

          // Add any remaining backend stations not matching any default
          for (const code of Object.keys(backendByCode)) {
            const station = backendByCode[code];
            mergedStations.push({
              id: station.id,
              name: station.name,
              type: (station.plantType || station.plant_type) as 'PPC' | 'FP',
              category: (station.stationType || station.station_type) as ProductionStation['category'],
              capacity: station.capacity || 2,
              currentStaff: (station.assignments || []).map((a: any) => ({
                id: a.id,
                stationId: station.id,
                staffId: a.staffId || a.staff_id,
                staffName: a.staff?.full_name || a.staffName || a.staff_name || 'Unknown',
                startTime: a.startTime || a.start_time || '08:00',
                endTime: a.endTime || a.end_time || '16:00',
                shiftType: 'Day' as const,
                skills: [],
                certifications: []
              })),
              requiredSkills: (station.requiredSkills || station.required_skills)?.split?.(',')?.map((s: string) => s.trim()) || [],
              status: (station.status || 'operational') as 'operational' | 'maintenance' | 'offline',
              coordinates: { x: 0, y: 0 },
              formType: undefined,
              equipmentIds: []
            });
          }
          
          // Keep both plants — merge with the other plant's defaults
          const otherDefaults = selectedPlant === 'PPC' ? DEFAULT_FP_STATIONS : DEFAULT_PPC_STATIONS;
          setStations([...mergedStations, ...otherDefaults]);
          
          // Also update assignments from the merged data
          const allAssignments = mergedStations.flatMap(s => s.currentStaff);
          setAssignments(allAssignments);
        } else {
          // No backend stations at all — auto-create all defaults
          console.log('No backend stations found, auto-creating defaults...');
          const createdStations: ProductionStation[] = [];
          for (const def of defaults) {
            try {
              const createResp = await clamflowAPI.createStation({
                name: def.name,
                code: def.id,
                plant_type: def.type,
                station_type: def.category,
                capacity: def.capacity,
                status: def.status || 'operational',
                station_order: defaults.indexOf(def),
                required_skills: def.requiredSkills.join(', '),
                description: def.name,
              });
              if (createResp.success && createResp.data) {
                createdStations.push({ ...def, id: createResp.data.id });
              } else {
                createdStations.push(def);
              }
            } catch {
              createdStations.push(def);
            }
          }
          const otherDefaults = selectedPlant === 'PPC' ? DEFAULT_FP_STATIONS : DEFAULT_PPC_STATIONS;
          setStations([...createdStations, ...otherDefaults]);
        }
      } catch (error) {
        console.error('Error fetching stations:', error);
        // Keep default stations on error
      } finally {
        setIsLoadingStations(false);
      }
    };

    fetchStations();
  }, [selectedDate, selectedPlant]);

  // Fetch staff data from API on mount
  useEffect(() => {
    const fetchStaffData = async () => {
      setIsLoadingStaff(true);
      setStaffError(null);
      try {
        const response = await clamflowAPI.getStaff();
        if (response.success && response.data) {
          // Map backend staff data to component format
          // Filter to only floor-relevant roles (exclude Super Admin, Admin, Staff Lead)
          const mappedStaff: StaffMember[] = response.data
            .filter((person: any) => isFloorRole(person.role || person.designation || ''))
            .map((person: any) => ({
              id: person.id || person.personId || person.person_id || String(Math.random()),
              name: person.fullName || person.full_name || `${person.firstName || person.first_name || ''} ${person.lastName || person.last_name || ''}`.trim() || 'Unknown',
              role: normalizeRole(person.role || person.designation || ''),
              department: mapDepartment(person.department),
              avatar: person.faceImageUrl || person.face_image_url || '',
              isAvailable: (person.isActive ?? person.is_active) !== false && person.status !== 'inactive',
              skills: person.skills || person.certifications || [],
              certifications: person.certifications || [],
              currentStation: undefined,
              shiftPreference: ['Day', 'Swing']
            }));
          setStaff(mappedStaff);
        } else {
          setStaffError('Failed to load staff data');
          setStaff([]);
        }
      } catch (error) {
        console.error('Error fetching staff data:', error);
        setStaffError('Error loading staff data');
        setStaff([]);
      } finally {
        setIsLoadingStaff(false);
      }
    };

    fetchStaffData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchStaffData, 300000);
    return () => clearInterval(interval);
  }, []);

  // Get current plant stations
  const currentStations = stations.filter(s => s.type === selectedPlant);

  // Check if staff is assigned
  const isStaffAssigned = (staffId: string) => {
    return assignments.some(a => a.staffId === staffId);
  };

  // Save assignment to backend
  const saveAssignmentToBackend = async (assignment: StationAssignment, stationId: string): Promise<string | null> => {
    try {
      const response = await clamflowAPI.createStationAssignment({
        station_id: stationId,
        staff_id: assignment.staffId,
        assigned_date: selectedDate,
        start_time: assignment.startTime,
        end_time: assignment.endTime,
        notes: `Assigned via station assignment UI`
      });
      
      if (response.success && response.data) {
        return response.data.id;
      }
      return null;
    } catch (error) {
      console.error('Error saving assignment:', error);
      return null;
    }
  };

  // Delete assignment from backend
  const deleteAssignmentFromBackend = async (assignmentId: string): Promise<boolean> => {
    try {
      const response = await clamflowAPI.deleteStationAssignment(assignmentId);
      return response.success;
    } catch (error) {
      console.error('Error deleting assignment:', error);
      return false;
    }
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const staffMember = active.data.current?.staff as StaffMember;
    const station = over.data.current?.station as ProductionStation;
    
    if (!staffMember || !station) return;

    // Check capacity
    if (station.currentStaff.length >= station.capacity) {
      alert(`${station.name} is at full capacity (${station.capacity})`);
      return;
    }

    // Check skill requirements
    const hasRequiredSkills = station.requiredSkills.some(skill => 
      staffMember.skills.includes(skill)
    );
    
    if (!hasRequiredSkills) {
      const proceed = confirm(
        `${staffMember.name} doesn't have the required skills for ${station.name}.\n` +
        `Required: ${station.requiredSkills.join(', ')}\n` +
        `Staff has: ${staffMember.skills.join(', ')}\n\n` +
        `Assign anyway?`
      );
      if (!proceed) return;
    }

    // Create assignment
    const newAssignment: StationAssignment = {
      id: `temp-${Date.now()}`,
      stationId: station.id,
      staffId: staffMember.id,
      staffName: staffMember.name,
      startTime: '08:00',
      endTime: '16:00',
      shiftType: 'Day',
      skills: staffMember.skills,
      certifications: staffMember.certifications
    };

    // Add to local state for immediate feedback
    setAssignments(prev => [...prev, newAssignment]);

    // Update station
    setStations(prev => prev.map(s => 
      s.id === station.id 
        ? { ...s, currentStaff: [...s.currentStaff, newAssignment] }
        : s
    ));

    // Update staff availability  
    setStaff(prev => prev.map(s => 
      s.id === staffMember.id 
        ? { ...s, currentStation: station.id }
        : s
    ));

    // Save to backend
    setIsSaving(true);
    const savedId = await saveAssignmentToBackend(newAssignment, station.id);
    setIsSaving(false);
    
    if (savedId) {
      // Update the assignment with the backend ID
      setAssignments(prev => prev.map(a => 
        a.id === newAssignment.id ? { ...a, id: savedId } : a
      ));
      setStations(prev => prev.map(s => 
        s.id === station.id 
          ? { ...s, currentStaff: s.currentStaff.map(a => 
              a.id === newAssignment.id ? { ...a, id: savedId } : a
            )}
          : s
      ));
    } else {
      // Rollback on failure
      setAssignments(prev => prev.filter(a => a.id !== newAssignment.id));
      setStations(prev => prev.map(s => 
        s.id === station.id 
          ? { ...s, currentStaff: s.currentStaff.filter(a => a.id !== newAssignment.id) }
          : s
      ));
      setStaff(prev => prev.map(s => 
        s.id === staffMember.id 
          ? { ...s, currentStation: undefined }
          : s
      ));
      alert('Failed to save assignment. Please try again.');
      return;
    }

    // Auto-select the station for easy editing
    setSelectedStation(station);
  };

  // Handle station click
  const handleStationClick = (station: ProductionStation) => {
    setSelectedStation(station);
  };

  // Remove assignment
  const removeAssignment = async (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    // Remove from local state first
    setAssignments(prev => prev.filter(a => a.id !== assignmentId));
    
    setStations(prev => prev.map(s => 
      s.id === assignment.stationId
        ? { ...s, currentStaff: s.currentStaff.filter(a => a.id !== assignmentId) }
        : s
    ));

    setStaff(prev => prev.map(s => 
      s.id === assignment.staffId
        ? { ...s, currentStation: undefined }
        : s
    ));

    // Only call API if it's a real backend ID (not a temp ID)
    if (!assignmentId.startsWith('temp-')) {
      const deleted = await deleteAssignmentFromBackend(assignmentId);
      if (!deleted) {
        // Rollback on failure - re-add the assignment
        setAssignments(prev => [...prev, assignment]);
        setStations(prev => prev.map(s => 
          s.id === assignment.stationId
            ? { ...s, currentStaff: [...s.currentStaff, assignment] }
            : s
        ));
        setStaff(prev => prev.map(s => 
          s.id === assignment.staffId
            ? { ...s, currentStation: assignment.stationId }
            : s
        ));
        alert('Failed to remove assignment. Please try again.');
      }
    }
  };

  return (
    <div className="station-assignment-container">
      {/* Header */}
      <div className="assignment-header">
        <div className="header-row-top">
          <div className="header-left">
            <button
              onClick={() => router.push('/dashboard')}
              className="back-button"
              title="Back to Dashboard"
            >
              ← Back
            </button>
            <img src="/logo-relish.png" alt="Relish ClamFlow" className="logo" />
            <h1>Interactive Station Assignment</h1>
            {isSaving && <span className="saving-indicator">💾 Saving...</span>}
          </div>
          <div className="traceability-badges">
            <span className="badge traceability">✓ Traceability</span>
            <span className="badge persistence">💾 Data Persistence</span>
            <span className="badge ease">👆 Ease of Use</span>
          </div>
        </div>
        <div className="header-controls">
          <div className="date-selector">
            <label>Date: </label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="plant-selector">
            <button 
              className={selectedPlant === 'PPC' ? 'active' : ''}
              onClick={() => setSelectedPlant('PPC')}
            >
              🏭 PPC Plant
            </button>
            <button 
              className={selectedPlant === 'FP' ? 'active' : ''}
              onClick={() => setSelectedPlant('FP')}
            >
              📦 FP Plant
            </button>
          </div>
          <button 
            onClick={() => setViewMode(viewMode === 'overview' ? 'detailed' : 'overview')}
            className="view-toggle"
          >
            {viewMode === 'overview' ? '🔍 Detailed View' : '👁️ Overview'}
          </button>
          <button 
            onClick={() => setShowStaffPanel(!showStaffPanel)}
            className="panel-toggle"
          >
            {showStaffPanel ? '◀ Hide Staff' : '▶ Show Staff'}
          </button>
        </div>
      </div>

      <DndContext onDragEnd={handleDragEnd}>
      <div className="assignment-body">
        {/* Staff Panel */}
        <AnimatePresence>
          {showStaffPanel && (
            <motion.div
              className="staff-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '300px', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="panel-header">
                <h3>👥 Available Staff</h3>
                <div className="staff-stats">
                  Available: {staff.filter(s => s.isAvailable && !isStaffAssigned(s.id)).length} | 
                  Assigned: {staff.filter(s => isStaffAssigned(s.id)).length}
                </div>
              </div>
              
              <div className="staff-categories">
                {isLoadingStaff ? (
                  <div className="loading-state">
                    <p>⏳ Loading staff...</p>
                  </div>
                ) : staffError ? (
                  <div className="error-state">
                    <p>⚠️ {staffError}</p>
                  </div>
                ) : staff.length === 0 ? (
                  <div className="empty-state">
                    <p>No staff members available</p>
                  </div>
                ) : (
                  STAFF_PANEL_GROUPS.map(group => {
                    const groupStaff = staff.filter(s => 
                      group.roles.includes(s.role) && 
                      (s.department === selectedPlant || s.department === 'Both')
                    );
                    if (groupStaff.length === 0) return null;
                    return (
                      <div key={group.label} className="staff-category">
                        <h4>{group.label}</h4>
                        {groupStaff.map(s => (
                          <DraggableStaff 
                            key={s.id} 
                            staff={s} 
                            isAssigned={isStaffAssigned(s.id)}
                          />
                        ))}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Plant Layout */}
          <div className="plant-layout" ref={containerRef}>
            <div className="layout-header">
              <h2>
                {selectedPlant === 'PPC' ? '🏭 PPC Plant Layout' : '📦 FP Plant Layout'}
              </h2>
              <div className="layout-info">
                <span>Stations: {currentStations.length}</span>
                <span>Operational: {currentStations.filter(s => s.status === 'operational').length}</span>
                <span>Staff Assigned: {currentStations.reduce((acc, s) => acc + s.currentStaff.length, 0)}</span>
              </div>
            </div>

            <div className="plant-canvas structured-layout">
              {selectedPlant === 'PPC' ? (
                <>
                  {/* Row 1: RM Receiving + Depuration Tanks */}
                  <div className="layout-row layout-row-top">
                    <div className="layout-section rm-section">
                      <div className="section-label">RAW MATERIAL RECEIVING</div>
                      {currentStations.filter(s => s.category === 'receiving').map(station => (
                        <StationDropZone
                          key={station.id}
                          station={station}
                          onStationClick={handleStationClick}
                          isSelected={selectedStation?.id === station.id}
                        />
                      ))}
                    </div>
                    <div className="layout-section depuration-section">
                      <div className="section-label">DEPURATION TANKS</div>
                      {currentStations.filter(s => s.category === 'depuration').map(station => (
                        <StationDropZone
                          key={station.id}
                          station={station}
                          onStationClick={handleStationClick}
                          isSelected={selectedStation?.id === station.id}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Row 2: Processing Line (visual equipment) */}
                  <div className="layout-row layout-row-processing">
                    <div className="processing-line">
                      <div className="section-label">PROCESSING LINE</div>
                      <div className="equipment-flow">
                        <div className="equipment-item">Feeder Hopper</div>
                        <div className="flow-arrow">→</div>
                        <div className="equipment-item">High Power Water Jet</div>
                        <div className="flow-arrow">→</div>
                        <div className="equipment-item">Shell Separation</div>
                        <div className="flow-arrow">→</div>
                        <div className="equipment-item">Grading Machine</div>
                        <div className="flow-arrow">→</div>
                        <div className="equipment-item">Steam Cooker</div>
                        <div className="flow-arrow">→</div>
                        <div className="equipment-item">Vibrating Sieve</div>
                        <div className="flow-arrow">→</div>
                        <div className="equipment-item">Candling Table</div>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: PPC Station + Machine Room */}
                  <div className="layout-row layout-row-ppc">
                    {currentStations.filter(s => s.category === 'processing').map(station => (
                      <StationDropZone
                        key={station.id}
                        station={station}
                        onStationClick={handleStationClick}
                        isSelected={selectedStation?.id === station.id}
                      />
                    ))}
                    <div className="non-staffable-label">
                      🔧 Machine Room / Boiler Room
                    </div>
                  </div>

                  {/* Row 4: Product Store */}
                  <div className="layout-row layout-row-store">
                    {currentStations.filter(s => s.category === 'product-store').map(station => (
                      <StationDropZone
                        key={station.id}
                        station={station}
                        onStationClick={handleStationClick}
                        isSelected={selectedStation?.id === station.id}
                      />
                    ))}
                  </div>

                  {/* Row 5: Main Gate */}
                  <div className="layout-row layout-row-gate">
                    {currentStations.filter(s => s.category === 'sentry').map(station => (
                      <StationDropZone
                        key={station.id}
                        station={station}
                        onStationClick={handleStationClick}
                        isSelected={selectedStation?.id === station.id}
                      />
                    ))}
                  </div>
                </>
              ) : (
                /* FP Plant - simple grid layout */
                <div className="fp-layout">
                  {currentStations.map(station => (
                    <StationDropZone
                      key={station.id}
                      station={station}
                      onStationClick={handleStationClick}
                      isSelected={selectedStation?.id === station.id}
                    />
                  ))}
                </div>
              )}

              {/* Legend */}
              <div className="plant-legend">
                <h4>Legend</h4>
                <div className="legend-items">
                  <div className="legend-item">
                    <div className="legend-color operational"></div>
                    <span>Operational</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color maintenance"></div>
                    <span>Maintenance</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color offline"></div>
                    <span>Offline</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DragOverlay>
            {/* Drag overlay styling */}
          </DragOverlay>

        {/* Station Details Panel */}
        <AnimatePresence>
          {selectedStation && (
            <motion.div
              className="station-details-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '350px', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="panel-header">
                <h3>{selectedStation.name}</h3>
                <button onClick={() => setSelectedStation(null)}>✕</button>
              </div>

              <div className="station-info-detailed">
                <div className="info-section">
                  <h4>📊 Station Status</h4>
                  <div className="status-grid">
                    <div className="status-item">
                      <span>Status:</span>
                      <span className={`status-badge ${selectedStation.status}`}>
                        {selectedStation.status}
                      </span>
                    </div>
                    <div className="status-item">
                      <span>Capacity:</span>
                      <span>{selectedStation.currentStaff.length}/{selectedStation.capacity}</span>
                    </div>
                    <div className="status-item">
                      <span>Type:</span>
                      <span>{selectedStation.type} Plant</span>
                    </div>
                  </div>
                </div>

                {selectedStation.formType && (
                  <div className="info-section">
                    <h4>📋 Associated Form</h4>
                    <div className="form-info">
                      <span className="form-badge">{selectedStation.formType}</span>
                      <p>This station requires completion of {selectedStation.formType}</p>
                    </div>
                  </div>
                )}

                <div className="info-section">
                  <h4>🛠️ Required Skills</h4>
                  <div className="skills-list">
                    {selectedStation.requiredSkills.map(skill => (
                      <span key={skill} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>

                <div className="info-section">
                  <h4>👥 Current Assignments</h4>
                  {selectedStation.currentStaff.length === 0 ? (
                    <p className="no-assignments">No staff currently assigned</p>
                  ) : (
                    <div className="assignments-list">
                      {selectedStation.currentStaff.map(assignment => (
                        <div key={assignment.id} className="assignment-card">
                          <div className="assignment-info">
                            <div className="assignment-name">{assignment.staffName}</div>
                            <div className="assignment-details">
                              {assignment.startTime} - {assignment.endTime} | {assignment.shiftType}
                            </div>
                            <div className="assignment-skills">
                              {assignment.skills.slice(0, 3).map(skill => (
                                <span key={skill} className="assignment-skill">{skill}</span>
                              ))}
                            </div>
                          </div>
                          <button 
                            onClick={() => removeAssignment(assignment.id)}
                            className="remove-assignment"
                            title="Remove Assignment"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedStation.equipmentIds && (
                  <div className="info-section">
                    <h4>⚙️ Equipment</h4>
                    <div className="equipment-list">
                      {selectedStation.equipmentIds.map(eq => (
                        <span key={eq} className="equipment-tag">{eq}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </DndContext>

      <style jsx>{`
        .station-assignment-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: 'Inter', sans-serif;
          overflow: hidden;
        }

        .assignment-header {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .header-row-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 0;
        }

        .logo {
          height: 36px;
          width: auto;
          flex-shrink: 0;
        }

        .back-button {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 0.4rem 0.75rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .back-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        .header-left h1 {
          color: white;
          font-size: 1.3rem;
          font-weight: 600;
          margin: 0;
          white-space: nowrap;
        }

        .saving-indicator {
          color: white;
          font-size: 0.85rem;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .traceability-badges {
          display: flex;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .badge {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .badge.traceability {
          background: #28a745;
          color: #ffffff;
          border: 1px solid #28a745;
        }

        .badge.persistence {
          background: #007bff;
          color: #ffffff;
          border: 1px solid #007bff;
        }

        .badge.ease {
          background: #e6a800;
          color: #ffffff;
          border: 1px solid #e6a800;
        }

        .header-controls {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .date-selector {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .date-selector label {
          color: #ffffff;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .date-selector input {
          padding: 0.4rem 0.5rem;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.9);
          color: #333;
          font-size: 0.85rem;
        }

        .plant-selector {
          display: flex;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .plant-selector button {
          padding: 0.5rem 1rem;
          border: none;
          background: transparent;
          color: #ffffff;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .plant-selector button.active {
          background: #ffffff;
          color: #4a3d9f;
          font-weight: 700;
        }

        .view-toggle, .panel-toggle {
          background: rgba(255, 255, 255, 0.9);
          color: #4a3d9f;
          border: 1px solid rgba(255, 255, 255, 0.5);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .view-toggle:hover, .panel-toggle:hover {
          background: #ffffff;
          transform: translateY(-2px);
        }

        .assignment-body {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .staff-panel {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-right: 1px solid rgba(0, 0, 0, 0.1);
          overflow-y: auto;
        }

        .panel-header {
          padding: 1rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(102, 126, 234, 0.1);
        }

        .panel-header h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .staff-stats {
          font-size: 0.8rem;
          color: #666;
        }

        .staff-categories {
          padding: 1rem;
        }

        .staff-category {
          margin-bottom: 1.5rem;
        }

        .staff-category h4 {
          margin: 0 0 0.75rem 0;
          font-size: 0.9rem;
          font-weight: 600;
          color: #667eea;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .staff-card {
          display: flex;
          align-items: center;
          padding: 0.75rem;
          margin-bottom: 0.75rem;
          background: white;
          border-radius: 12px;
          cursor: grab;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 2px solid transparent;
        }

        .staff-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          border-color: #667eea;
        }

        .staff-card:active {
          cursor: grabbing;
        }

        .staff-card.unavailable {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .staff-card.assigned {
          background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%);
          border-color: #28a745;
        }

        .staff-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          overflow: hidden;
          margin-right: 0.75rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .staff-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .staff-info {
          flex: 1;
        }

        .staff-name {
          font-weight: 600;
          margin-bottom: 0.25rem;
          color: #333;
        }

        .staff-role {
          font-size: 0.85rem;
          color: #666;
          margin-bottom: 0.5rem;
        }

        .staff-skills {
          display: flex;
          gap: 0.25rem;
          flex-wrap: wrap;
          margin-bottom: 0.25rem;
        }

        .skill-badge {
          padding: 0.15rem 0.4rem;
          background: #e3f2fd;
          color: #1976d2;
          border-radius: 8px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .skill-more {
          padding: 0.15rem 0.4rem;
          background: #f5f5f5;
          color: #666;
          border-radius: 8px;
          font-size: 0.7rem;
        }

        .staff-certs {
          display: flex;
          gap: 0.25rem;
          flex-wrap: wrap;
        }

        .cert-badge {
          padding: 0.1rem 0.3rem;
          background: #fff3e0;
          color: #f57c00;
          border-radius: 6px;
          font-size: 0.65rem;
          font-weight: 500;
        }

        .status-indicator {
          font-size: 1.2rem;
          width: 24px;
          text-align: center;
        }

        .plant-layout {
          flex: 1;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          overflow: auto;
          position: relative;
        }

        .layout-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(102, 126, 234, 0.05);
        }

        .layout-header h2 {
          margin: 0;
          color: #333;
          font-size: 1.3rem;
        }

        .layout-info {
          display: flex;
          gap: 1rem;
          font-size: 0.9rem;
          color: #666;
        }

        .layout-info span {
          padding: 0.25rem 0.5rem;
          background: white;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .plant-canvas {
          position: relative;
          height: calc(100% - 80px);
          min-height: 600px;
          padding: 1.5rem;
          overflow-y: auto;
        }

        /* ===== Structured PPC Plant Layout ===== */
        .structured-layout {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .layout-row {
          display: flex;
          gap: 1rem;
        }

        .layout-section {
          border: 1px dashed rgba(0,0,0,0.15);
          border-radius: 10px;
          padding: 0.75rem;
          background: rgba(255,255,255,0.5);
        }

        .section-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 0.5rem;
          padding-bottom: 0.25rem;
          border-bottom: 1px solid rgba(0,0,0,0.1);
        }

        .rm-section {
          flex: 1;
          min-width: 200px;
        }

        .depuration-section {
          flex: 1;
        }

        .layout-row-processing {
          flex-direction: column;
        }

        .processing-line {
          border: 1px dashed rgba(0,0,0,0.15);
          border-radius: 10px;
          padding: 0.75rem;
          background: rgba(245,245,250,0.6);
        }

        .equipment-flow {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.25rem;
        }

        .equipment-item {
          padding: 0.35rem 0.6rem;
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 500;
          color: #555;
          white-space: nowrap;
        }

        .flow-arrow {
          color: #667eea;
          font-weight: bold;
          font-size: 0.9rem;
        }

        .layout-row-ppc {
          display: flex;
          gap: 1rem;
        }

        .layout-row-ppc .station-zone {
          flex: 1;
        }

        .non-staffable-label {
          display: inline-flex;
          align-items: center;
          align-self: flex-start;
          gap: 0.35rem;
          padding: 0.4rem 0.75rem;
          background: #f0f0f0;
          border: 1px dashed #ccc;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 500;
          color: #999;
          white-space: nowrap;
        }

        .layout-row-store, .layout-row-gate {
          max-width: 50%;
        }

        .fp-layout {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1rem;
        }

        /* ===== Station Drop Zone (no longer absolute) ===== */
        .station-zone {
          border: 2px solid rgba(0,0,0,0.12);
          border-radius: 12px;
          padding: 0.75rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          min-width: 0;
        }

        .station-zone.compact {
          padding: 0.5rem;
        }

        .station-zone:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        }

        .station-zone.drop-hover {
          border-color: #4CAF50 !important;
          box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.25);
          background: #E8F5E9 !important;
        }

        .station-zone.selected {
          border-color: #667eea !important;
          border-width: 3px;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
        }

        .station-header {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 0.4rem;
        }

        .station-icon {
          font-size: 1.2rem;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          flex-shrink: 0;
        }

        .compact .station-icon {
          width: 22px;
          height: 22px;
          font-size: 0.9rem;
        }

        .station-name {
          flex: 1;
          font-weight: 600;
          font-size: 0.82rem;
          color: #333;
          line-height: 1.2;
        }

        .compact .station-name {
          font-size: 0.75rem;
        }

        .station-status {
          display: flex;
          align-items: center;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .station-status.operational .status-dot {
          background: #28a745;
        }

        .station-status.maintenance .status-dot {
          background: #ffc107;
        }

        .station-status.offline .status-dot {
          background: #dc3545;
        }

        .station-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.4rem;
        }

        .capacity-info {
          font-size: 0.75rem;
          font-weight: 600;
          color: #667eea;
        }

        .form-indicator {
          padding: 0.15rem 0.35rem;
          background: #e8f5e8;
          color: #28a745;
          border-radius: 6px;
          font-size: 0.65rem;
          font-weight: 500;
        }

        /* Assigned Staff with Photos */
        .assigned-staff-photos {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .empty-slot {
          padding: 0.5rem;
          background: rgba(102,126,234,0.06);
          border: 1px dashed rgba(102,126,234,0.3);
          border-radius: 6px;
          text-align: center;
          font-size: 0.72rem;
          color: #999;
        }

        .compact .empty-slot {
          padding: 0.3rem;
          font-size: 0.65rem;
        }

        .staff-photo-card {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.3rem 0.4rem;
          background: rgba(255,255,255,0.95);
          border-radius: 8px;
          border-left: 3px solid #667eea;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        .staff-photo {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
          border: 1.5px solid #667eea;
        }

        .compact .staff-photo {
          width: 22px;
          height: 22px;
        }

        .staff-photo-info {
          min-width: 0;
        }

        .staff-photo-name {
          font-weight: 600;
          font-size: 0.72rem;
          color: #333;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .compact .staff-photo-name {
          font-size: 0.65rem;
        }

        .staff-photo-time {
          font-size: 0.62rem;
          color: #888;
        }

        .plant-legend {
          position: sticky;
          bottom: 0;
          margin-top: 1rem;
          align-self: flex-end;
          background: rgba(255, 255, 255, 0.95);
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .plant-legend h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
        }

        .legend-items {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .legend-color.operational {
          background: #E3F2FD;
          border: 2px solid #1976d2;
        }

        .legend-color.maintenance {
          background: #FFF3E0;
          border: 2px solid #f57c00;
        }

        .legend-color.offline {
          background: #FFEBEE;
          border: 2px solid #d32f2f;
        }

        .station-details-panel {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-left: 1px solid rgba(0, 0, 0, 0.1);
          overflow-y: auto;
        }

        .station-details-panel .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(102, 126, 234, 0.1);
        }

        .station-details-panel .panel-header h3 {
          margin: 0;
          color: #333;
        }

        .station-details-panel .panel-header button {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: background 0.2s ease;
        }

        .station-details-panel .panel-header button:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .station-info-detailed {
          padding: 1rem;
        }

        .info-section {
          margin-bottom: 1.5rem;
        }

        .info-section h4 {
          margin: 0 0 0.75rem 0;
          font-size: 0.9rem;
          font-weight: 600;
          color: #667eea;
        }

        .status-grid {
          display: grid;
          gap: 0.5rem;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: #f8f9fa;
          border-radius: 6px;
        }

        .status-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .status-badge.operational {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.maintenance {
          background: #fff3cd;
          color: #856404;
        }

        .status-badge.offline {
          background: #f8d7da;
          color: #721c24;
        }

        .form-info {
          background: #f8f9fa;
          padding: 0.75rem;
          border-radius: 6px;
        }

        .form-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          background: #e8f5e8;
          color: #28a745;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .form-info p {
          margin: 0;
          font-size: 0.85rem;
          color: #666;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .skill-tag {
          padding: 0.3rem 0.6rem;
          background: #e3f2fd;
          color: #1976d2;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .no-assignments {
          color: #666;
          font-style: italic;
          margin: 0;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 6px;
          text-align: center;
        }

        .assignments-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .assignment-card {
          display: flex;
          align-items: center;
          padding: 0.75rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border-left: 4px solid #667eea;
        }

        .assignment-info {
          flex: 1;
        }

        .assignment-name {
          font-weight: 600;
          margin-bottom: 0.25rem;
          color: #333;
        }

        .assignment-details {
          font-size: 0.8rem;
          color: #666;
          margin-bottom: 0.5rem;
        }

        .assignment-skills {
          display: flex;
          gap: 0.25rem;
          flex-wrap: wrap;
        }

        .assignment-skill {
          padding: 0.15rem 0.3rem;
          background: #e3f2fd;
          color: #1976d2;
          border-radius: 4px;
          font-size: 0.7rem;
        }

        .remove-assignment {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 4px;
          transition: background 0.2s ease;
          font-size: 1rem;
        }

        .remove-assignment:hover {
          background: #ffebee;
        }

        .equipment-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .equipment-tag {
          padding: 0.3rem 0.6rem;
          background: #fff3e0;
          color: #f57c00;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        @media (max-width: 1024px) {
          .assignment-header {
            padding: 0.5rem 1rem;
          }

          .header-row-top {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-left h1 {
            font-size: 1.1rem;
          }

          .header-controls {
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .assignment-body {
            flex-direction: column;
          }

          .staff-panel {
            width: 100% !important;
            max-height: 300px;
          }

          .station-details-panel {
            width: 100% !important;
            max-height: 400px;
          }

          .plant-canvas {
            padding: 0.75rem;
          }

          .layout-row {
            flex-direction: column;
          }

          .layout-row-top {
            flex-direction: column;
          }

          .tank-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .equipment-flow {
            flex-wrap: wrap;
          }

          .layout-row-store, .layout-row-gate {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default InteractiveStationAssignment;