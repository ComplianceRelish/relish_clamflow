import React, { useState } from 'react';
import { 
  Users, 
  Shield, 
  Settings, 
  Database, 
  HardDrive, 
  AlertTriangle, 
  FileText, 
  Terminal, 
  Activity,
  X 
} from 'lucide-react';
import UserManagementPanel from './admin/UserManagementPanel'; // Correct path

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  priority: 'critical' | 'high' | 'medium';
}

const SuperAdminDashboard: React.FC = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const features: FeatureCard[] = [
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Create, edit, and manage user accounts across all roles',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-blue-500',
      priority: 'high'
    },
    {
      id: 'admin-permissions',
      title: 'Admin Permissions',
      description: 'Configure role-based access control and permissions',
      icon: <Shield className="w-6 h-6" />,
      color: 'bg-green-500',
      priority: 'critical'
    },
    {
      id: 'system-config',
      title: 'System Configuration',
      description: 'Manage global system settings and configurations',
      icon: <Settings className="w-6 h-6" />,
      color: 'bg-purple-500',
      priority: 'high'
    },
    {
      id: 'backup-recovery',
      title: 'Backup & Recovery',
      description: 'Database backup management and disaster recovery',
      icon: <Database className="w-6 h-6" />,
      color: 'bg-indigo-500',
      priority: 'critical'
    },
    {
      id: 'hardware-management',
      title: 'Hardware Management',
      description: 'Monitor and control production hardware systems',
      icon: <HardDrive className="w-6 h-6" />,
      color: 'bg-orange-500',
      priority: 'medium'
    },
    {
      id: 'emergency-controls',
      title: 'Emergency Controls',
      description: 'Emergency shutdown and critical system controls',
      icon: <AlertTriangle className="w-6 h-6" />,
      color: 'bg-red-500',
      priority: 'critical'
    },
    {
      id: 'audit-log',
      title: 'Audit Log Export',
      description: 'Export and analyze system audit logs',
      icon: <FileText className="w-6 h-6" />,
      color: 'bg-yellow-500',
      priority: 'medium'
    },
    {
      id: 'database-console',
      title: 'Database Console',
      description: 'Direct database access and query execution',
      icon: <Terminal className="w-6 h-6" />,
      color: 'bg-gray-500',
      priority: 'high'
    },
    {
      id: 'api-monitoring',
      title: 'API Monitoring',
      description: 'Real-time API performance and health monitoring',
      icon: <Activity className="w-6 h-6" />,
      color: 'bg-teal-500',
      priority: 'high'
    }
  ];

  const openModal = (featureId: string) => {
    setActiveModal(featureId);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const renderModalContent = () => {
    if (!activeModal) return null;

    switch (activeModal) {
      case 'user-management':
        return <UserManagementPanel title="User Management" onClose={closeModal} />;
      
      case 'admin-permissions':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Admin Permissions</h2>
            <p className="text-gray-600">This panel is under development.</p>
          </div>
        );
      
      case 'system-config':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">System Configuration</h2>
            <p className="text-gray-600">This panel is under development.</p>
          </div>
        );
      
      case 'backup-recovery':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Backup & Recovery</h2>
            <p className="text-gray-600">This panel is under development.</p>
          </div>
        );
      
      case 'hardware-management':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Hardware Management</h2>
            <p className="text-gray-600">This panel is under development.</p>
          </div>
        );
      
      case 'emergency-controls':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Emergency Controls</h2>
            <p className="text-gray-600">This panel is under development.</p>
          </div>
        );
      
      case 'audit-log':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Audit Log Export</h2>
            <p className="text-gray-600">This panel is under development.</p>
          </div>
        );
      
      case 'database-console':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Database Console</h2>
            <p className="text-gray-600">This panel is under development.</p>
          </div>
        );
      
      case 'api-monitoring':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">API Monitoring</h2>
            <p className="text-gray-600">This panel is under development.</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500';
      case 'high': return 'border-orange-500';
      case 'medium': return 'border-yellow-500';
      default: return 'border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img
                  className="h-8 w-8"
                  src="/logo_relish.png"
                  alt="Relish"
                />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">ClamFlow</h1>
                <p className="text-sm text-gray-500">Super Admin Dashboard</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Super Admin
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-2">System Administration</h2>
            <p className="text-sm text-gray-600">
              Manage users, configure systems, and monitor critical operations
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.id}
                className={`bg-white overflow-hidden shadow rounded-lg border-l-4 ${getPriorityColor(feature.priority)} hover:shadow-lg transition-shadow duration-200 cursor-pointer`}
                onClick={() => openModal(feature.id)}
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 ${feature.color} rounded-md p-3 text-white`}>
                      {feature.icon}
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {feature.title}
                        </dt>
                        <dd className="text-sm text-gray-900 mt-1">
                          {feature.description}
                        </dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        feature.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        feature.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {feature.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Overlay */}
      {activeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="absolute top-0 right-0 pt-4 pr-4">
              <button
                type="button"
                className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                onClick={closeModal}
              >
                <span className="sr-only">Close</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-3">
              {renderModalContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;