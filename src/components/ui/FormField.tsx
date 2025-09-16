// src/components/ui/FormField.tsx - FINAL CORRECTED VERSION
import * as React from 'react'
import { Input } from './Input'
import { Label } from './Label'
import { cn } from '@/lib/utils'

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  placeholder?: string
  required?: boolean
  className?: string
  error?: string
  helpText?: string
  disabled?: boolean
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ 
    label, 
    value, 
    onChange, 
    type = "text", 
    placeholder = "", 
    required = false, 
    className = "", 
    error,
    helpText,
    disabled = false,
    ...props 
  }, ref) => {
    const id = React.useMemo(() => 
      label.toLowerCase().replace(/\s+/g, '-'), 
      [label]
    )

    return (
      <div className={cn("grid gap-2", className)}>
        <div className="flex items-baseline justify-between">
          <Label htmlFor={id} className={disabled ? "text-muted-foreground" : ""}>
            {label} {required && <span className="text-red-600 ml-1">*</span>}
          </Label>
          {helpText && (
            <p className="text-xs text-muted-foreground">{helpText}</p>
          )}
        </div>
        
        <Input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          disabled={disabled}
          {...props}
        />
        
        {error ? (
          <p 
            id={`${id}-error`}
            className="text-sm text-red-600 mt-1 animate-in fade-in duration-300"
            role="alert"
          >
            {error}
          </p>
        ) : helpText ? null : (
          <div className="h-5" /> // Spacer to prevent layout shift
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'

export { FormField }