// src/components/dashboards/admin/UserManagementPanel.tsx - Corrected Version
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2,
  AlertTriangle, 
  CheckCircle,
  Search,
  Filter
} from 'lucide-react';
import { User, UserRole, ROLE_DISPLAY_NAMES, toApiRole } from '@/types/auth';
import clamflowAPI from '@/lib/clamflow-api';

interface UserManagementPanelProps {
  currentUser: User | null;
}

// Custom Select component that matches the expected API
const CustomSelect: React.FC<{
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}> = ({ value, onValueChange, children }) => {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </select>
  );
};

// Custom Switch component
const CustomSwitch: React.FC<{
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}> = ({ checked, onCheckedChange }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-primary' : 'bg-input'
      }`}
    >
      <span
        className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
};

const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    role: 'Production Staff' as string,
    station: '',
    is_active: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await clamflowAPI.getAllUsers();
      if (response.success && response.data) {
        // Convert API response to match our types
        const convertedUsers = response.data.map(user => ({
          ...user,
          role: toApiRole(user.role) // Ensure snake_case
        }));
        setUsers(convertedUsers);
      } else {
        setError(response.error || 'Failed to fetch users');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username || '',
      full_name: user.full_name || '',
      role: ROLE_DISPLAY_NAMES[user.role], // Convert to display name for UI
      station: user.station || '',
      is_active: user.is_active ?? true
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      full_name: '',
      role: 'Production Staff',
      station: '',
      is_active: true
    });
  };

  const handleCreateUser = async () => {
    const userData = {
      username: formData.username,
      full_name: formData.full_name,
      role: toApiRole(formData.role), // Convert to snake_case
      station: formData.station,
      is_active: formData.is_active,
      created_at: new Date().toISOString()
    };

    try {
      const response = await clamflowAPI.createUser(userData);
      if (response.success) {
        setIsCreateDialogOpen(false);
        resetForm();
        fetchUsers();
      } else {
        setError(response.error || 'Failed to create user');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === toApiRole(filterRole);
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.is_active) ||
                         (filterStatus === 'inactive' && !user.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-gray-600">Manage system users and their permissions</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">Station</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-gray-500">{user.full_name}</div>
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge>{ROLE_DISPLAY_NAMES[user.role]}</Badge>
                    </td>
                    <td className="p-2">
                      <span className="text-sm">{user.station || 'Unassigned'}</span>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        {user.is_active ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        <span className={user.is_active ? 'text-green-700' : 'text-red-700'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-username">Username</Label>
                <Input
                  id="create-username"
                  value={formData.username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="create-name">Full Name</Label>
                <Input
                  id="create-name"
                  value={formData.full_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-role">Role</Label>
                <CustomSelect 
                  value={formData.role} 
                  onValueChange={(value: string) => setFormData(prev => ({ ...prev, role: value }))}
                >
                  {Object.values(ROLE_DISPLAY_NAMES).map((displayRole) => (
                    <option key={displayRole} value={displayRole}>
                      {displayRole}
                    </option>
                  ))}
                </CustomSelect>
              </div>
              <div>
                <Label htmlFor="create-station">Station</Label>
                <Input
                  id="create-station"
                  value={formData.station}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, station: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <CustomSwitch
                checked={formData.is_active}
                onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>Active User</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementPanel;