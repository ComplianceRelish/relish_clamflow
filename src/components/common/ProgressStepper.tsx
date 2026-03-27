import { Check } from "lucide-react";

interface Step {
  label: string;
  description?: string;
  status: "completed" | "active" | "pending";
}

interface ProgressStepperProps {
  steps: Step[];
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function ProgressStepper({
  steps,
  orientation = "horizontal",
  className = "",
}: ProgressStepperProps) {
  if (orientation === "vertical") {
    return (
      <div className={`space-y-0 ${className}`}>
        {steps.map((step, index) => (
          <div key={index} className="flex gap-3">
            <div className="flex flex-col items-center">
              <StepIndicator status={step.status} index={index} />
              {index < steps.length - 1 && (
                <div
                  className={`w-0.5 flex-1 min-h-[24px] ${
                    step.status === "completed" ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
            <div className="pb-6">
              <p
                className={`text-sm font-medium ${
                  step.status === "active"
                    ? "text-blue-700"
                    : step.status === "completed"
                    ? "text-green-700"
                    : "text-gray-500"
                }`}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <StepIndicator status={step.status} index={index} />
            <p
              className={`text-xs font-medium text-center max-w-[80px] ${
                step.status === "active"
                  ? "text-blue-700"
                  : step.status === "completed"
                  ? "text-green-700"
                  : "text-gray-500"
              }`}
            >
              {step.label}
            </p>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2 mt-[-16px] ${
                step.status === "completed" ? "bg-green-500" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function StepIndicator({ status, index }: { status: Step["status"]; index: number }) {
  if (status === "completed") {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white">
        <Check className="h-4 w-4" />
      </div>
    );
  }

  if (status === "active") {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold ring-4 ring-blue-100">
        {index + 1}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-500 text-xs font-bold">
      {index + 1}
    </div>
  );
}
