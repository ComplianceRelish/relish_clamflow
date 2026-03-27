import { ChevronRight } from "lucide-react";
import { StatusBadge, type WorkflowStatus } from "./StatusBadge";

interface ActionCardProps {
  title: string;
  description?: string;
  status?: WorkflowStatus;
  onClick?: () => void;
  icon?: React.ReactNode;
  metadata?: Array<{ label: string; value: string }>;
  disabled?: boolean;
  className?: string;
}

export function ActionCard({
  title,
  description,
  status,
  onClick,
  icon,
  metadata,
  disabled = false,
  className = "",
}: ActionCardProps) {
  const isClickable = !!onClick && !disabled;

  return (
    <div
      onClick={isClickable ? onClick : undefined}
      className={`
        bg-white border border-gray-200 rounded-lg p-4 shadow-sm transition-all
        ${isClickable ? "cursor-pointer hover:shadow-md hover:border-blue-300 active:scale-[0.99]" : ""}
        ${disabled ? "opacity-60 cursor-not-allowed" : ""}
        ${className}
      `}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg text-gray-600">
            {icon}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-sm font-semibold text-gray-900 truncate">{title}</h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              {status && <StatusBadge status={status} size="sm" />}
              {isClickable && <ChevronRight className="h-4 w-4 text-gray-400" />}
            </div>
          </div>
          
          {description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-2">{description}</p>
          )}
          
          {metadata && metadata.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {metadata.map((item, i) => (
                <span key={i} className="text-xs text-gray-500">
                  <span className="font-medium">{item.label}:</span> {item.value}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
