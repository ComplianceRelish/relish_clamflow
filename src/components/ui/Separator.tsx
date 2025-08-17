import React from 'react';

const Separator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    orientation?: 'horizontal' | 'vertical';
  }
>(({ className = '', orientation = 'horizontal', ...props }, ref) => {
  const orientationClasses = orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]';
  return (
    <div
      ref={ref}
      className={`shrink-0 bg-gray-300 ${orientationClasses} ${className}`.trim()}
      {...props}
    />
  );
});
Separator.displayName = 'Separator';

export { Separator };