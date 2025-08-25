// src/pages/rfid/inventory.tsx - CORRECTED VERSION
import RFIDHardwareManager from '@/components/integrations/RFIDHardwareManager';
import type { RFIDScanResult } from '@/types'; // Import from types

export default function InventoryRFIDPage() {
  const handleScanResult = (result: RFIDScanResult) => {
    console.log('RFID scan result:', result);
    // Process individual scan result
  };

  const handleBatchComplete = (results: RFIDScanResult[]) => {
    console.log('Batch scan complete:', results);
    // Process batch results
  };

  return (
    <div className="container mx-auto p-6">
      <RFIDHardwareManager
        mode="inventory"
        onScanResult={handleScanResult}
        onBatchComplete={handleBatchComplete}
      />
    </div>
  );
}