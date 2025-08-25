import React, { useState, useEffect, useCallback } from 'react';

interface RFIDScannerProps {
  onScan?: (data: RFIDScanData) => void;
  authToken?: string;
  mode?: 'attendance' | 'gate-exit' | 'gate-entry' | 'box-tracking';
  currentUserRole?: string;
}

interface RFIDScanData {
  rfid_tag: string;
  box_number?: string;
  timestamp: string;
  scan_type: string;
}

interface RFIDScanResult {
  success: boolean;
  message: string;
  data?: any;
}

const RFIDScanner: React.FC<RFIDScannerProps> = ({ 
  onScan, 
  authToken, 
  mode = 'box-tracking',
  currentUserRole 
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState<RFIDScanData[]>([]);
  const [currentScan, setCurrentScan] = useState<string>('');
  const [scanResult, setScanResult] = useState<RFIDScanResult | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [scanMode, setScanMode] = useState(mode);

  // Simulate RFID reader connection
  useEffect(() => {
    // In real implementation, this would connect to actual RFID hardware
    const checkConnection = () => {
      setIsConnected(true); // Mock connection
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  const processScan = useCallback(async (rfidTag: string) => {
    if (!rfidTag.trim()) return;

    const scanData: RFIDScanData = {
      rfid_tag: rfidTag.trim().toUpperCase(),
      timestamp: new Date().toISOString(),
      scan_type: scanMode
    };

    setCurrentScan(scanData.rfid_tag);
    
    try {
      let result: RFIDScanResult;
      
      switch (scanMode) {
        case 'attendance':
          result = await processAttendanceScan(scanData);
          break;
        case 'gate-exit':
          result = await processGateExitScan(scanData);
          break;
        case 'gate-entry':
          result = await processGateEntryScan(scanData);
          break;
        case 'box-tracking':
        default:
          result = await processBoxTrackingScan(scanData);
          break;
      }

      setScanResult(result);
      
      if (result.success) {
        setScanHistory(prev => [scanData, ...prev.slice(0, 19)]); // Keep last 20 scans
        if (onScan) {
          onScan(scanData);
        }
      }
    } catch (error) {
      console.error('RFID scan processing error:', error);
      setScanResult({
        success: false,
        message: 'Failed to process RFID scan'
      });
    }

    // Clear current scan after 3 seconds
    setTimeout(() => {
      setCurrentScan('');
      setScanResult(null);
    }, 3000);
  }, [scanMode, onScan, authToken]);

  const processAttendanceScan = async (scanData: RFIDScanData): Promise<RFIDScanResult> => {
    try {
      const response = await fetch('https://clamflowbackend-production.up.railway.app/secure/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          employee_id: scanData.rfid_tag,
          method: 'rfid',
          timestamp: scanData.timestamp
        })
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          message: `Attendance recorded for ${scanData.rfid_tag}`,
          data: result
        };
      } else {
        const error = await response.json();
        return {
          success: false,
          message: error.detail || 'Failed to record attendance'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Network error during attendance recording'
      };
    }
  };

  const processGateExitScan = async (scanData: RFIDScanData): Promise<RFIDScanResult> => {
    try {
      const response = await fetch('https://clamflowbackend-production.up.railway.app/secure/gate/exit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          rfid_tags: [scanData.rfid_tag],
          timestamp: scanData.timestamp
        })
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          message: `Box exit recorded: ${scanData.rfid_tag}`,
          data: result
        };
      } else {
        const error = await response.json();
        return {
          success: false,
          message: error.detail || 'Failed to record box exit'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Network error during gate exit recording'
      };
    }
  };

  const processGateEntryScan = async (scanData: RFIDScanData): Promise<RFIDScanResult> => {
    try {
      const response = await fetch('https://clamflowbackend-production.up.railway.app/secure/gate/entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          rfid_tags: [scanData.rfid_tag],
          timestamp: scanData.timestamp
        })
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          message: `Box return recorded: ${scanData.rfid_tag}`,
          data: result
        };
      } else {
        const error = await response.json();
        return {
          success: false,
          message: error.detail || 'Failed to record box return'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Network error during gate entry recording'
      };
    }
  };

  const processBoxTrackingScan = async (scanData: RFIDScanData): Promise<RFIDScanResult> => {
    // For box tracking, we just validate the RFID tag format and log it
    if (scanData.rfid_tag.length < 8) {
      return {
        success: false,
        message: 'Invalid RFID tag format'
      };
    }

    return {
      success: true,
      message: `RFID tag scanned: ${scanData.rfid_tag}`,
      data: scanData
    };
  };

  const handleManualInput = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const manualTag = formData.get('manual_tag') as string;
    
    if (manualTag) {
      processScan(manualTag);
      (event.target as HTMLFormElement).reset();
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    // In real implementation, this would start the RFID reader
    // For demo, we'll simulate scanning after 2 seconds
    setTimeout(() => {
      const mockRFID = `RFID${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      processScan(mockRFID);
      setIsScanning(false);
    }, 2000);
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  const clearHistory = () => {
    setScanHistory([]);
  };

  const getModeTitle = () => {
    switch (scanMode) {
      case 'attendance':
        return 'Staff Attendance Scanner';
      case 'gate-exit':
        return 'Gate Exit Scanner';
      case 'gate-entry':
        return 'Gate Entry Scanner';
      case 'box-tracking':
      default:
        return 'Box Tracking Scanner';
    }
  };

  const getModeDescription = () => {
    switch (scanMode) {
      case 'attendance':
        return 'Scan RFID badges for staff check-in/check-out';
      case 'gate-exit':
        return 'Scan boxes leaving the facility';
      case 'gate-entry':
        return 'Scan boxes returning to the facility';
      case 'box-tracking':
      default:
        return 'General RFID tag scanning and tracking';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{getModeTitle()}</h2>
              <p className="text-gray-600 mt-1">{getModeDescription()}</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm font-medium ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Mode Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scanner Mode
            </label>
            <select
              value={scanMode}
              onChange={(e) => setScanMode(e.target.value as any)}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="box-tracking">Box Tracking</option>
              <option value="attendance">Staff Attendance</option>
              <option value="gate-exit">Gate Exit</option>
              <option value="gate-entry">Gate Entry</option>
            </select>
          </div>

          {/* Current Role Display */}
          {currentUserRole && (
            <div className="mb-6 p-3 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Current Role:</strong> {currentUserRole}
              </p>
            </div>
          )}

          {/* Scanner Interface */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scanning Area */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">RFID Scanner</h3>
              
              {/* Auto Scan */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {isScanning ? (
                  <div className="space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-blue-600 font-medium">Scanning for RFID tags...</p>
                    <button
                      onClick={stopScanning}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Stop Scanning
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <p className="text-gray-600">Click to start RFID scanning</p>
                    <button
                      onClick={startScanning}
                      disabled={!isConnected}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Start Scanning
                    </button>
                  </div>
                )}
              </div>

              {/* Manual Input */}
              <div className="border border-gray-300 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-800 mb-3">Manual RFID Input</h4>
                <form onSubmit={handleManualInput} className="space-y-3">
                  <input
                    name="manual_tag"
                    type="text"
                    placeholder="Enter RFID tag manually"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Process Manual Input
                  </button>
                </form>
              </div>
            </div>

            {/* Current Scan & Result */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Scan Results</h3>
              
              {/* Current Scan Display */}
              {currentScan && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-md font-medium text-blue-800 mb-2">Current Scan</h4>
                  <p className="font-mono text-lg text-blue-900">{currentScan}</p>
                </div>
              )}

              {/* Scan Result */}
              {scanResult && (
                <div className={`border rounded-lg p-4 ${
                  scanResult.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    {scanResult.success ? (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <p className={`font-medium ${
                      scanResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {scanResult.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Scan Statistics */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-800 mb-2">Session Statistics</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Scans:</span>
                    <span className="ml-2 font-semibold">{scanHistory.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Mode:</span>
                    <span className="ml-2 font-semibold capitalize">{scanMode.replace('-', ' ')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scan History */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Scan History</h3>
              {scanHistory.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Clear History
                </button>
              )}
            </div>

            {scanHistory.length > 0 ? (
              <div className="bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                <div className="divide-y divide-gray-200">
                  {scanHistory.map((scan, index) => (
                    <div key={index} className="p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                          {scan.rfid_tag}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {scan.scan_type.replace('-', ' ')}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(scan.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>No scans recorded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RFIDScanner;