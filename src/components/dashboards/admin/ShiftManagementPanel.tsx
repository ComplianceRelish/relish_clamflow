"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Users,
  UserCheck,
  AlertCircle,
  Plus,
  ExternalLink
} from 'lucide-react';

interface ShiftManagementPanelProps {
  onClose?: () => void;
}

const ShiftManagementPanel: React.FC<ShiftManagementPanelProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Shift Management</h2>
          <p className="text-sm text-gray-600">Schedule leads and manage shift coverage</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link 
            href="/shift-scheduling"
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            <span>Interactive Calendar</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-5 h-5" />
            <span>Create Schedule</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { shift: 'Morning (6AM-2PM)', leads: 4, coverage: '100%', status: 'good' },
          { shift: 'Afternoon (2PM-10PM)', leads: 3, coverage: '75%', status: 'warning' },
          { shift: 'Night (10PM-6AM)', leads: 2, coverage: '100%', status: 'good' }
        ].map((shift, index) => (
          <div key={index} className="bg-white border rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">{shift.shift}</h3>
                <p className="text-sm text-gray-600">{shift.leads} leads assigned</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Coverage:</span>
                <span className="text-sm font-medium">{shift.coverage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`text-sm font-medium ${
                  shift.status === 'good' ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {shift.status === 'good' ? 'Fully Staffed' : 'Needs Coverage'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Weekly Schedule</h3>
          <Link 
            href="/shift-scheduling"
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
          >
            <span>Open Full Calendar</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4" />
          <p className="mb-4">Access the Interactive Shift Scheduling Calendar for comprehensive scheduling management</p>
          <Link 
            href="/shift-scheduling"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            <span>Launch Interactive Calendar</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ShiftManagementPanel;