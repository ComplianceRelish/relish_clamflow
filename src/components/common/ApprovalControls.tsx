'use client';

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";

interface ApprovalControlsProps {
  onApprove: (remarks?: string) => void;
  onReject: (reason: string) => void;
  showRemarks?: boolean;
  approveLabel?: string;
  rejectLabel?: string;
  requireRejectReason?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function ApprovalControls({
  onApprove,
  onReject,
  showRemarks = true,
  approveLabel = "Approve",
  rejectLabel = "Reject",
  requireRejectReason = true,
  disabled = false,
  isLoading = false,
  className = "",
}: ApprovalControlsProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [approveRemarks, setApproveRemarks] = useState("");
  const [error, setError] = useState("");

  const handleApprove = () => {
    if (disabled || isLoading) return;
    setError("");
    onApprove(approveRemarks || undefined);
  };

  const handleReject = () => {
    if (disabled || isLoading) return;
    
    if (requireRejectReason && !rejectReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }
    
    setError("");
    onReject(rejectReason);
  };

  if (showRejectForm) {
    return (
      <div className={`space-y-4 p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-center gap-2 text-red-800">
          <XCircle className="h-5 w-5" />
          <h4 className="font-semibold">Reject Submission</h4>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Reason for Rejection {requireRejectReason && <span className="text-red-500">*</span>}
          </label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter detailed reason for rejection..."
            rows={4}
            className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
            disabled={disabled || isLoading}
          />
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-800 text-sm px-3 py-2 rounded-md">
            {error}
          </div>
        )}
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleReject}
            disabled={disabled || isLoading}
            className="min-h-[44px] px-6 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            {isLoading ? "Rejecting..." : "Confirm Rejection"}
          </button>
          <button
            onClick={() => {
              setShowRejectForm(false);
              setRejectReason("");
              setError("");
            }}
            disabled={isLoading}
            className="min-h-[44px] px-6 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {showRemarks && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Remarks (Optional)
          </label>
          <textarea
            value={approveRemarks}
            onChange={(e) => setApproveRemarks(e.target.value)}
            placeholder="Add any remarks or observations..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={disabled || isLoading}
          />
        </div>
      )}
      
      <div className="flex items-center gap-3 justify-end">
        <button
          onClick={() => setShowRejectForm(true)}
          disabled={disabled || isLoading}
          className="min-h-[44px] px-6 border border-red-300 text-red-700 hover:bg-red-50 rounded-md font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <XCircle className="h-4 w-4" />
          {rejectLabel}
        </button>
        
        <button
          onClick={handleApprove}
          disabled={disabled || isLoading}
          className="min-h-[44px] px-8 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          {isLoading ? "Processing..." : approveLabel}
        </button>
      </div>
    </div>
  );
}
