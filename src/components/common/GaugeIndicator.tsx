interface GaugeIndicatorProps {
  value: number;
  maxValue?: number;
  label?: string;
  unit?: string;
  size?: "sm" | "md" | "lg";
  thresholds?: { green: number; amber: number };
  className?: string;
}

export function GaugeIndicator({
  value,
  maxValue = 100,
  label,
  unit = "%",
  size = "md",
  thresholds = { green: 70, amber: 40 },
  className = "",
}: GaugeIndicatorProps) {
  const percentage = Math.min(Math.max((value / maxValue) * 100, 0), 100);

  const getColor = () => {
    if (percentage >= thresholds.green) return { stroke: "#22c55e", text: "text-green-600", bg: "bg-green-50" };
    if (percentage >= thresholds.amber) return { stroke: "#f59e0b", text: "text-amber-600", bg: "bg-amber-50" };
    return { stroke: "#ef4444", text: "text-red-600", bg: "bg-red-50" };
  };

  const color = getColor();

  const sizeMap = {
    sm: { container: "w-20 h-20", text: "text-lg", label: "text-xs", strokeWidth: 6 },
    md: { container: "w-32 h-32", text: "text-2xl", label: "text-sm", strokeWidth: 8 },
    lg: { container: "w-44 h-44", text: "text-4xl", label: "text-base", strokeWidth: 10 },
  };

  const s = sizeMap[size];
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className={`relative ${s.container}`}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={s.strokeWidth}
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth={s.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${s.text} font-bold ${color.text}`}>
            {Math.round(value)}
          </span>
          {unit && (
            <span className={`${s.label} text-gray-500`}>{unit}</span>
          )}
        </div>
      </div>
      {label && (
        <span className={`${s.label} font-medium text-gray-700 text-center`}>
          {label}
        </span>
      )}
    </div>
  );
}
