import { ReactNode } from "react";
import { Separator } from "../ui/Separator";

interface FormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  icon?: ReactNode;
  required?: boolean;
  className?: string;
  showDivider?: boolean;
}

export function FormSection({
  title,
  description,
  children,
  icon,
  required = false,
  className = "",
  showDivider = true,
}: FormSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {(title || description) && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="text-blue-600 flex-shrink-0">{icon}</div>
            )}
            {title && (
              <h3 className="text-base font-semibold text-gray-900">
                {title}
                {required && <span className="text-red-500 ml-1">*</span>}
              </h3>
            )}
          </div>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
      )}
      
      <div className="space-y-4">{children}</div>
      
      {showDivider && <Separator className="my-6" />}
    </div>
  );
}
