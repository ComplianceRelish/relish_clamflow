import { useState, useRef } from "react";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Alert, AlertDescription } from "../ui/Alert";
import { Separator } from "../ui/Separator";
import { QrCode, Printer, Download, Package, CheckCircle, Copy } from "lucide-react";

interface QRLabelData {
  id: string;
  lot_id: string;
  box_number: string;
  product_type: string;
  grade: string;
  weight: number;
  rfid_tag_id?: string;
  qr_code: string;
  generated_at: string;
  generated_by: string;
  status: 'generated' | 'printed' | 'applied';
}

interface QRLabelGeneratorProps {
  lotId: string;
  boxNumber: string;
  productType: string;
  grade: string;
  weight: number;
  rfidTagId?: string;
  staffId: string;
  onLabelGenerated: (labelData: QRLabelData) => void;
  onClose: () => void;
  originalBoxNumber?: string;
}

export function QRLabelGenerator({ 
  lotId, 
  boxNumber, 
  productType, 
  grade, 
  weight, 
  rfidTagId,
  staffId,
  onLabelGenerated, 
  onClose,
  originalBoxNumber
}: QRLabelGeneratorProps) {
  const [generatedLabel, setGeneratedLabel] = useState<QRLabelData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);

  // Generate QR code data string
  const generateQRData = (): string => {
    const qrData = {
      type: "clam_product",
      lot_id: lotId,
      box_number: boxNumber,
      product_type: productType,
      grade: grade,
      weight: weight,
      rfid_tag_id: rfidTagId,
      generated_at: new Date().toISOString(),
      generated_by: staffId
    };
    
    return JSON.stringify(qrData);
  };

  // Simulate QR code generation (in real implementation, use a QR library like 'qrcode')
  const generateQRCode = async () => {
    setIsGenerating(true);
    
    // Simulate QR generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const qrCodeData = generateQRData();
    
    // In real implementation, you would use a library like 'qrcode':
    // import QRCode from 'qrcode';
    // const qrCodeDataURL = await QRCode.toDataURL(qrCodeData);
    
    // For demo, create a placeholder QR code
    const placeholderQR = createPlaceholderQR(qrCodeData);
    setQrCodeDataURL(placeholderQR);
    
    const labelData: QRLabelData = {
      id: `qr_label_${Date.now()}`,
      lot_id: lotId,
      box_number: boxNumber,
      product_type: productType,
      grade: grade,
      weight: weight,
      rfid_tag_id: rfidTagId,
      qr_code: qrCodeData,
      generated_at: new Date().toISOString(),
      generated_by: staffId,
      status: 'generated'
    };
    
    setGeneratedLabel(labelData);
    setIsGenerating(false);
    
    console.log("Generated QR Label:", labelData);
    onLabelGenerated(labelData);
  };

  // Create placeholder QR code (replace with actual QR library)
  const createPlaceholderQR = (data: string): string => {
    // This creates a simple SVG placeholder - replace with actual QR generation
    const size = 200;
    const squares = [];
    
    // Generate random pattern for demonstration
    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 25; j++) {
        if (Math.random() > 0.5) {
          squares.push(`<rect x="${i * 8}" y="${j * 8}" width="8" height="8" fill="black"/>`);
        }
      }
    }
    
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="white"/>
        ${squares.join('')}
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  // Handle printing
  const handlePrint = () => {
    setIsPrinting(true);
    
    // Simulate printing delay
    setTimeout(() => {
      if (generatedLabel) {
        const updatedLabel = {
          ...generatedLabel,
          status: 'printed' as const
        };
        setGeneratedLabel(updatedLabel);
        console.log("Label printed:", updatedLabel);
      }
      setIsPrinting(false);
    }, 2000);
  };

  // Copy QR data to clipboard
  const copyQRData = () => {
    if (generatedLabel) {
      navigator.clipboard.writeText(generatedLabel.qr_code);
    }
  };

  // Download label as image
  const downloadLabel = () => {
    if (printRef.current) {
      // In real implementation, convert the label to image and download
      console.log("Downloading label as image");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Label Generator - FP Station
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Generate lot-tracked QR coded box labels
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
            {rfidTagId && (
              <div className="flex justify-between">
                <span className="font-medium">RFID Tag:</span>
                <Badge variant="secondary">{rfidTagId}</Badge>
              </div>
            )}
          </div>

          {/* Generation Section */}
          {!generatedLabel ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Ready to generate QR coded label for final packaging
              </p>
              <Button 
                onClick={generateQRCode}
                disabled={isGenerating}
                size="lg"
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <QrCode className="w-4 h-4 mr-2 animate-spin" />
                    Generating QR Code...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 mr-2" />
                    Generate QR Label
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              {/* Success Alert */}
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription>
                  <div className="text-green-800">
                    QR Label successfully generated! Ready for printing and application.
                  </div>
                </AlertDescription>
              </Alert>

              {/* Label Preview */}
              <div ref={printRef} className="border-2 border-dashed border-gray-300 p-4 bg-white">
                <div className="text-center space-y-3">
                  {/* QR Code */}
                  <div className="flex justify-center">
                    <img 
                      src={qrCodeDataURL} 
                      alt="QR Code" 
                      className="w-32 h-32 border"
                    />
                  </div>
                  
                  {/* Label Text */}
                  <div className="space-y-1 text-sm">
                    <div className="font-bold">RELISH CLAMS</div>
                    <div>Lot: {lotId}</div>
                    <div>Box: {boxNumber}</div>
                    <div>{productType} - Grade {grade}</div>
                    <div>Weight: {weight} kg</div>
                    <div className="text-xs text-gray-600">
                      {new Date(generatedLabel.generated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Label Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={handlePrint}
                  disabled={isPrinting}
                  variant="default"
                >
                  {isPrinting ? (
                    <>
                      <Printer className="w-4 h-4 mr-2 animate-pulse" />
                      Printing...
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4 mr-2" />
                      Print Label
                    </>
                  )}
                </Button>
                
                <Button onClick={downloadLabel} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>

              {/* QR Data */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">QR Code Data:</span>
                  <Button onClick={copyQRData} size="sm" variant="ghost">
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="text-xs bg-muted p-2 rounded font-mono break-all">
                  {generatedLabel.qr_code}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm">Status:</span>
                <Badge variant={generatedLabel.status === 'printed' ? 'default' : 'secondary'}>
                  {generatedLabel.status.charAt(0).toUpperCase() + generatedLabel.status.slice(1)}
                </Badge>
              </div>
            </>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              {generatedLabel?.status === 'printed' ? 'Complete' : 'Cancel'}
            </Button>
            {generatedLabel?.status === 'printed' && (
              <Button 
                onClick={() => {
                  setGeneratedLabel(null);
                  setQrCodeDataURL("");
                }}
                variant="secondary"
              >
                Generate Another
              </Button>
            )}
          </div>

          {/* Integration Notes */}
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            <strong>Integration Libraries:</strong>
            <ul className="mt-1 space-y-1">
              <li>• QR Generation: <code>npm install qrcode @types/qrcode</code></li>
              <li>• Label Printing: <code>npm install react-to-print</code></li>
              <li>• Thermal Printer: Brother, Zebra, or DYMO APIs</li>
              <li>• Inventory Integration: Update product database with QR data</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}