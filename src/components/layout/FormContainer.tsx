import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

interface FormContainerProps {
  title?: string;
  description?: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function FormContainer({
  title,
  description,
  children,
  icon,
  className = "",
  noPadding = false,
}: FormContainerProps) {
  return (
    <Card className={`shadow-lg border-gray-200 ${className}`}>
      {(title || description || icon) && (
        <CardHeader className="space-y-2 pb-6">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-lg">
                {icon}
              </div>
            )}
            <div className="flex-1">
              {title && (
                <CardTitle className="text-xl font-bold text-gray-900">
                  {title}
                </CardTitle>
              )}
              {description && (
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className={noPadding ? "p-0" : ""}>{children}</CardContent>
    </Card>
  );
}
