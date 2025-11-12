'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Search, Plus, Edit2, Trash2, UserPlus, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Custom Select component
const FormSelect: React.FC<{
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}> = ({ value, onValueChange, children, className = "" }) => {
  return (
    <select 
      value={value} 
      onChange={(e) => onValueChange(e.target.value)}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </select>
  );
};

const FormSelectItem: React.FC<{
  value: string;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return <option value={value}>{children}</option>;
};

// Mock/Fallback user data
const mockUsers = [
  {
    id: 'user_1',
    username: 'SA_Motty',
    full_name: 'Motty Philip',
    role: 'Super Admin',
    station: 'Enterprise',
    is_active: true,
    last_login: '2024-09-16T08:00:00Z',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'user_2',
    username: 'AD_Admin',
    full_name: 'System Administrator',
    role: 'Admin',
    station: 'Main Office',
    is_active: true,
    last_login: '2024-09-15T14:30:00Z',
    created_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 'user_3',
    username: 'QC_Lead',
    full_name: 'Quality Control Lead',
    role: 'QC Lead',
    station: 'QC Station 1',
    is_active: true,
    last_login: '2024-09-16T07:45:00Z',
    created_at: '2024-02-01T00:00:00Z'
  }
];

interface User {
  id: string;
  username: string;
  full_name: string;
  role: string;
  station?: string;
  is_active: boolean;
  last_login?: string;
  created_at?: string;
}

interface UserManagementPanelProps {
  currentUser?: {
    id: string;
    username: string;
    role: string;
  } | null;
}

export default function UserManagementPanel({ currentUser }: UserManagementPanelProps) {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    role: 'Production Staff',
    station: '',
    password: ''
  });
  const [formError, setFormError] = useState('');

  const roles = [
    'Super Admin',
    'Admin', 
    'Production Lead',
    'QC Lead',
    'Staff Lead',
    'QC Staff',
    'Production Staff',
    'Security Guard'
  ];

  const getRolePrefix = (role: string): string => {
    const prefixMap: { [key: string]: string } = {
      'Super Admin': 'SA',
      'Admin': 'AD', 
      'Production Lead': 'PL',
      'QC Lead': 'QC',
      'Staff Lead': 'SL',
      'QC Staff': 'QS',
      'Production Staff': 'PS',
      'Security Guard': 'SG'
    };
    return prefixMap[role] || 'US';
  };

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch from API
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://clamflowbackend-production.up.railway.app'}/users/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUsers(data);
          return;
        }
      } catch (err) {
        console.warn('API authentication failed, trying enterprise credentials:', err);
      }

      // Fallback to local storage or mock data
      const storedUsers = localStorage.getItem('clamflow_users');
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      } else {
        setUsers(mockUsers);
        localStorage.setItem('clamflow_users', JSON.stringify(mockUsers));
      }

    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
      setUsers(mockUsers); // Always provide fallback
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const createUser = async (userData: any) => {
    try {
      // Generate username based on role and name
      const rolePrefix = getRolePrefix(userData.role);
      const firstName = userData.full_name.split(' ')[0];
      const username = `${rolePrefix}_${firstName}`;

      const newUser: User = {
        id: `user_${Date.now()}`,
        username,
        full_name: userData.full_name,
        role: userData.role,
        station: userData.station || 'Unassigned',
        is_active: true,
        created_at: new Date().toISOString(),
        last_login: undefined
      };

      // Try API first
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://clamflowbackend-production.up.railway.app'}/users/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...userData,
            username
          })
        });

        if (response.ok) {
          const createdUser = await response.json();
          setUsers(prev => [...prev, createdUser]);
          return true;
        }
      } catch (err) {
        console.warn('API authentication failed, trying enterprise credentials:', err);
      }

      // Fallback to local storage
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      localStorage.setItem('clamflow_users', JSON.stringify(updatedUsers));
      
      return true;
    } catch (err) {
      console.error('Error creating user:', err);
      setFormError('Failed to create user');
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.username && !formData.full_name) {
      setFormError('Full name is required');
      return;
    }

    const success = await createUser(formData);
    if (success) {
      setShowCreateForm(false);
      setFormData({
        username: '',
        full_name: '',
        role: 'Production Staff',
        station: '',
        password: ''
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'All Roles' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'Super Admin': return 'destructive';
      case 'Admin': return 'default';
      case 'QC Lead': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Backend API unavailable. Using offline mode. {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Add New User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <FormSelect
          value={selectedRole}
          onValueChange={setSelectedRole}
          className="w-48"
        >
          <FormSelectItem value="All Roles">All Roles</FormSelectItem>
          {roles.map(role => (
            <FormSelectItem key={role} value={role}>{role}</FormSelectItem>
          ))}
        </FormSelect>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || selectedRole !== 'All Roles' ? 'No users match your filters' : 'No users found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">USER</th>
                    <th className="text-left py-2">ROLE</th>
                    <th className="text-left py-2">STATION</th>
                    <th className="text-left py-2">STATUS</th>
                    <th className="text-left py-2">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="border-b">
                      <td className="py-3">
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-gray-500">{user.username}</div>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3">{user.station || 'Unassigned'}</td>
                      <td className="py-3">
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingUser(user)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={user.username === currentUser?.username}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <Alert>
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <FormSelect
                    value={formData.role}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                  >
                    {roles.map(role => (
                      <FormSelectItem key={role} value={role}>{role}</FormSelectItem>
                    ))}
                  </FormSelect>
                </div>

                <div>
                  <Label htmlFor="station">Station (Optional)</Label>
                  <Input
                    id="station"
                    value={formData.station}
                    onChange={(e) => setFormData(prev => ({ ...prev, station: e.target.value }))}
                    placeholder="Enter station (optional)"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Create User
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}