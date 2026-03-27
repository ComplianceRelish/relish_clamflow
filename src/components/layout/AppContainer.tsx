import { ReactNode } from "react";

interface AppContainerProps {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  className?: string;
  background?: "gray" | "white";
  noPadding?: boolean;
}

export function AppContainer({
  children,
  maxWidth = "xl",
  className = "",
  background = "gray",
  noPadding = false,
}: AppContainerProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full",
  };

  const backgroundClasses = {
    gray: "bg-gray-50",
    white: "bg-white",
  };

  return (
    <div
      className={`min-h-screen ${backgroundClasses[background]} ${className}`}
    >
      <div
        className={`w-full ${maxWidthClasses[maxWidth]} mx-auto ${
          noPadding ? "" : "p-4 sm:p-6"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
