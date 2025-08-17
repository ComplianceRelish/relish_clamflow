import { useState } from "react";
import { GaugeCard } from "../ui/GaugeCard";

interface ThresholdConfig {
  acceptable: number;
  caution: number;
  alert: number;
}

interface YieldData {
  title: string;
  value: number;
  hasDropdown?: boolean;
  selectedLot?: string;
  minValue?: number;
  maxValue?: number;
  thresholds?: ThresholdConfig;
}

interface ClamYieldDashboardProps {
  data?: YieldData[];
  onGaugeClick?: (index: number) => void;
  globalThresholds?: ThresholdConfig;
}

export function ClamYieldDashboard({ 
  data, 
  onGaugeClick, 
  globalThresholds = { acceptable: 80, caution: 60, alert: 40 }
}: ClamYieldDashboardProps) {
  // State for dropdown selections
  const [wholeClamLot, setWholeClamLot] = useState("Last 5 Lots");
  const [clamMeatLot, setClamMeatLot] = useState("Last 5 Lots");
  
  // Default data with configurable thresholds
  const defaultData: YieldData[] = [
    {
      title: "Last Lot - Whole Clam",
      value: 72,
      hasDropdown: false,
      minValue: 0,
      maxValue: 100,
      thresholds: globalThresholds
    },
    {
      title: "Last Lot - Clam Meat",
      value: 81,
      hasDropdown: false,
      minValue: 0,
      maxValue: 100,
      thresholds: globalThresholds
    },
    {
      title: "Avg. Whole Clam",
      value: 69,
      hasDropdown: true,
      selectedLot: wholeClamLot,
      minValue: 0,
      maxValue: 100,
      thresholds: globalThresholds
    },
    {
      title: "Avg. Clam Meat",
      value: 85,
      hasDropdown: true,
      selectedLot: clamMeatLot,
      minValue: 0,
      maxValue: 100,
      thresholds: globalThresholds
    }
  ];

  const yieldData = data || defaultData;

  const handleLotChange = (index: number, lot: string) => {
    if (index === 2) {
      setWholeClamLot(lot);
    } else if (index === 3) {
      setClamMeatLot(lot);
    }
  };

  const handleGaugeClick = (index: number) => {
    if (onGaugeClick) {
      onGaugeClick(index);
    }
    console.log(`Clicked gauge ${index + 1}`);
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-gray-50 min-h-screen p-4">
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-200">
        {/* Clean management dashboard heading */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-800">
            Production Yields
          </h1>
          <div className="w-16 h-1 bg-gray-300 rounded-full mx-auto mt-2"></div>
        </div>
        
        {/* 2x2 Grid */}
        <div className="grid grid-cols-2 gap-4">
          {yieldData.map((item, index) => (
            <GaugeCard
              key={index}
              title={item.title}
              value={item.value}
              hasDropdown={item.hasDropdown}
              selectedLot={item.hasDropdown ? (index === 2 ? wholeClamLot : clamMeatLot) : undefined}
              onLotChange={item.hasDropdown ? (lot) => handleLotChange(index, lot) : undefined}
              onGaugeClick={() => handleGaugeClick(index)}
              minValue={item.minValue}
              maxValue={item.maxValue}
              thresholds={item.thresholds || globalThresholds}
            />
          ))}
        </div>
      </div>
    </div>
  );
}