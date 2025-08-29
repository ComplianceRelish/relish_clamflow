"use client";

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  Clock,
  Target,
  Award,
  AlertTriangle
} from 'lucide-react';

interface AdminAnalyticsProps {
  onClose?: () => void;
}

const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ onClose }) => {
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
        <p className="text-sm text-gray-600">Department analytics and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Staff</p>
              <p className="text-2xl font-bold text-blue-900">127</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Efficiency</p>
              <p className="text-2xl font-bold text-green-900">94%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Quality Score</p>
              <p className="text-2xl font-bold text-purple-900">91%</p> 
            </div>
            <Target className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Active Issues</p>
              <p className="text-2xl font-bold text-orange-900">3</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Department Performance</h3>
        <div className="space-y-4">
          {[
            { name: 'Processing', efficiency: 94, quality: 91, staff: 28 },
            { name: 'Quality Control', efficiency: 97, quality: 99, staff: 12 },
            { name: 'Packaging', efficiency: 82, quality: 87, staff: 20 },
            { name: 'Shipping', efficiency: 91, quality: 93, staff: 15 }
          ].map((dept) => (
            <div key={dept.name} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex-1">
                <p className="font-medium">{dept.name}</p>
                <p className="text-sm text-gray-600">{dept.staff} staff members</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <p className="text-sm font-medium">{dept.efficiency}%</p>
                  <p className="text-xs text-gray-600">Efficiency</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">{dept.quality}%</p>
                  <p className="text-xs text-gray-600">Quality</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;