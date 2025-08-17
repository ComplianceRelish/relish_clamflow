import { useState } from "react";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Alert, AlertDescription } from "../ui/Alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/Tabs";
import { Textarea } from "../ui/Textarea";
import { Label } from "../ui/Label";
import { CheckCircle, XCircle, Clock, FileText, User, Package, Truck, Eye, AlertCircle } from "lucide-react";

interface ApprovalForm {
  id: string;
  type: 'ppc' | 'fp';
  lot_id: string;
  station_staff_id: string;
  total_boxes: number;
  total_weight: number;
  status: string;
  submitted_at: string;
  created_at: string;
  boxes: any[];
}

interface ApprovalDashboardProps {
  userRole: 'station_qc' | 'production_supervisor';
  userId: string;
  onFormApproved: (formId: string, formType: 'ppc' | 'fp') => void;
  onFormRejected: (formId: string, formType: 'ppc' | 'fp', reason: string) => void;
  onClose: () => void;
}

export function ApprovalDashboard({ 
  userRole, 
  userId, 
  onFormApproved, 
  onFormRejected, 
  onClose 
}: ApprovalDashboardProps) {
  const [selectedForm, setSelectedForm] = useState<ApprovalForm | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);

  // Mock data for demonstration
  const mockPendingForms: ApprovalForm[] = [
    {
      id: 'ppc_001',
      type: 'ppc',
      lot_id: 'L001',
      station_staff_id: 'staff_001',
      total_boxes: 5,
      total_weight: 127.5,
      status: userRole === 'station_qc' ? 'submitted_to_qc' : 'submitted_to_supervisor',
      submitted_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      boxes: [
        { box_number: 'BOX001', product_type: 'Whole Clam', grade: 'A', weight: 25.5 },
        { box_number: 'BOX002', product_type: 'Whole Clam', grade: 'A', weight: 24.8 },
        { box_number: 'BOX003', product_type: 'Clam Meat', grade: 'B', weight: 26.2 },
        { box_number: 'BOX004', product_type: 'Whole Clam', grade: 'A', weight: 25.0 },
        { box_number: 'BOX005', product_type: 'Clam Meat', grade: 'A', weight: 26.0 }
      ]
    },
    {
      id: 'fp_001',
      type: 'fp',
      lot_id: 'L001',
      station_staff_id: 'staff_002',
      total_boxes: 3,
      total_weight: 75.3,
      status: userRole === 'station_qc' ? 'submitted_to_qc' : 'submitted_to_supervisor',
      submitted_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      boxes: [
        { final_box_number: 'FP001', product_type: 'Whole Clam', grade: 'A', weight: 25.1 },
        { final_box_number: 'FP002', product_type: 'Whole Clam', grade: 'A', weight: 25.0 },
        { final_box_number: 'FP003', product_type: 'Clam Meat', grade: 'A', weight: 25.2 }
      ]
    },
    {
      id: 'ppc_002',
      type: 'ppc',
      lot_id: 'L002',
      station_staff_id: 'staff_003',
      total_boxes: 2,
      total_weight: 51.0,
      status: userRole === 'station_qc' ? 'submitted_to_qc' : 'submitted_to_supervisor',
      submitted_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      boxes: [
        { box_number: 'BOX006', product_type: 'Whole Clam', grade: 'B', weight: 25.5 },
        { box_number: 'BOX007', product_type: 'Clam Meat', grade: 'A', weight: 25.5 }
      ]
    }
  ];

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'submitted_to_qc': return 'bg-blue-100 text-blue-800';
      case 'submitted_to_supervisor': return 'bg-purple-100 text-purple-800';
      case 'qc_approved': return 'bg-green-100 text-green-800';
      case 'qc_rejected': return 'bg-red-100 text-red-800';
      case 'supervisor_approved': return 'bg-green-100 text-green-800';
      case 'supervisor_rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFormTypeIcon = (type: 'ppc' | 'fp') => {
    return type === 'ppc' ? Package : Truck;
  };

  const getFormTypeName = (type: 'ppc' | 'fp') => {
    return type === 'ppc' ? 'PPC Form' : 'FP Form';
  };

  const handleApprove = (form: ApprovalForm) => {
    onFormApproved(form.id, form.type);
    setSelectedForm(null);
  };

  const handleReject = (form: ApprovalForm) => {
    setSelectedForm(form);
    setShowRejectionDialog(true);
  };

  const submitRejection = () => {
    if (selectedForm && rejectionReason.trim()) {
      onFormRejected(selectedForm.id, selectedForm.type, rejectionReason);
      setShowRejectionDialog(false);
      setSelectedForm(null);
      setRejectionReason('');
    }
  };

  const getRoleTitle = () => {
    return userRole === 'station_qc' ? 'Station QC' : 'Production Supervisor';
  };

  const getWorkflowDescription = () => {
    if (userRole === 'station_qc') {
      return "Review forms submitted by station staff. Approved forms will be sent to Production Supervisor.";
    } else {
      return "Review forms approved by Station QC. Your approval generates gate passes (PPC) or triggers inventory insertion (FP).";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2">
                <User className="w-6 h-6" />
                {getRoleTitle()} Approval Dashboard
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {getWorkflowDescription()}
              </p>
            </div>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Pending Forms */}
          <div className="grid gap-4">
            <h3 className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pending Approvals ({mockPendingForms.length})
            </h3>
            
            {mockPendingForms.length === 0 ? (
              <Alert>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  No forms pending approval at this time.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-4">
                {mockPendingForms.map((form) => {
                  const FormIcon = getFormTypeIcon(form.type);
                  return (
                    <Card key={form.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <FormIcon className="w-8 h-8 text-blue-600" />
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {getFormTypeName(form.type)} #{form.id}
                                <Badge className={getStatusBadgeColor(form.status)}>
                                  {form.status.replace(/_/g, ' ').toUpperCase()}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Lot: {form.lot_id} | Staff: {form.station_staff_id} | 
                                Submitted: {new Date(form.submitted_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-medium">{form.total_boxes} boxes</div>
                              <div className="text-sm text-muted-foreground">{form.total_weight.toFixed(1)} kg</div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                onClick={() => setSelectedForm(selectedForm?.id === form.id ? null : form)}
                                variant="outline"
                                size="sm"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                {selectedForm?.id === form.id ? 'Hide' : 'View'}
                              </Button>
                              <Button
                                onClick={() => handleApprove(form)}
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleReject(form)}
                                variant="destructive"
                                size="sm"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Expanded View */}
                        {selectedForm?.id === form.id && (
                          <div className="mt-4 pt-4 border-t">
                            <Tabs defaultValue="details">
                              <TabsList>
                                <TabsTrigger value="details">Form Details</TabsTrigger>
                                <TabsTrigger value="boxes">Boxes ({form.boxes.length})</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="details" className="space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Form ID:</span> {form.id}
                                  </div>
                                  <div>
                                    <span className="font-medium">Type:</span> {getFormTypeName(form.type)}
                                  </div>
                                  <div>
                                    <span className="font-medium">Lot ID:</span> {form.lot_id}
                                  </div>
                                  <div>
                                    <span className="font-medium">Station Staff:</span> {form.station_staff_id}
                                  </div>
                                  <div>
                                    <span className="font-medium">Created:</span> {new Date(form.created_at).toLocaleString()}
                                  </div>
                                  <div>
                                    <span className="font-medium">Submitted:</span> {new Date(form.submitted_at).toLocaleString()}
                                  </div>
                                  <div>
                                    <span className="font-medium">Total Boxes:</span> {form.total_boxes}
                                  </div>
                                  <div>
                                    <span className="font-medium">Total Weight:</span> {form.total_weight.toFixed(2)} kg
                                  </div>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="boxes">
                                <div className="space-y-2">
                                  {form.boxes.map((box, index) => (
                                    <div key={index} className="border rounded p-3">
                                      <div className="grid grid-cols-4 gap-4 text-sm">
                                        <div>
                                          <span className="font-medium">Box:</span> {
                                            form.type === 'ppc' ? box.box_number : box.final_box_number
                                          }
                                        </div>
                                        <div>
                                          <span className="font-medium">Product:</span> {box.product_type}
                                        </div>
                                        <div>
                                          <span className="font-medium">Grade:</span> {box.grade}
                                        </div>
                                        <div>
                                          <span className="font-medium">Weight:</span> {box.weight} kg
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </TabsContent>
                            </Tabs>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rejection Dialog */}
          {showRejectionDialog && selectedForm && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800">
                  Reject {getFormTypeName(selectedForm.type)} #{selectedForm.id}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Rejection Reason (Required)</Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide detailed reason for rejection..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={submitRejection}
                    variant="destructive"
                    disabled={!rejectionReason.trim()}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Confirm Rejection
                  </Button>
                  <Button
                    onClick={() => {
                      setShowRejectionDialog(false);
                      setRejectionReason('');
                      setSelectedForm(null);
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Workflow Information */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-lg">Approval Workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {userRole === 'station_qc' ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Review forms submitted by station staff with biometric authentication</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Approved forms automatically forward to Production Supervisor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Rejected forms return to station staff for rectification</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Review forms approved by Station QC</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>PPC Approval → Gate Pass Generation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>FP Approval → Data Inserted into Inventory Module</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Rejected forms return to station staff & Station QC</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}