import { useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Alert, AlertDescription } from "../ui/Alert";
import { Scan, Wifi, WifiOff, CheckCircle, AlertCircle, Package } from "lucide-react";

interface RFIDTag {
  id: string;
  tag_id: string;
  lot_id: string;
  box_number: string;
  product_type: string;
  grade: string;
  weight: number;
  linked_at: string;
  status: 'active' | 'linked' | 'archived';
}

interface RFIDScannerProps {
  lotId: string;
  boxNumber: string;
  productType: string;
  grade: string;
  weight: number;
  onRFIDLinked: (rfidData: RFIDTag) => void;
  onClose: () => void;
}

export function RFIDScanner({ 
  lotId, 
  boxNumber, 
  productType, 
  grade, 
  weight, 
  onRFIDLinked, 
  onClose 
}: RFIDScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [rfidConnected, setRfidConnected] = useState(true); // Simulate RFID reader connection
  const [scannedTag, setScannedTag] = useState<string>("");
  const [manualTag, setManualTag] = useState<string>("");
  const [linkedTag, setLinkedTag] = useState<RFIDTag | null>(null);
  const [scanError, setScanError] = useState<string>("");

  // Simulate RFID scanning
  const simulateRFIDScan = () => {
    setIsScanning(true);
    setScanError("");
    
    // Simulate scan delay
    setTimeout(() => {
      const mockRFIDTag = `RFID${Date.now().toString().slice(-8)}`;
      setScannedTag(mockRFIDTag);
      setIsScanning(false);
      
      // Auto-link after successful scan
      linkRFIDToProduct(mockRFIDTag);
    }, 2000);
  };

  const linkRFIDToProduct = (tagId: string) => {
    if (!tagId) {
      setScanError("No RFID tag detected");
      return;
    }

    // Create RFID tag data structure
    const rfidData: RFIDTag = {
      id: `rfid_${Date.now()}`,
      tag_id: tagId,
      lot_id: lotId,
      box_number: boxNumber,
      product_type: productType,
      grade: grade,
      weight: weight,
      linked_at: new Date().toISOString(),
      status: 'linked'
    };

    setLinkedTag(rfidData);
    
    // Simulate API call to link RFID tag
    console.log("Linking RFID tag to product:", rfidData);
    
    // Call parent callback
    onRFIDLinked(rfidData);
  };

  const handleManualLink = () => {
    if (manualTag.trim()) {
      linkRFIDToProduct(manualTag.trim());
      setManualTag("");
    }
  };

  const resetScanner = () => {
    setScannedTag("");
    setLinkedTag(null);
    setScanError("");
    setManualTag("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            RFID Box Tagging - PPC Station
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Link RFID tag to lot-tracked product box
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Product Information */}
          <div className="bg-muted p-3 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Lot ID:</span>
              <span>{lotId}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Box:</span>
              <span>{boxNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Product:</span>
              <span>{productType} - Grade {grade}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Weight:</span>
              <span>{weight} kg</span>
            </div>
          </div>

          {/* RFID Reader Status */}
          <div className="flex items-center gap-2">
            {rfidConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">RFID Reader Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-600">RFID Reader Disconnected</span>
              </>
            )}
          </div>

          {/* Success State */}
          {linkedTag && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium text-green-800">RFID Tag Successfully Linked!</div>
                  <div className="text-sm text-green-700">
                    Tag ID: <Badge variant="secondary">{linkedTag.tag_id}</Badge>
                  </div>
                  <div className="text-sm text-green-700">
                    Box is now ready for tracking through the supply chain.
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Error State */}
          {scanError && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{scanError}</AlertDescription>
            </Alert>
          )}

          {/* RFID Scanning Section */}
          {!linkedTag && (
            <div className="space-y-3">
              <div className="text-center">
                <Button 
                  onClick={simulateRFIDScan}
                  disabled={isScanning || !rfidConnected}
                  className="w-full"
                  size="lg"
                >
                  {isScanning ? (
                    <>
                      <Scan className="w-4 h-4 mr-2 animate-spin" />
                      Scanning for RFID Tag...
                    </>
                  ) : (
                    <>
                      <Scan className="w-4 h-4 mr-2" />
                      Scan RFID Tag
                    </>
                  )}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or enter manually
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Enter RFID tag manually"
                  value={manualTag}
                  onChange={(e) => setManualTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualLink()}
                />
                <Button 
                  onClick={handleManualLink}
                  disabled={!manualTag.trim()}
                  variant="outline"
                >
                  Link
                </Button>
              </div>

              {scannedTag && !linkedTag && (
                <div className="text-sm text-center text-muted-foreground">
                  Scanned Tag: <Badge variant="outline">{scannedTag}</Badge>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {linkedTag ? (
              <>
                <Button onClick={onClose} className="flex-1">
                  Complete Tagging
                </Button>
                <Button onClick={resetScanner} variant="outline">
                  Tag Another Box
                </Button>
              </>
            ) : (
              <>
                <Button onClick={onClose} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </>
            )}
          </div>

          {/* Integration Notes */}
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            <strong>Integration Notes:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Connect to physical RFID reader via USB/Serial</li>
              <li>• Use libraries like 'serialport' for hardware integration</li>
              <li>• Store RFID-Product mapping in database</li>
              <li>• Enable real-time supply chain tracking</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}