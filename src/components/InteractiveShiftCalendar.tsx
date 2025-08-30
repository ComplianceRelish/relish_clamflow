// src/components/InteractiveShiftCalendar.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

// Types
interface StaffMember {
  id: string;
  name: string;
  role: 'Production' | 'QC' | 'Supervisor' | 'Maintenance';
  department: 'PPC' | 'FP' | 'Both';
  avatar?: string;
  isAvailable: boolean;
  skills: string[];
}

interface ShiftBlock {
  id: string;
  staffId: string;
  staffName: string;
  date: Date;
  startTime: string;
  endTime: string;
  shiftType: 'Day' | 'Swing' | 'Night' | 'Overtime';
  station?: string;
  department: 'PPC' | 'FP';
}

interface ShiftCalendarProps {
  currentUser?: {
    role: string;
    department: string;
  } | null;
  onShiftUpdate?: (shift: ShiftBlock) => void;
  onConflictDetected?: (conflicts: ShiftBlock[]) => void;
}

const SHIFT_COLORS = {
  Day: '#C3E6CB',
  Swing: '#FFECB5', 
  Night: '#D6D8DB',
  Overtime: '#F8D7DA'
};

const STAFF_DATA: StaffMember[] = [
  { id: '1', name: 'John Smith', role: 'Production', department: 'PPC', isAvailable: true, skills: ['T1-T4', 'Hatchery'] },
  { id: '2', name: 'Maria Garcia', role: 'QC', department: 'FP', isAvailable: true, skills: ['RFID', 'Packing'] },
  { id: '3', name: 'David Chen', role: 'Supervisor', department: 'Both', isAvailable: true, skills: ['All Stations'] },
  { id: '4', name: 'Sarah Johnson', role: 'Production', department: 'PPC', isAvailable: false, skills: ['T5-T8', 'Processing'] },
  { id: '5', name: 'Mike Rodriguez', role: 'Maintenance', department: 'Both', isAvailable: true, skills: ['Equipment', 'Repair'] },
];

// Draggable Staff Item Component
const DraggableStaff: React.FC<{ staff: StaffMember }> = ({ staff }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: staff.id,
    data: { staff }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`staff-item ${!staff.isAvailable ? 'unavailable' : ''}`}
    >
      <div className="staff-avatar">
        {staff.name.charAt(0)}
      </div>
      <div className="staff-info">
        <div className="staff-name">{staff.name}</div>
        <div className="staff-role">{staff.role} - {staff.department}</div>
        <div className="staff-skills">{staff.skills.join(', ')}</div>
      </div>
      <div className={`availability-dot ${staff.isAvailable ? 'available' : 'unavailable'}`} />
    </div>
  );
};

// Droppable Time Slot Component
const TimeSlot: React.FC<{
  date: Date;
  time: string;
  staffId: string;
  shift?: ShiftBlock;
  onShiftClick?: (shift: ShiftBlock) => void;
}> = ({ date, time, staffId, shift, onShiftClick }) => {
  const slotId = `${format(date, 'yyyy-MM-dd')}-${time}-${staffId}`;
  
  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
    data: { date, time, staffId }
  });

  return (
    <div
      ref={setNodeRef}
      className={`time-slot ${isOver ? 'drop-hover' : ''}`}
      onClick={() => shift && onShiftClick?.(shift)}
    >
      {shift && (
        <div 
          className="shift-block" 
          style={{ backgroundColor: SHIFT_COLORS[shift.shiftType] }}
        >
          <div className="shift-staff">{shift.staffName}</div>
          <div className="shift-type">{shift.shiftType}</div>
          <div className="shift-time">{shift.startTime}-{shift.endTime}</div>
        </div>
      )}
    </div>
  );
};

