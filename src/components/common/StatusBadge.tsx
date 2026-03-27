import { Badge } from "../ui/Badge";
import {
  CheckCircle,
  Clock,
  Lock,
  AlertTriangle,
  XCircle,
  AlertCircle,
} from "lucide-react";

export type WorkflowStatus =
  | "completed"
  | "active"
  | "pending"
  | "locked"
  | "awaiting-supervisor"
  | "approved"
  | "rejected"
  | "draft"
  | "submitted";

interface StatusBadgeProps {
  status: WorkflowStatus;
  label?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({
  status,
  label,
  showIcon = true,
  size = "md",
}: StatusBadgeProps) {
  const statusConfig = {
    completed: {
      icon: CheckCircle,
      label: label || "Completed",
      className: "bg-green-100 text-green-800 border-green-200",
      iconClassName: "text-green-600",
    },
    active: {
      icon: Clock,
      label: label || "Active",
      className: "bg-blue-100 text-blue-800 border-blue-200",
      iconClassName: "text-blue-600",
    },
    pending: {
      icon: Clock,
      label: label || "Pending",
      className: "bg-gray-100 text-gray-700 border-gray-200",
      iconClassName: "text-gray-500",
    },
    locked: {
      icon: Lock,
      label: label || "Locked",
      className: "bg-gray-100 text-gray-600 border-gray-200",
      iconClassName: "text-gray-400",
    },
    "awaiting-supervisor": {
      icon: AlertTriangle,
      label: label || "Awaiting Approval",
      className: "bg-amber-100 text-amber-800 border-amber-200",
      iconClassName: "text-amber-600",
    },
    approved: {
      icon: CheckCircle,
      label: label || "Approved",
      className: "bg-green-100 text-green-800 border-green-200",
      iconClassName: "text-green-600",
    },
    rejected: {
      icon: XCircle,
      label: label || "Rejected",
      className: "bg-red-100 text-red-800 border-red-200",
      iconClassName: "text-red-600",
    },
    draft: {
      icon: AlertCircle,
      label: label || "Draft",
      className: "bg-gray-100 text-gray-700 border-gray-200",
      iconClassName: "text-gray-500",
    },
    submitted: {
      icon: Clock,
      label: label || "Submitted",
      className: "bg-blue-100 text-blue-800 border-blue-200",
      iconClassName: "text-blue-600",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <Badge
      variant="outline"
      className={`${config.className} ${sizeClasses[size]} flex items-center gap-1.5 font-medium border`}
    >
      {showIcon && <Icon className={`${iconSizes[size]} ${config.iconClassName}`} />}
      <span>{config.label}</span>
    </Badge>
  );
}
