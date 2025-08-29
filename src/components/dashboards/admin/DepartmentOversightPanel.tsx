"use client";

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Target,
  Activity,
  Settings,
  Calendar,
  MapPin,
  Award,
  Zap
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
  description: string;
  location: string;
  manager: {
    name: string;
    role: string;
  };
  staff_count: number;
  active_staff: number;
  leads: number;
  status: 'operational' | 'maintenance' | 'reduced_capacity';
  performance_metrics: {
    efficiency: number;
    quality_score: number;
    safety_rating: number;
    productivity: number;
  };
  current_shift: {
    shift_name: string;
    staff_present: number;
    staff_scheduled: number;
  };
  recent_issues: number;
  equipment_status: 'good' | 'needs_attention' | 'critical';
}

interface DepartmentOversightPanelProps {
  onClose?: () => void;
}

const DepartmentOversightPanel: React.FC<DepartmentOversightPanelProps> = ({ onClose }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  useEffect(() => {
    // Simulate API call with demo data
    setTimeout(() => {
      const demoDepartments: Department[] = [
        {
          id: '1',
          name: 'Processing',
          description: 'Primary clam processing and preparation',
          location: 'Building A - Floor 1',
          manager: { name: 'Michael Johnson', role: 'Production Lead' },
          staff_count: 28,
          active_staff: 26,
          leads: 3,
          status: 'operational',
          performance_metrics: {
            efficiency: 94,
            quality_score: 91,
            safety_rating: 98,
            productivity: 89
          },
          current_shift: {
            shift_name: 'Morning Shift',
            staff_present: 26,
            staff_scheduled: 28
          },
          recent_issues: 2,
          equipment_status: 'good'
        },
        {
          id: '2',
          name: 'Quality Control',
          description: 'Quality testing and assurance',
          location: 'Building A - Floor 2',
          manager: { name: 'Sarah Williams', role: 'QC Lead' },
          staff_count: 12,
          active_staff: 12,
          leads: 2,
          status: 'operational',
          performance_metrics: {
            efficiency: 97,
            quality_score: 99,
            safety_rating: 100,
            productivity: 95
          },
          current_shift: {
            shift_name: 'Day Shift',
            staff_present: 12,
            staff_scheduled: 12
          },
          recent_issues: 0,
          equipment_status: 'good'
        },
        {
          id: '3',
          name: 'Packaging',
          description: 'Final product packaging and labeling',
          location: 'Building B - Floor 1',
          manager: { name: 'David Brown', role: 'Staff Lead' },
          staff_count: 20,
          active_staff: 18,
          leads: 2,
          status: 'reduced_capacity',
          performance_metrics: {
            efficiency: 82,
            quality_score: 87,
            safety_rating: 95,
            productivity: 78
          },
          current_shift: {
            shift_name: 'Afternoon Shift',
            staff_present: 18,
            staff_scheduled: 20
          },
          recent_issues: 3,
          equipment_status: 'needs_attention'
        },
        {
          id: '4',
          name: 'Shipping',
          description: 'Distribution and logistics coordination',
          location: 'Building C - Dock Area',
          manager: { name: 'Lisa Rodriguez', role: 'Logistics Lead' },
          staff_count: 15,
          active_staff: 15,
          leads: 2,
          status: 'operational',
          performance_metrics: {
            efficiency: 91,
            quality_score: 93,
            safety_rating: 97,
            productivity: 88
          },
          current_shift: {
            shift_name: 'Day Shift',
            staff_present: 15,
            staff_scheduled: 15
          },
          recent_issues: 1,
          equipment_status: 'good'
        }
      ];
      setDepartments(demoDepartments);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'reduced_capacity': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEquipmentStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'needs_attention': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Department Oversight</h2>
        <p className="text-sm text-gray-600">Monitor department performance and operations</p>
      </div>

      {/* Department Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {departments.map((dept) => (
          <div key={dept.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{dept.name}</h3>
                  <p className="text-sm text-gray-600">{dept.description}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(dept.status)}`}>
                {dept.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{dept.performance_metrics.efficiency}%</p>
                <p className="text-xs text-gray-600">Efficiency</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{dept.performance_metrics.quality_score}%</p>
                <p className="text-xs text-gray-600">Quality</p>
              </div>
            </div>

            {/* Staff Information */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Staff Present:</span>
                <span className="font-medium">{dept.current_shift.staff_present}/{dept.current_shift.staff_scheduled}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Manager:</span>
                <span className="font-medium">{dept.manager.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium">{dept.location}</span>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Settings className={`w-4 h-4 ${getEquipmentStatusColor(dept.equipment_status)}`} />
                  <span className="text-xs text-gray-600">Equipment</span>
                </div>
                {dept.recent_issues > 0 && (
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span className="text-xs text-orange-600">{dept.recent_issues} Issues</span>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setSelectedDepartment(dept)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View Details →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Department Details Modal */}
      {selectedDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-xl font-semibold">{selectedDepartment.name} Department</h3>
                <p className="text-sm text-gray-600">{selectedDepartment.description}</p>
              </div>
              <button
                onClick={() => setSelectedDepartment(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <span className="sr-only">Close</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">Performance Metrics</h4>
                    <div className="space-y-3">
                      {Object.entries(selectedDepartment.performance_metrics).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${value}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{value}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Staff Overview</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Staff:</span>
                        <span className="text-sm font-medium">{selectedDepartment.staff_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Active Today:</span>
                        <span className="text-sm font-medium">{selectedDepartment.active_staff}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Team Leads:</span>
                        <span className="text-sm font-medium">{selectedDepartment.leads}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">Current Status</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Department Status</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedDepartment.status)}`}>
                            {selectedDepartment.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Equipment Status</span>
                          <span className={`text-sm font-medium ${getEquipmentStatusColor(selectedDepartment.equipment_status)}`}>
                            {selectedDepartment.equipment_status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Current Shift</h4>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="font-medium text-blue-900">{selectedDepartment.current_shift.shift_name}</p>
                      <p className="text-sm text-blue-700">
                        {selectedDepartment.current_shift.staff_present}/{selectedDepartment.current_shift.staff_scheduled} staff present
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentOversightPanel;