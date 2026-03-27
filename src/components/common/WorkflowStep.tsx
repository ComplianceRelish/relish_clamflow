import { ReactNode } from "react";
import { StatusBadge, WorkflowStatus } from "./StatusBadge";

interface WorkflowStepProps {
  stepNumber: number;
  title: string;
  description?: string;
  status: WorkflowStatus;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  showOrganolepticsIndicator?: boolean;
}

export function WorkflowStep({
  stepNumber,
  title,
  description,
  status,
  icon,
  onClick,
  disabled = false,
  showOrganolepticsIndicator = false,
}: WorkflowStepProps) {
  const isClickable = onClick && !disabled && status !== "locked";

  const statusColors = {
    completed: "border-green-500 bg-green-50",
    active: "border-blue-500 bg-blue-50",
    pending: "border-gray-300 bg-white",
    locked: "border-gray-200 bg-gray-50",
    "awaiting-supervisor": "border-amber-500 bg-amber-50",
    approved: "border-green-500 bg-green-50",
    rejected: "border-red-500 bg-red-50",
    draft: "border-gray-300 bg-white",
    submitted: "border-blue-500 bg-blue-50",
  };

  const stepNumberColors = {
    completed: "bg-green-500 text-white",
    active: "bg-blue-500 text-white",
    pending: "bg-gray-300 text-gray-600",
    locked: "bg-gray-200 text-gray-500",
    "awaiting-supervisor": "bg-amber-500 text-white",
    approved: "bg-green-500 text-white",
    rejected: "bg-red-500 text-white",
    draft: "bg-gray-300 text-gray-600",
    submitted: "bg-blue-500 text-white",
  };

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={`
        border-2 rounded-lg p-4 transition-all
        ${statusColors[status]}
        ${
          isClickable
            ? "cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
            : disabled || status === "locked"
            ? "opacity-60 cursor-not-allowed"
            : ""
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div
          className={`
          flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0
          ${stepNumberColors[status]}
          font-bold text-sm
        `}
        >
          {stepNumber}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-base leading-tight">
                {title}
              </h3>
              {description && (
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              )}
            </div>
            {icon && (
              <div className="text-gray-400 flex-shrink-0">{icon}</div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={status} size="sm" />
            {showOrganolepticsIndicator && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-200">
                Organoleptics Required
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
