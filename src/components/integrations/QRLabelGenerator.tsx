import React, { useState, useRef } from 'react';

// Use environment variable for API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://clamflow-backend-production.up.railway.app';

interface QRLabelGeneratorProps {
  authToken?: string;
  onGenerate?: (labelData: LabelData) => void;
}

interface LabelData {
  lot_id: string;
  lot_number: string;
  product_type: string;
  weight: number;
  grade: string;
  production_date: string;
  expiry_date: string;
  qr_code_data: string;
}

interface LabelTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  elements: LabelElement[];
}

interface LabelElement {
  type: 'text' | 'qr_code' | 'logo' | 'barcode';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content: string;
  fontSize?: number;
  fontWeight?: string;
  alignment?: string;
}

const QRLabelGenerator: React.FC<QRLabelGeneratorProps> = ({ 
  authToken, 
  onGenerate 
}) => {
  const [labelData, setLabelData] = useState<Partial<LabelData>>({
    lot_number: '',
    product_type: '',
    weight: 0,
    grade: '',
    production_date: new Date().toISOString().split('T')[0],
    expiry_date: ''
  });

  const [selectedTemplate, setSelectedTemplate] = useState<string>('standard');
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLabel, setGeneratedLabel] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Available label templates
  const labelTemplates: LabelTemplate[] = [
    {
      id: 'standard',
      name: 'Standard Product Label',
      width: 400,
      height: 300,
      elements: [
        { type: 'text', x: 20, y: 30, content: '{lot_number}', fontSize: 16, fontWeight: 'bold' },
        { type: 'text', x: 20, y: 60, content: '{product_type}', fontSize: 14 },
        { type: 'text', x: 20, y: 90, content: 'Weight: {weight}kg', fontSize: 12 },
        { type: 'text', x: 20, y: 120, content: 'Grade: {grade}', fontSize: 12 },
        { type: 'text', x: 20, y: 150, content: 'Production: {production_date}', fontSize: 10 },
        { type: 'text', x: 20, y: 170, content: 'Expiry: {expiry_date}', fontSize: 10 },
        { type: 'qr_code', x: 250, y: 50, width: 120, height: 120, content: '{qr_code_data}' }
      ]
    },
    {
      id: 'compact',
      name: 'Compact Label',
      width: 300,
      height: 200,
      elements: [
        { type: 'text', x: 10, y: 25, content: '{lot_number}', fontSize: 14, fontWeight: 'bold' },
        { type: 'text', x: 10, y: 50, content: '{product_type}', fontSize: 12 },
        { type: 'text', x: 10, y: 75, content: '{weight}kg | {grade}', fontSize: 10 },
        { type: 'qr_code', x: 180, y: 30, width: 100, height: 100, content: '{qr_code_data}' }
      ]
    },
    {
      id: 'detailed',
      name: 'Detailed Export Label',
      width: 500,
      height: 350,
      elements: [
        { type: 'text', x: 20, y: 30, content: 'ClamFlow Processing', fontSize: 18, fontWeight: 'bold' },
        { type: 'text', x: 20, y: 60, content: 'Lot: {lot_number}', fontSize: 16, fontWeight: 'bold' },
        { type: 'text', x: 20, y: 90, content: 'Product: {product_type}', fontSize: 14 },
        { type: 'text', x: 20, y: 120, content: 'Net Weight: {weight} kg', fontSize: 14 },
        { type: 'text', x: 20, y: 150, content: 'Grade: {grade}', fontSize: 14 },
        { type: 'text', x: 20, y: 180, content: 'Production Date: {production_date}', fontSize: 12 },
        { type: 'text', x: 20, y: 210, content: 'Best Before: {expiry_date}', fontSize: 12 },
        { type: 'text', x: 20, y: 240, content: 'Processed under HACCP standards', fontSize: 10 },
        { type: 'qr_code', x: 320, y: 80, width: 150, height: 150, content: '{qr_code_data}' }
      ]
    }
  ];

  const handleInputChange = (field: keyof LabelData, value: string | number) => {
    setLabelData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateQRCodeData = () => {
    const qrData = {
      lot_number: labelData.lot_number,
      product_type: labelData.product_type,
      weight: labelData.weight,
      grade: labelData.grade,
      production_date: labelData.production_date,
      expiry_date: labelData.expiry_date,
      generated_at: new Date().toISOString()
    };
    
    const qrString = JSON.stringify(qrData);
    setQrCodeData(qrString);
    setLabelData(prev => ({ ...prev, qr_code_data: qrString }));
    return qrString;
  };

  const drawLabelOnCanvas = (template: LabelTemplate, data: Partial<LabelData>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = template.width;
    canvas.height = template.height;

    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, template.width, template.height);

    // Draw border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, template.width, template.height);

    // Draw elements
    template.elements.forEach(element => {
      let content = element.content;
      
      // Replace placeholders with actual data
      Object.entries(data).forEach(([key, value]) => {
        content = content.replace(`{${key}}`, String(value || ''));
      });

      switch (element.type) {
        case 'text':
          ctx.fillStyle = '#000';
          ctx.font = `${element.fontWeight || 'normal'} ${element.fontSize || 12}px Arial`;
          ctx.textAlign = (element.alignment as CanvasTextAlign) || 'left';
          ctx.fillText(content, element.x, element.y);
          break;

        case 'qr_code':
          // Simplified QR code representation (in real implementation, use a QR library)
          if (content && content !== '{qr_code_data}') {
            ctx.fillStyle = '#000';
            ctx.fillRect(element.x, element.y, element.width || 100, element.height || 100);
            
            // Add some white squares to simulate QR pattern
            ctx.fillStyle = '#fff';
            for (let i = 0; i < 10; i++) {
              for (let j = 0; j < 10; j++) {
                if (Math.random() > 0.5) {
                  ctx.fillRect(
                    element.x + i * ((element.width || 100) / 10),
                    element.y + j * ((element.height || 100) / 10),
                    (element.width || 100) / 10,
                    (element.height || 100) / 10
                  );
                }
              }
            }
            
            // Add QR positioning squares
            ctx.fillStyle = '#000';
            const cornerSize = (element.width || 100) / 7;
            // Top-left corner
            ctx.fillRect(element.x, element.y, cornerSize, cornerSize);
            // Top-right corner
            ctx.fillRect(element.x + (element.width || 100) - cornerSize, element.y, cornerSize, cornerSize);
            // Bottom-left corner
            ctx.fillRect(element.x, element.y + (element.height || 100) - cornerSize, cornerSize, cornerSize);
          }
          break;
      }
    });
  };

  const generateLabel = async () => {
    if (!labelData.lot_number || !labelData.product_type) {
      alert('Please fill in required fields (Lot Number and Product Type)');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Generate QR Code data if not already generated
      const qrData = qrCodeData || generateQRCodeData();
      
      const completeData: LabelData = {
        ...labelData,
        qr_code_data: qrData
      } as LabelData;

      // Draw label on canvas
      const template = labelTemplates.find(t => t.id === selectedTemplate);
      if (template) {
        drawLabelOnCanvas(template, completeData);
      }

      // Send to backend for printing
      const response = await fetch(`${API_BASE_URL}/hardware/print-label`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          label_data: completeData,
          template_id: selectedTemplate,
          print_immediately: false // Set to true for immediate printing
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Generate downloadable image
        const canvas = canvasRef.current;
        if (canvas) {
          const dataUrl = canvas.toDataURL('image/png');
          setGeneratedLabel(dataUrl);
        }

        if (onGenerate) {
          onGenerate(completeData);
        }

        alert('Label generated successfully!');
      } else {
        const error = await response.json();
        alert(`Error generating label: ${error.detail}`);
      }
    } catch (error) {
      console.error('Label generation error:', error);
      alert('Failed to generate label');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadLabel = () => {
    if (!generatedLabel) return;

    const link = document.createElement('a');
    link.download = `label-${labelData.lot_number}-${Date.now()}.png`;
    link.href = generatedLabel;
    link.click();
  };

  const printLabel = async () => {
    if (!generatedLabel) {
      alert('Please generate a label first');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/hardware/print-label`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          label_data: labelData,
          template_id: selectedTemplate,
          print_immediately: true
        })
      });

      if (response.ok) {
        alert('Label sent to printer successfully!');
      } else {
        const error = await response.json();
        alert(`Printing error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Printing error:', error);
      alert('Failed to send label to printer');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">QR Label Generator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Label Information</h2>
          
          <div className="space-y-4">
            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Label Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {labelTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.width}x{template.height})
                  </option>
                ))}
              </select>
            </div>

            {/* Lot Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lot Number *
              </label>
              <input
                type="text"
                value={labelData.lot_number || ''}
                onChange={(e) => handleInputChange('lot_number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter lot number"
              />
            </div>

            {/* Product Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Type *
              </label>
              <select
                value={labelData.product_type || ''}
                onChange={(e) => handleInputChange('product_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Product Type</option>
                <option value="Fresh Clam">Fresh Clam</option>
                <option value="Frozen Clam">Frozen Clam</option>
                <option value="Processed Clam">Processed Clam</option>
                <option value="Premium Clam">Premium Clam</option>
                <option value="Export Grade Clam">Export Grade Clam</option>
              </select>
            </div>

            {/* Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={labelData.weight || ''}
                onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter weight"
              />
            </div>

            {/* Grade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade
              </label>
              <select
                value={labelData.grade || ''}
                onChange={(e) => handleInputChange('grade', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Grade</option>
                <option value="A+">A+</option>
                <option value="A">A</option>
                <option value="B+">B+</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>

            {/* Production Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Production Date
              </label>
              <input
                type="date"
                value={labelData.production_date || ''}
                onChange={(e) => handleInputChange('production_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="date"
                value={labelData.expiry_date || ''}
                onChange={(e) => handleInputChange('expiry_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* QR Code Data */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QR Code Data
              </label>
              <textarea
                value={qrCodeData}
                onChange={(e) => setQrCodeData(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="QR code data will be auto-generated"
                readOnly
              />
              <button
                type="button"
                onClick={generateQRCodeData}
                className="mt-2 px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Generate QR Data
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            <button
              onClick={generateLabel}
              disabled={isGenerating}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Generate Label'}
            </button>

            {generatedLabel && (
              <>
                <button
                  onClick={downloadLabel}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                >
                  Download Label
                </button>
                <button
                  onClick={printLabel}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700"
                >
                  Print Label
                </button>
              </>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Label Preview</h2>
          
          <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto border border-gray-400 bg-white"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </div>

          {/* Template Info */}
          {selectedTemplate && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <h3 className="font-medium text-gray-800">Template Details</h3>
              {(() => {
                const template = labelTemplates.find(t => t.id === selectedTemplate);
                return template ? (
                  <div className="text-sm text-gray-600 mt-2">
                    <p><strong>Name:</strong> {template.name}</p>
                    <p><strong>Size:</strong> {template.width} x {template.height} pixels</p>
                    <p><strong>Elements:</strong> {template.elements.length} components</p>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRLabelGenerator;