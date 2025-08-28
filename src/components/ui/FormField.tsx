import React from 'react';
import { Input, InputProps } from './Input';
import { Label } from './Label';

interface FormFieldProps extends InputProps {
  label: string;
  error?: string;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <Label htmlFor={props.id} className="text-sm font-medium text-gray-700">
          {label}
        </Label>
        <Input
          ref={ref}
          className={`${className} ${error ? 'border-red-500' : ''}`}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';
