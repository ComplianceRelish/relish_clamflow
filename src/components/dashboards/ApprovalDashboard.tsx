import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface PendingItem {
  id: string;
  type: 'staff' | 'supplier' | 'vendor';
  data: any;
  submitted_by: string;
  submitted_at: string;
  status: string;
}

interface ApprovalDashboardProps {
  authToken?: string;
  currentUserRole?: string;
}

const ApprovalDashboard: React.FC<ApprovalDashboardProps> = ({ 
  authToken, 
  currentUserRole 
}) => {
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<PendingItem | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'staff' | 'supplier' | 'vendor'>('all');
  const [isProcessing, setIsProcessing] = useState(false);

  // Weight Notes, PPC Forms, FP Forms for QC approval
  const [qcPendingItems, setQcPendingItems] = useState({
    weightNotes: [],
    ppcForms: [],
    fpForms: []
  });

  useEffect(() => {
    fetchPendingItems();
    fetchQCPendingItems();
  }, []);

  const fetchPendingItems = async () => {
    setLoading(true);
    try {
      // Note: These specific endpoints need to be added to your backend
      // Using the existing onboarding endpoints for now
      const response = await fetch('https://clamflowbackend-production.up.railway.app/admin/pending-approvals', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingItems(data);
      } else {
        // For now, fetch from individual onboarding endpoints
        setPendingItems([]);
      }
    } catch (error) {
      console.error('Failed to fetch pending items:', error);
      setPendingItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchQCPendingItems = async () => {
    try {
      // FIXED: Proper error handling without mixing Response and plain objects
      const fetchWithFallback = async (url: string) => {
        try {
          const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          if (response.ok) {
            return await response.json();
          }
          return [];
        } catch (error) {
          console.error(`Failed to fetch from ${url}:`, error);
          return [];
        }
      };

      const [weightNotes, ppcForms, fpForms] = await Promise.all([
        fetchWithFallback('https://clamflowbackend-production.up.railway.app/qa/weight-notes?qc_approved=false'),
        fetchWithFallback('https://clamflowbackend-production.up.railway.app/qa/ppc-forms?qc_approved=false'),
        fetchWithFallback('https://clamflowbackend-production.up.railway.app/qa/fp-forms?qc_approved=false')
      ]);

      setQcPendingItems({
        weightNotes,
        ppcForms,
        fpForms
      });
    } catch (error) {
      console.error('Failed to fetch QC pending items:', error);
    }
  };

  const approveOnboardingItem = async (itemId: string, itemType: string) => {
    setIsProcessing(true);
    try {
      // This endpoint needs to be added to your backend
      const response = await fetch(`https://clamflowbackend-production.up.railway.app/admin/approve-${itemType}/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to approve item');
      }

      await fetchPendingItems();
      setSelectedItem(null);
      alert(`${itemType} approved successfully!`);
    } catch (error: any) {
      console.error('Approval error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const rejectOnboardingItem = async (itemId: string, itemType: string, reason: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`https://clamflowbackend-production.up.railway.app/admin/reject-${itemType}/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to reject item');
      }

      await fetchPendingItems();
      setSelectedItem(null);
      alert(`${itemType} rejected successfully!`);
    } catch (error: any) {
      console.error('Rejection error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const approveQCItem = async (itemId: string, itemType: 'weight-note' | 'ppc-form' | 'fp-form') => {
    setIsProcessing(true);
    try {
      const response = await fetch(`https://clamflowbackend-production.up.railway.app/qa/${itemType}/${itemId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to approve QC item');
      }

      await fetchQCPendingItems();
      alert(`${itemType} approved successfully!`);
    } catch (error: any) {
      console.error('QC approval error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredItems = activeTab === 'all' 
    ? pendingItems 
    : pendingItems.filter(item => item.type === activeTab);

  const renderItemDetails = (item: PendingItem) => {
    if (!item.data) return <div>No data available</div>;
    
    const data = item.data;
    
    switch (item.type) {
      case 'staff':
        return (
          <div className="space-y-3">
            <div><strong>Name:</strong> {data.first_name} {data.last_name}</div>
            <div><strong>Designation:</strong> {data.designation}</div>
            <div><strong>Contact:</strong> {data.contact_number}</div>
            <div><strong>Aadhar:</strong> {data.aadhar_number}</div>
            <div><strong>Address:</strong> {data.address}</div>
            {data.face_image && (
              <div>
                <strong>Face Image:</strong>
                <img src={data.face_image} alt="Staff face" className="mt-2 w-32 h-32 object-cover rounded" />
              </div>
            )}
          </div>
        );
      
      case 'supplier':
        return (
          <div className="space-y-3">
            <div><strong>Type:</strong> {data.type}</div>
            <div><strong>Name:</strong> {data.first_name} {data.last_name}</div>
            <div><strong>Contact:</strong> {data.contact_number}</div>
            <div><strong>Boat Registration:</strong> {data.boat_registration_number}</div>
            <div><strong>GST:</strong> {data.gst_number || 'N/A'}</div>
            <div><strong>Address:</strong> {data.address}</div>
            {data.face_image && (
              <div>
                <strong>Face Image:</strong>
                <img src={data.face_image} alt="Supplier face" className="mt-2 w-32 h-32 object-cover rounded" />
              </div>
            )}
          </div>
        );
      
      case 'vendor':
        return (
          <div className="space-y-3">
            <div><strong>Name:</strong> {data.first_name} {data.last_name}</div>
            <div><strong>Firm:</strong> {data.name_of_firm}</div>
            <div><strong>Category:</strong> {data.category}</div>
            <div><strong>Contact:</strong> {data.contact_number}</div>
            <div><strong>GST:</strong> {data.gst_number || 'N/A'}</div>
            <div><strong>Address:</strong> {data.address}</div>
            {data.face_image && (
              <div>
                <strong>Face Image:</strong>
                <img src={data.face_image} alt="Vendor face" className="mt-2 w-32 h-32 object-cover rounded" />
              </div>
            )}
          </div>
        );
      
      default:
        return <div>Unknown item type</div>;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Approval Dashboard</h1>
      
      {/* Role-based Access Notice */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-800">
          <strong>Current Role:</strong> {currentUserRole || 'Unknown'}
        </p>
        <p className="text-blue-600 text-sm">
          You can approve onboarding requests and QC forms based on your role permissions.
        </p>
      </div>

      {/* Onboarding Approvals Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Onboarding Approvals</h2>
        
        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          {['all', 'staff', 'supplier', 'vendor'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-md font-medium ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'all' && ` (${pendingItems.length})`}
              {tab !== 'all' && ` (${pendingItems.filter(item => item.type === tab).length})`}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-lg shadow-md border">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  item.type === 'staff' ? 'bg-blue-100 text-blue-800' :
                  item.type === 'supplier' ? 'bg-green-100 text-green-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {item.type.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">
                  {format(new Date(item.submitted_at), 'MMM dd, yyyy')}
                </span>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {item.data?.first_name || 'Unknown'} {item.data?.last_name || ''}
                </h3>
                <p className="text-sm text-gray-600">
                  {item.type === 'staff' && item.data?.designation}
                  {item.type === 'supplier' && item.data?.boat_registration_number}
                  {item.type === 'vendor' && item.data?.category}
                </p>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedItem(item)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-200"
                >
                  View Details
                </button>
                <button
                  onClick={() => approveOnboardingItem(item.id, item.type)}
                  disabled={isProcessing}
                  className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">No pending {activeTab === 'all' ? 'items' : activeTab} for approval</div>
          </div>
        )}
      </div>

      {/* QC Approvals Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">QC Approvals</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Weight Notes */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Weight Notes ({qcPendingItems.weightNotes.length})
            </h3>
            <div className="space-y-3">
              {qcPendingItems.weightNotes.slice(0, 5).map((item: any) => (
                <div key={item.id} className="border-l-4 border-blue-500 pl-3">
                  <div className="text-sm font-medium">Box: {item.box_number}</div>
                  <div className="text-xs text-gray-600">Weight: {item.weight} kg</div>
                  <button
                    onClick={() => approveQCItem(item.id, 'weight-note')}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded mt-1 hover:bg-blue-200"
                    disabled={isProcessing}
                  >
                    Approve
                  </button>
                </div>
              ))}
              {qcPendingItems.weightNotes.length === 0 && (
                <div className="text-sm text-gray-500">No pending weight notes</div>
              )}
            </div>
          </div>

          {/* PPC Forms */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              PPC Forms ({qcPendingItems.ppcForms.length})
            </h3>
            <div className="space-y-3">
              {qcPendingItems.ppcForms.slice(0, 5).map((item: any) => (
                <div key={item.id} className="border-l-4 border-orange-500 pl-3">
                  <div className="text-sm font-medium">Box: {item.box_number}</div>
                  <div className="text-xs text-gray-600">{item.product_type} - {item.grade}</div>
                  <button
                    onClick={() => approveQCItem(item.id, 'ppc-form')}
                    className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded mt-1 hover:bg-orange-200"
                    disabled={isProcessing}
                  >
                    Approve
                  </button>
                </div>
              ))}
              {qcPendingItems.ppcForms.length === 0 && (
                <div className="text-sm text-gray-500">No pending PPC forms</div>
              )}
            </div>
          </div>

          {/* FP Forms */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              FP Forms ({qcPendingItems.fpForms.length})
            </h3>
            <div className="space-y-3">
              {qcPendingItems.fpForms.slice(0, 5).map((item: any) => (
                <div key={item.id} className="border-l-4 border-green-500 pl-3">
                  <div className="text-sm font-medium">Box: {item.box_number}</div>
                  <div className="text-xs text-gray-600">{item.product_type} - {item.grade}</div>
                  <button
                    onClick={() => approveQCItem(item.id, 'fp-form')}
                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded mt-1 hover:bg-green-200"
                    disabled={isProcessing}
                  >
                    Approve
                  </button>
                </div>
              ))}
              {qcPendingItems.fpForms.length === 0 && (
                <div className="text-sm text-gray-500">No pending FP forms</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {selectedItem.type.charAt(0).toUpperCase() + selectedItem.type.slice(1)} Details
              </h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="mb-6">
              {renderItemDetails(selectedItem)}
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => approveOnboardingItem(selectedItem.id, selectedItem.type)}
                disabled={isProcessing}
                className="bg-green-600 text-white py-2 px-6 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => {
                  const reason = prompt('Enter rejection reason:');
                  if (reason) {
                    rejectOnboardingItem(selectedItem.id, selectedItem.type, reason);
                  }
                }}
                disabled={isProcessing}
                className="bg-red-600 text-white py-2 px-6 rounded hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => setSelectedItem(null)}
                className="bg-gray-300 text-gray-700 py-2 px-6 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalDashboard;