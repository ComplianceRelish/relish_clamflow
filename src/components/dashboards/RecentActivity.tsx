// src/components/dashboards/RecentActivity.tsx - NEW
'use client';

import React from 'react';

interface ActivityItem {
  id: string;
  type: 'login' | 'form_submitted' | 'approval' | 'system';
  user: string;
  description: string;
  timestamp: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login': return '🔐';
      case 'form_submitted': return '📝';
      case 'approval': return '✅';
      case 'system': return '⚙️';
      default: return '📄';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'login': return 'bg-blue-50 text-blue-700';
      case 'form_submitted': return 'bg-green-50 text-green-700';
      case 'approval': return 'bg-purple-50 text-purple-700';
      case 'system': return 'bg-gray-50 text-gray-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  // Mock data if no activities provided
  const mockActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'login',
      user: 'John Doe',
      description: 'Logged into the system',
      timestamp: new Date().toISOString()
    },
    {
      id: '2',
      type: 'form_submitted',
      user: 'Jane Smith',
      description: 'Submitted weight note WN-001',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      type: 'approval',
      user: 'QC Lead',
      description: &apos;Approved PPC form PPC-001&apos;,
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString()
    }
  ];

  const displayActivities = activities.length > 0 ? activities : mockActivities;

  return (
    <div className="space-y-3">
      {displayActivities.slice(0, 5).map((activity) => (
        <div key={activity.id} className="flex items-start space-x-3">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${getActivityColor(activity.type)}`}>
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">
              <span className="font-medium">{activity.user}</span> {activity.description}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(activity.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
      ))}
      
      {displayActivities.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <div className="text-2xl mb-2">📭</div>
          <p className="text-sm">No recent activity</p>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;