// Main Calendar Component
export const InteractiveShiftCalendar: React.FC<ShiftCalendarProps> = ({
  currentUser,
  onShiftUpdate,
  onConflictDetected
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);
  const [isStaffListExpanded, setIsStaffListExpanded] = useState(true);
  const [shifts, setShifts] = useState<ShiftBlock[]>([]);
  const [selectedShift, setSelectedShift] = useState<ShiftBlock | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Generate week dates
  const weekStart = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Time slots for the day
  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
  ];

  // Conflict detection
  const detectConflicts = useCallback((newShift: ShiftBlock): ShiftBlock[] => {
    return shifts.filter(existing => 
      existing.staffId === newShift.staffId &&
      isSameDay(existing.date, newShift.date) &&
      existing.id !== newShift.id &&
      (
        (newShift.startTime >= existing.startTime && newShift.startTime < existing.endTime) ||
        (newShift.endTime > existing.startTime && newShift.endTime <= existing.endTime) ||
        (newShift.startTime <= existing.startTime && newShift.endTime >= existing.endTime)
      )
    );
  }, [shifts]);

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const staff = active.data.current?.staff as StaffMember;
    const dropData = over.data.current as { date: Date; time: string; staffId: string };
    
    if (!staff || !dropData) return;

    const newShift: ShiftBlock = {
      id: `shift-${Date.now()}`,
      staffId: staff.id,
      staffName: staff.name,
      date: dropData.date,
      startTime: dropData.time,
      endTime: `${parseInt(dropData.time.split(':')[0]) + 8}:00`, // 8-hour shift
      shiftType: 'Day', // Default
      department: staff.department === 'Both' ? 'PPC' : staff.department,
    };

    // Check conflicts
    const conflicts = detectConflicts(newShift);
    if (conflicts.length > 0) {
      onConflictDetected?.(conflicts);
      return;
    }

    setShifts(prev => [...prev, newShift]);
    onShiftUpdate?.(newShift);
  };

  // Handle shift click for editing
  const handleShiftClick = (shift: ShiftBlock) => {
    setSelectedShift(shift);
    setShowEditModal(true);
  };

  return (
    <div className="shift-calendar-container">
      {/* Header */}
      <div className="calendar-header">
        <div className="header-left">
          <img src="/logo-relish.png" alt="Relish ClamFlow" className="logo" />
          <h1>Shift Scheduling - Production & QC</h1>
        </div>
        <div className="header-controls">
          <button 
            onClick={() => setViewMode(viewMode === 'week' ? 'day' : 'week')}
            className="view-toggle"
          >
            {viewMode === 'week' ? 'Day View' : 'Week View'}
          </button>
          <div className="date-navigation">
            <button onClick={() => setCurrentDate(addDays(currentDate, -7))}>
              ← Previous Week
            </button>
            <span>{format(weekStart, 'MMM dd, yyyy')}</span>
            <button onClick={() => setCurrentDate(addDays(currentDate, 7))}>
              Next Week →
            </button>
          </div>
        </div>
      </div>

      <div className="calendar-body">
        {/* Staff Sidebar */}
        <motion.div 
          className="staff-sidebar"
          animate={{ width: isStaffListExpanded ? '300px' : '60px' }}
          transition={{ duration: 0.3 }}
        >
          <div className="sidebar-header">
            <button 
              onClick={() => setIsStaffListExpanded(!isStaffListExpanded)}
              className="collapse-btn"
            >
              {isStaffListExpanded ? '◀' : '▶'}
            </button>
            {isStaffListExpanded && <h3>Available Staff</h3>}
          </div>
          
          <AnimatePresence>
            {isStaffListExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="staff-list"
              >
                {['Production', 'QC', 'Supervisor', 'Maintenance'].map(role => (
                  <div key={role} className="staff-category">
                    <h4>{role}</h4>
                    {STAFF_DATA.filter(staff => staff.role === role).map(staff => (
                      <DraggableStaff key={staff.id} staff={staff} />
                    ))}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Calendar Grid */}
        <DndContext onDragEnd={handleDragEnd}>
          <motion.div 
            className="calendar-grid"
            animate={{ height: isCalendarExpanded ? 'auto' : '200px' }}
            transition={{ duration: 0.3 }}
          >
            <div className="calendar-controls">
              <button 
                onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
                className="expand-btn"
              >
                {isCalendarExpanded ? 'Collapse Calendar' : 'Expand Calendar'}
              </button>
            </div>

            {isCalendarExpanded && (
              <div className="timeline-grid">
                {/* Header Row */}
                <div className="grid-header">
                  <div className="staff-column-header">Staff</div>
                  {weekDays.map(day => (
                    <div key={day.toISOString()} className="day-header">
                      <div className="day-name">{format(day, 'EEE')}</div>
                      <div className="day-date">{format(day, 'MMM dd')}</div>
                    </div>
                  ))}
                </div>

                {/* Staff Rows */}
                {STAFF_DATA.map(staff => (
                  <div key={staff.id} className="staff-row">
                    <div className="staff-row-header">
                      <div className="staff-avatar">{staff.name.charAt(0)}</div>
                      <div className="staff-details">
                        <div className="staff-name">{staff.name}</div>
                        <div className="staff-role">{staff.role}</div>
                      </div>
                    </div>
                    
                    {weekDays.map(day => (
                      <div key={`${staff.id}-${day.toISOString()}`} className="day-column">
                        {timeSlots.map(time => {
                          const existingShift = shifts.find(s => 
                            s.staffId === staff.id && 
                            isSameDay(s.date, day) &&
                            s.startTime === time
                          );
                          
                          return (
                            <TimeSlot
                              key={`${staff.id}-${day.toISOString()}-${time}`}
                              date={day}
                              time={time}
                              staffId={staff.id}
                              shift={existingShift}
                              onShiftClick={handleShiftClick}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
          
          <DragOverlay>
            {/* Drag overlay content */}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Shift Edit Modal */}
      {showEditModal && selectedShift && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Edit Shift</h3>
            <div className="form-group">
              <label>Staff: {selectedShift.staffName}</label>
            </div>
            <div className="form-group">
              <label>Shift Type:</label>
              <select 
                value={selectedShift.shiftType} 
                onChange={(e) => setSelectedShift({
                  ...selectedShift, 
                  shiftType: e.target.value as ShiftBlock['shiftType']
                })}
              >
                <option value="Day">Day Shift</option>
                <option value="Swing">Swing Shift</option>
                <option value="Night">Night Shift</option>
                <option value="Overtime">Overtime</option>
              </select>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowEditModal(false)}>Cancel</button>
              <button onClick={() => {
                // Update shift logic
                setShifts(prev => prev.map(s => 
                  s.id === selectedShift.id ? selectedShift : s
                ));
                setShowEditModal(false);
                onShiftUpdate?.(selectedShift);
              }}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .shift-calendar-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: 'Inter', sans-serif;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .logo {
          height: 40px;
          width: auto;
        }

        .header-left h1 {
          color: white;
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0;
        }

        .header-controls {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .view-toggle, .date-navigation button {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .view-toggle:hover, .date-navigation button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .date-navigation {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .date-navigation span {
          color: white;
          font-weight: 500;
          min-width: 120px;
          text-align: center;
        }

        .calendar-body {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .staff-sidebar {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-right: 1px solid rgba(0, 0, 0, 0.1);
          overflow-y: auto;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        .collapse-btn {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          margin-right: 0.5rem;
        }

        .sidebar-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .staff-list {
          padding: 1rem;
        }

        .staff-category {
          margin-bottom: 1.5rem;
        }

        .staff-category h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .staff-item {
          display: flex;
          align-items: center;
          padding: 0.75rem;
          margin-bottom: 0.5rem;
          background: white;
          border-radius: 8px;
          cursor: grab;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .staff-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .staff-item:active {
          cursor: grabbing;
        }

        .staff-item.unavailable {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .staff-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(45deg, #667eea, #764ba2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          margin-right: 0.75rem;
        }

        .staff-info {
          flex: 1;
        }

        .staff-name {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .staff-role {
          font-size: 0.8rem;
          color: #666;
          margin-bottom: 0.25rem;
        }

        .staff-skills {
          font-size: 0.7rem;
          color: #999;
        }

        .availability-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-left: 0.5rem;
        }

        .availability-dot.available {
          background: #28a745;
        }

        .availability-dot.unavailable {
          background: #dc3545;
        }

        .calendar-grid {
          flex: 1;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          overflow: auto;
        }

        .calendar-controls {
          padding: 1rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        .expand-btn {
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
        }

        .timeline-grid {
          display: grid;
          grid-template-columns: 200px repeat(7, 1fr);
          min-height: 600px;
        }

        .grid-header {
          display: contents;
        }

        .staff-column-header, .day-header {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          padding: 1rem;
          font-weight: 600;
          text-align: center;
        }

        .day-header {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .staff-row {
          display: contents;
        }

        .staff-row-header {
          display: flex;
          align-items: center;
          padding: 1rem;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          gap: 0.75rem;
        }

        .staff-row-header .staff-avatar {
          width: 32px;
          height: 32px;
          font-size: 0.8rem;
          margin-right: 0;
        }

        .staff-details {
          flex: 1;
        }

        .staff-details .staff-name {
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
        }

        .staff-details .staff-role {
          font-size: 0.7rem;
          color: #666;
        }

        .day-column {
          border: 1px solid #dee2e6;
          min-height: 100px;
          position: relative;
        }

        .time-slot {
          height: 30px;
          border-bottom: 1px solid #f0f0f0;
          position: relative;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .time-slot:hover {
          background-color: #f8f9fa;
        }

        .time-slot.drop-hover {
          background-color: #e3f2fd;
          border: 2px dashed #2196f3;
        }

        .shift-block {
          position: absolute;
          top: 2px;
          left: 2px;
          right: 2px;
          height: 26px;
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 0.7rem;
          color: #333;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: center;
          line-height: 1.1;
          transition: all 0.2s ease;
        }

        .shift-block:hover {
          transform: scale(1.05);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .shift-staff {
          font-weight: 600;
        }

        .shift-type {
          font-size: 0.6rem;
          opacity: 0.8;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          min-width: 400px;
          max-width: 90vw;
        }

        .modal-content h3 {
          margin: 0 0 1rem 0;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        .form-group select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }

        .modal-actions button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }

        .modal-actions button:first-child {
          background: #6c757d;
          color: white;
        }

        .modal-actions button:last-child {
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
        }

        @media (max-width: 768px) {
          .calendar-header {
            flex-direction: column;
            gap: 1rem;
            padding: 1rem;
          }

          .header-controls {
            flex-direction: column;
            gap: 0.5rem;
          }

          .timeline-grid {
            grid-template-columns: 150px repeat(7, minmax(80px, 1fr));
          }

          .staff-sidebar {
            width: 250px;
          }
        }
      `}</style>
    </div>
  );
};

export default InteractiveShiftCalendar;