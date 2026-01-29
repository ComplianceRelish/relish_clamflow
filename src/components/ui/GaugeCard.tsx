import { CircularGauge } from "./CircularGauge";
import { ChevronDown } from "lucide-react";

interface ThresholdConfig {
  acceptable: number;
  caution: number;
  alert: number;
}

interface GaugeCardProps {
  title: string;
  value: number;
  hasDropdown?: boolean;
  selectedLot?: string;
  onLotChange?: (lot: string) => void;
  onGaugeClick?: () => void;
  minValue?: number;
  maxValue?: number;
  thresholds?: ThresholdConfig;
}

export function GaugeCard({ 
  title, 
  value, 
  hasDropdown = false,
  selectedLot = "Last 5 Lots",
  onLotChange,
  onGaugeClick,
  minValue = 0,
  maxValue = 100,
  thresholds = { acceptable: 80, caution: 60, alert: 40 }
}: GaugeCardProps) {
  const lotOptions = [
    "Last 5 Lots",
    "Last 10 Lots", 
    "Last 20 Lots",
    "All Lots"
  ];

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 hover:border-gray-300 transition-colors duration-200 flex flex-col items-center space-y-3 w-full h-[200px]">
      {/* Title with optional dropdown */}
      <div className="text-center w-full">
        <h3 className="text-xs font-semibold text-gray-700 leading-tight mb-2">
          {title}
        </h3>
        
        {hasDropdown && (
          <div className="relative">
            <select
              value={selectedLot}
              onChange={(e) => onLotChange?.(e.target.value)}
              className="w-full h-7 text-xs border border-gray-300 bg-gray-50 hover:bg-gray-100 focus:ring-blue-500 rounded-md px-2 pr-6 appearance-none cursor-pointer"
            >
              {lotOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-600 pointer-events-none" />
          </div>
        )}
      </div>
      
      {/* Gauge */}
      <div className="flex-1 flex items-center justify-center">
        <CircularGauge 
          value={value} 
          size={90} 
          strokeWidth={8}
          minValue={minValue}
          maxValue={maxValue}
          onButtonClick={onGaugeClick}
          thresholds={thresholds}
        />
      </div>
      
      {/* Value range indicator */}
      <div className="flex justify-between w-full text-xs text-gray-500 px-2">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
}