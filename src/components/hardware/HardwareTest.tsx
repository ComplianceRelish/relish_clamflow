import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Alert } from '../ui/Alert';

interface TestResult {
  success: boolean;
  message: string;
  test_results?: any;
  duration_ms?: number;
}

export const HardwareTest: React.FC = () => {
  const [testResults, setTestResults] = useState<{[key: string]: TestResult}>({});
  const [isRunningTests, setIsRunningTests] = useState<{[key: string]: boolean}>({});

  const hardwareTypes = [
    { id: 'face_recognition', name: 'Face Recognition', icon: '👤' },
    { id: 'rfid', name: 'RFID System', icon: '📡' },
    { id: 'label_printer', name: 'Label Printer', icon: '🖨️' },
    { id: 'qr_code', name: 'QR Code Generator', icon: '📱' }
  ];

  const testHardware = async (hardwareType: string) => {
    setIsRunningTests(prev => ({ ...prev, [hardwareType]: true }));
    
    try {
      const token = localStorage.getItem('clamflow_token');
      const response = await fetch(`https://clamflowbackend-production.up.railway.app/admin/hardware/test/${hardwareType}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test_type: 'connection_test' })
      });

      const result = await response.json();
      setTestResults(prev => ({ ...prev, [hardwareType]: result }));

    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [hardwareType]: {
          success: false,
          message: `Test failed: ${(error as Error).message}`
        }
      }));
    } finally {
      setIsRunningTests(prev => ({ ...prev, [hardwareType]: false }));
    }
  };

  const testAllHardware = async () => {
    for (const hardware of hardwareTypes) {
      await testHardware(hardware.id);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  // Fixed: Only return valid Alert variants
  const getResultVariant = (result?: TestResult): "default" | "destructive" | undefined => {
    if (!result) return "default";
    return result.success ? "default" : "destructive"; // Use "default" for success instead of "success"
  };

  // Helper function to get success styling
  const getResultClassName = (result?: TestResult): string => {
    if (!result) return "";
    return result.success ? "test-result-success" : "test-result-error";
  };

  return (
    <div className="hardware-testing">
      <div className="testing-header">
        <h2>🧪 Hardware Testing & Diagnostics</h2>
        <Button onClick={testAllHardware}>
          🔄 Test All Hardware
        </Button>
      </div>

      <div className="hardware-tests-grid">
        {hardwareTypes.map(hardware => (
          <Card key={hardware.id} className="hardware-test-card">
            <div className="test-header">
              <div className="hardware-info">
                <span className="hardware-icon">{hardware.icon}</span>
                <h3>{hardware.name}</h3>
              </div>
              
              <Button
                onClick={() => testHardware(hardware.id)}
                disabled={isRunningTests[hardware.id]}
                className="test-button"
              >
                {isRunningTests[hardware.id] ? 'Testing...' : '🔧 Test'}
              </Button>
            </div>

            {testResults[hardware.id] && (
              <Alert 
                variant={getResultVariant(testResults[hardware.id])}
                className={`test-result ${getResultClassName(testResults[hardware.id])}`}
              >
                <div className="result-content">
                  {/* Visual indicator for success/failure */}
                  <div className="result-status">
                    {testResults[hardware.id].success ? '✅' : '❌'}
                    <strong>Status:</strong> {testResults[hardware.id].success ? 'PASS' : 'FAIL'}
                  </div>
                  
                  <p><strong>Message:</strong> {testResults[hardware.id].message}</p>
                  {testResults[hardware.id].duration_ms && (
                    <p><strong>Duration:</strong> {testResults[hardware.id].duration_ms}ms</p>
                  )}
                  
                  {testResults[hardware.id].test_results && (
                    <details className="test-details">
                      <summary>Test Details</summary>
                      <pre>
                        {JSON.stringify(testResults[hardware.id].test_results, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </Alert>
            )}

            {isRunningTests[hardware.id] && (
              <div className="testing-indicator">
                <div className="spinner"></div>
                <p>Running hardware test...</p>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Card className="system-diagnostics">
        <h3>📊 System Diagnostics</h3>
        <Button
          onClick={() => window.open('https://clamflowbackend-production.up.railway.app/admin/hardware/diagnostics', '_blank')}
        >
          🔍 View Full Diagnostics
        </Button>
      </Card>

      {/* Custom CSS for success styling */}
      <style jsx>{`
        .test-result-success {
          border-color: #22c55e !important;
          background-color: #f0fdf4 !important;
        }
        
        .test-result-error {
          border-color: #ef4444 !important;
          background-color: #fef2f2 !important;
        }

        .result-status {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .hardware-tests-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }

        .test-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .hardware-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .hardware-icon {
          font-size: 24px;
        }

        .testing-indicator {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background-color: #f8f9fa;
          border-radius: 6px;
        }

        .test-details {
          margin-top: 10px;
        }

        .test-details pre {
          font-size: 12px;
          background-color: #f1f3f4;
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
};