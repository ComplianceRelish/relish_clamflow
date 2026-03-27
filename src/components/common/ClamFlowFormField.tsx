import { ReactNode } from "react";
import { Label } from "../ui/Label";

interface ClamFlowFormFieldProps {
  label: string;
  children: ReactNode;
  required?: boolean;
  error?: string;
  hint?: string;
  htmlFor?: string;
  className?: string;
}

export function ClamFlowFormField({
  label,
  children,
  required = false,
  error,
  hint,
  htmlFor,
  className = "",
}: ClamFlowFormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label 
        htmlFor={htmlFor}
        className="text-sm font-medium text-gray-900"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      {children}
      
      {hint && !error && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}
      
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <span>⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}
