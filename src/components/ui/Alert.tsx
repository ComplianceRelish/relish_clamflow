import React from 'react';

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'destructive';
  }
>(({ className = '', variant = 'default', ...props }, ref) => {
  const baseClasses = 'relative w-full rounded-lg border p-4';
  const variantClasses = {
    default: 'bg-white text-gray-900 border-gray-200',
    destructive: 'bg-red-50 text-red-900 border-red-200',
  };
  
  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`.trim();
  
  return (
    <div
      ref={ref}
      role="alert"
      className={combinedClasses}
      {...props}
    />
  );
});
Alert.displayName = 'Alert';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`text-sm ${className}`.trim()}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertDescription };