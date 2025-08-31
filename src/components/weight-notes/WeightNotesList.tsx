'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  Scale, 
  Calendar,
  Search,
  Eye,
  Plus,
  Package
} from 'lucide-react';
import { Database } from '../../types/supabase';

type WeightNote = Database['public']['Tables']['weight_notes']['Row'] & {
  qc_staff?: { full_name: string; role: string };
  production_staff?: { full_name: string; role: string };
  supplier_auth?: { full_name: string; role: string };
  supplier?: { first_name: string; last_name: string; type: string };
  lot?: { lot_number: string; status: string };
};

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

interface WeightNotesListProps {
  onCreateNew: () => void;
  onViewDetails: (note: WeightNote) => void;
  currentUser: UserProfile | null;
}

export function WeightNotesList({ onCreateNew, onViewDetails, currentUser }: WeightNotesListProps) {
  const supabase = createClientComponentClient<Database>();
  const [weightNotes, setWeightNotes] = useState<WeightNote[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<WeightNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stepFilter, setStepFilter] = useState<string>('all');

  useEffect(() => {
    loadWeightNotes();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [weightNotes, searchTerm, statusFilter, stepFilter]);

  const loadWeightNotes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('weight_notes')
      .select(`
        *,
        qc_staff:qc_staff_id(full_name, role),
        production_staff:production_staff_id(full_name, role),
        supplier_auth:supplier_authenticated_by(full_name, role),
        supplier:supplier_id(first_name, last_name, type),
        lot:lot_id(lot_number, status)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setWeightNotes(data);
    }
    setLoading(false);
  };

  const filterNotes = () => {
    let filtered = weightNotes;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(note => 
        note.box_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${note.supplier?.first_name} ${note.supplier?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.lot?.lot_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.qc_staff?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(note => {
        switch (statusFilter) {
          case 'pending': return !note.workflow_completed;
          case 'approved': return note.qc_approval_status === 'approved';
          case 'rejected': return note.qc_approval_status === 'rejected';
          case 'completed': return note.workflow_completed;
          default: return true;
        }
      });
    }

    // Step filter
    if (stepFilter !== 'all') {
      const step = parseInt(stepFilter);
      filtered = filtered.filter(note => note.authentication_step === step);
    }

    setFilteredNotes(filtered);
  };

  const getStatusBadge = (note: WeightNote) => {
    if (note.workflow_completed) {
      return <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Completed
      </Badge>;
    }

    if (note.qc_approval_status === 'rejected') {
      return <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Rejected
      </Badge>;
    }

    return <Badge variant="secondary">
      <Clock className="h-3 w-3 mr-1" />
      Step {note.authentication_step || 1}/4
    </Badge>;
  };

  const getStepDescription = (step?: number) => {
    switch (step) {
      case 1: return 'Production Staff Auth';
      case 2: return 'Supplier Auth';
      case 3: return 'Data Entry';
      case 4: return 'QC Approval';
      default: return 'Production Staff Auth';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by box number, supplier, lot number, or QC staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stepFilter} onValueChange={setStepFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Steps" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Steps</SelectItem>
                <SelectItem value="1">Production Auth</SelectItem>
                <SelectItem value="2">Supplier Auth</SelectItem>
                <SelectItem value="3">Data Entry</SelectItem>
                <SelectItem value="4">QC Approval</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredNotes.length === 0 && !loading && (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Scale className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Weight Notes Found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' || stepFilter !== 'all' 
                ? 'No weight notes match your current filters.'
                : 'Get started by creating your first weight note.'
              }
            </p>
            <Button onClick={onCreateNew} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create First Weight Note
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Weight Notes Grid */}
      <div className="grid gap-4">
        {filteredNotes.map((note) => (
          <Card key={note.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-1 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Box: {note.box_number}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Supplier: {note.supplier ? `${note.supplier.first_name} ${note.supplier.last_name}` : 'Unknown'}
                  </p>
                  <p className="text-gray-600 text-sm">
                    Lot: {note.lot?.lot_number || 'Unknown'}
                  </p>
                </div>
                {getStatusBadge(note)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Scale className="h-4 w-4" />
                  <span>{note.weight || 0} kg</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>{note.qc_staff?.full_name || 'Unassigned'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(note.created_at || '').toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{getStepDescription(note.authentication_step)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  ID: {note.id?.slice(0, 8)}...
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onViewDetails(note)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      {filteredNotes.length >= 50 && (
        <div className="text-center">
          <Button variant="outline" onClick={loadWeightNotes}>
            Load More Weight Notes
          </Button>
        </div>
      )}
    </div>
  );
}