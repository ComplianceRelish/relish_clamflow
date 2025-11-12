import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps {
  value: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
  className?: string;
}

interface SelectTriggerProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  value?: string;
  isOpen?: boolean;
}

interface SelectContentProps {
  className?: string;
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  onClose?: () => void;
}

interface SelectItemProps {
  value: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  isSelected?: boolean;
}

interface SelectValueProps {
  className?: string;
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children, className = &quot;&quot; }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {React.Children.map(children, child => {
          if (React.isValidElement(child) && child.type === SelectTrigger) {
            return React.cloneElement(child, { 
              onClick: () => setIsOpen(!isOpen),
              value,
              onValueChange,
              isOpen 
            });
          }
          return child;
        })}
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1">
          {React.Children.map(children, child => {
            if (React.isValidElement(child) && child.type === SelectContent) {
              return React.cloneElement(child, { 
                value,
                onValueChange: (newValue: string) => {
                  onValueChange?.(newValue);
                  setIsOpen(false);
                },
                onClose: () => setIsOpen(false)
              });
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ 
  className = &quot;&quot;, 
  children, 
  onClick,
  value,
  isOpen 
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between ${className}`}
    >
      <span>{value}</span>
      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  );
};

export const SelectContent: React.FC<SelectContentProps> = ({ 
  className = &quot;&quot;, 
  children,
  value,
  onValueChange,
  onClose 
}) => {
  return (
    <div className={`bg-white border rounded-md shadow-lg ${className}`}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child) && child.type === SelectItem) {
          // ✅ FIXED: Properly type cast child.props
          const childProps = child.props as SelectItemProps;
          return React.cloneElement(child, {
            onClick: () => onValueChange?.(childProps.value),
            isSelected: value === childProps.value
          });
        }
        return child;
      })}
    </div>
  );
};

export const SelectItem: React.FC<SelectItemProps> = ({ 
  value,
  className = &quot;&quot;, 
  children,
  onClick,
  isSelected 
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

export const SelectValue: React.FC<SelectValueProps> = ({ className = &quot;&quot;, placeholder }) => {
  return <span className={className}>{placeholder}</span>;
};