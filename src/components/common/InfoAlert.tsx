import { Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

type AlertVariant = "info" | "success" | "warning" | "error";

interface InfoAlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const variantConfig: Record<AlertVariant, { icon: React.FC<{ className?: string }>; containerClass: string; iconClass: string; titleClass: string }> = {
  info: {
    icon: Info,
    containerClass: "bg-blue-50 border-blue-200",
    iconClass: "text-blue-600",
    titleClass: "text-blue-900",
  },
  success: {
    icon: CheckCircle,
    containerClass: "bg-green-50 border-green-200",
    iconClass: "text-green-600",
    titleClass: "text-green-900",
  },
  warning: {
    icon: AlertTriangle,
    containerClass: "bg-amber-50 border-amber-200",
    iconClass: "text-amber-600",
    titleClass: "text-amber-900",
  },
  error: {
    icon: XCircle,
    containerClass: "bg-red-50 border-red-200",
    iconClass: "text-red-600",
    titleClass: "text-red-900",
  },
};

export function InfoAlert({
  variant = "info",
  title,
  children,
  className = "",
  dismissible = false,
  onDismiss,
}: InfoAlertProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className={`flex gap-3 p-4 border rounded-lg ${config.containerClass} ${className}`} role="alert">
      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${config.iconClass}`} />
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={`text-sm font-semibold mb-1 ${config.titleClass}`}>
            {title}
          </h4>
        )}
        <div className="text-sm text-gray-700">{children}</div>
      </div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
