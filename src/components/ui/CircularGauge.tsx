interface ThresholdConfig {
  acceptable: number; // Green threshold
  caution: number;    // Amber threshold 
  alert: number;      // Red threshold (below this is red)
}

interface CircularGaugeProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  minValue?: number;
  maxValue?: number;
  onButtonClick?: () => void;
  thresholds?: ThresholdConfig;
}

export function CircularGauge({ 
  value, 
  size = 100, 
  strokeWidth = 8,
  minValue = 0,
  maxValue = 100,
  onButtonClick,
  thresholds = { acceptable: 80, caution: 60, alert: 40 }
}: CircularGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  
  // Calculate progress (value between 0 and 1)
  const progress = Math.min(Math.max((value - minValue) / (maxValue - minValue), 0), 1);
  
  // Calculate stroke dash offset for the progress arc
  const strokeDashoffset = circumference - (progress * circumference);
  
  // Standard traffic light color system based on configurable thresholds
  const getColor = (val: number) => {
    if (val >= thresholds.acceptable) return "#22C55E"; // Green - Acceptable
    if (val >= thresholds.caution) return "#F59E0B";    // Amber - Caution
    return "#EF4444";                                   // Red - Alert/Below acceptable
  };

  // Get status label based on thresholds
  const getStatus = (val: number) => {
    if (val >= thresholds.acceptable) return "Good";
    if (val >= thresholds.caution) return "Caution";
    return "Alert";
  };

  const progressColor = getColor(value);
  const status = getStatus(value);
  const statusColor = progressColor;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress arc - represents actual percentage */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      
      {/* Center button with percentage display */}
      <button 
        onClick={onButtonClick}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-200 hover:shadow-xl hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        style={{ 
          width: size - (strokeWidth * 2 + 20), 
          height: size - (strokeWidth * 2 + 20) 
        }}
      >
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">
            {value}%
          </div>
          <div className="text-xs font-medium mt-1" style={{ color: statusColor }}>
            {status}
          </div>
        </div>
      </button>
    </div>
  );
}

export default CircularGauge;