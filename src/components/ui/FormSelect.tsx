import React from 'react';
import { Select, SelectProps } from './Select';
import { Label } from './Label';

interface FormSelectProps extends Omit<SelectProps, 'children'> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <Label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </Label>
        <Select
          ref={ref}
          id={id}
          className={`${className || ''} ${error ? 'border-red-500' : ''}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';
