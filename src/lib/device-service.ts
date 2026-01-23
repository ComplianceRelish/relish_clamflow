/**
 * ClamFlow Device Service
 * 
 * Provides WebUSB, WebSerial, Web Bluetooth, and Network device access
 * with validation against the Device Registry for production devices.
 * 
 * Device Categories:
 * - Data Entry Devices (Tablets, PCs, Phones): RBAC only, no device registration
 * - Production Devices (Scales, RFID, Sensors): Device Registry + RBAC
 * 
 * @module device-service
 */

import { apiClient } from './api-client';

// ============================================
// WEB API TYPE DECLARATIONS
// ============================================

// WebUSB Types
interface USBDeviceFilter {
  vendorId?: number;
  productId?: number;
  classCode?: number;
  subclassCode?: number;
  protocolCode?: number;
  serialNumber?: string;
}

interface USBDevice {
  readonly vendorId: number;
  readonly productId: number;
  readonly serialNumber?: string;
  readonly manufacturerName?: string;
  readonly productName?: string;
  open(): Promise<void>;
  close(): Promise<void>;
}

interface USB {
  getDevices(): Promise<USBDevice[]>;
  requestDevice(options: { filters: USBDeviceFilter[] }): Promise<USBDevice>;
}

// WebSerial Types
interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

interface SerialOptions {
  baudRate: number;
  dataBits?: 7 | 8;
  stopBits?: 1 | 2;
  parity?: 'none' | 'even' | 'odd';
  bufferSize?: number;
  flowControl?: 'none' | 'hardware';
}

interface SerialPortRequestOptions {
  filters?: { usbVendorId?: number; usbProductId?: number }[];
}

interface SerialPort {
  readonly readable: ReadableStream<Uint8Array> | null;
  readonly writable: WritableStream<Uint8Array> | null;
  getInfo(): SerialPortInfo;
  open(options: SerialOptions): Promise<void>;
  close(): Promise<void>;
}

interface Serial {
  getPorts(): Promise<SerialPort[]>;
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
}

// Web Bluetooth Types
interface BluetoothRequestDeviceFilter {
  services?: BluetoothServiceUUID[];
  name?: string;
  namePrefix?: string;
  manufacturerId?: number;
  serviceDataUUID?: string;
}

type BluetoothServiceUUID = string | number;
type BluetoothCharacteristicUUID = string | number;

interface RequestDeviceOptions {
  filters?: BluetoothRequestDeviceFilter[];
  optionalServices?: BluetoothServiceUUID[];
  acceptAllDevices?: boolean;
}

interface BluetoothDevice {
  readonly id: string;
  readonly name?: string;
  readonly gatt?: BluetoothRemoteGATTServer;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

interface BluetoothRemoteGATTServer {
  readonly connected: boolean;
  readonly device: BluetoothDevice;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
  readonly device: BluetoothDevice;
  readonly uuid: string;
  getCharacteristic(characteristic: BluetoothServiceUUID): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic {
  readonly uuid: string;
  readonly value?: DataView;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

interface Bluetooth {
  getAvailability(): Promise<boolean>;
  requestDevice(options: {
    filters?: BluetoothRequestDeviceFilter[];
    optionalServices?: BluetoothServiceUUID[];
    acceptAllDevices?: boolean;
  }): Promise<BluetoothDevice>;
  getDevices(): Promise<BluetoothDevice[]>;
}

// Extend Navigator interface
declare global {
  interface Navigator {
    usb?: USB;
    serial?: Serial;
    bluetooth?: Bluetooth;
  }
}

// ============================================
// TYPE DEFINITIONS
// ============================================

export type DeviceType = 
  | 'scale'
  | 'rfid_reader'
  | 'barcode_scanner'
  | 'label_printer'
  | 'temperature_sensor'
  | 'ph_meter'
  | 'biometric_scanner'
  | 'camera';

// Data entry devices - RBAC only, no registration required
export type DataEntryDeviceType = 'tablet' | 'pc' | 'mobile_phone';

export type ConnectionType = 'usb' | 'serial' | 'bluetooth' | 'wifi' | 'ethernet';

export type DeviceStatus = 'pending' | 'approved' | 'revoked' | 'maintenance';

export type ValidationResult = 'approved' | 'not_registered' | 'revoked' | 'no_permission';

// Network device configuration (for WiFi/Ethernet devices)
export interface NetworkDeviceConfig {
  name?: string;
  serialNumber?: string;
  ipAddress: string;
  port: number;
  protocol: 'http' | 'websocket' | 'mqtt';
  useTLS?: boolean;
  endpoint?: string;
  pollInterval?: number;
  authToken?: string;
}

export interface DeviceInfo {
  serialNumber: string | null;
  vendorId: number | null;
  productId: number | null;
  manufacturerName?: string;
  productName?: string;
  connectionType: ConnectionType;
  name?: string;
}

export interface DeviceValidationRequest {
  serial_number: string | null;
  vendor_id: string | null;
  product_id: string | null;
  station_id?: string;
  connection_type: ConnectionType;
}

export interface DeviceValidationResponse {
  status: ValidationResult;
  device_id?: string;
  device_name?: string;
  device_type?: DeviceType;
  permissions?: string[];
  message?: string;
}

export interface RegisteredDevice {
  id: string;
  device_name: string;
  device_type: DeviceType;
  serial_number: string;
  vendor_id?: string;
  product_id?: string;
  manufacturer?: string;
  model?: string;
  station_id?: string;
  station_location?: string;
  status: DeviceStatus;
  is_active: boolean;
  allowed_roles: string[];
  configuration?: Record<string, unknown>;
  last_connected_at?: string;
  connection_count: number;
}

export interface DeviceReading {
  device_id: string;
  value: number;
  unit: string;
  timestamp: Date;
  raw_data?: string;
}

export interface DeviceEventCallbacks {
  onConnected?: (device: DeviceInfo) => void;
  onDisconnected?: (device: DeviceInfo) => void;
  onData?: (reading: DeviceReading) => void;
  onError?: (error: Error) => void;
  onValidationFailed?: (result: DeviceValidationResponse) => void;
  onUnauthorized?: (device: DeviceInfo, reason: string) => void;
}

// ============================================
// BROWSER API SUPPORT CHECK
// ============================================

export const isWebUSBSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'usb' in navigator;
};

export const isWebSerialSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
};

export const isWebBluetoothSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
};

// ============================================
// DEVICE SERVICE CLASS
// ============================================

class DeviceService {
  private connectedDevices: Map<string, USBDevice | SerialPort | BluetoothDevice> = new Map();
  private deviceReaders: Map<string, ReadableStreamDefaultReader<Uint8Array>> = new Map();
  private networkPollers: Map<string, NodeJS.Timeout> = new Map();
  private callbacks: DeviceEventCallbacks = {};
  private currentStationId: string | null = null;

  /**
   * Set the current station context for device validation
   */
  setCurrentStation(stationId: string): void {
    this.currentStationId = stationId;
  }

  /**
   * Register callbacks for device events
   */
  setCallbacks(callbacks: DeviceEventCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // ============================================
  // DEVICE VALIDATION
  // ============================================

  /**
   * Validate a device against the backend registry
   */
  async validateDevice(deviceInfo: DeviceInfo): Promise<DeviceValidationResponse> {
    try {
      const request: DeviceValidationRequest = {
        serial_number: deviceInfo.serialNumber,
        vendor_id: deviceInfo.vendorId?.toString(16) || null,
        product_id: deviceInfo.productId?.toString(16) || null,
        station_id: this.currentStationId || undefined,
        connection_type: deviceInfo.connectionType
      };

      const response = await apiClient.post('/api/devices/validate', request);
      return response.data as DeviceValidationResponse;
    } catch (error) {
      console.error('Device validation failed:', error);
      // If backend is unavailable, default to not_registered for security
      return {
        status: 'not_registered',
        message: 'Unable to validate device. Please contact administrator.'
      };
    }
  }

  /**
   * Log a device event to the audit trail
   */
  private async logDeviceEvent(
    eventType: string,
    deviceInfo: DeviceInfo,
    eventData?: Record<string, unknown>
  ): Promise<void> {
    try {
      await apiClient.post('/api/devices/audit', {
        event_type: eventType,
        device_serial: deviceInfo.serialNumber,
        vendor_id: deviceInfo.vendorId?.toString(16),
        product_id: deviceInfo.productId?.toString(16),
        connection_type: deviceInfo.connectionType,
        station_id: this.currentStationId,
        event_data: eventData
      });
    } catch (error) {
      console.error('Failed to log device event:', error);
    }
  }

  // ============================================
  // WEBUSB METHODS
  // ============================================

  /**
   * Request and connect to a USB device
   */
  async connectUSBDevice(filters?: USBDeviceFilter[]): Promise<DeviceInfo | null> {
    if (!isWebUSBSupported()) {
      throw new Error('WebUSB is not supported in this browser');
    }

    try {
      // Request device from user
      if (!navigator.usb) throw new Error('WebUSB not available');
      const device = await navigator.usb.requestDevice({
        filters: filters || []
      });

      // Extract device info
      const deviceInfo: DeviceInfo = {
        serialNumber: device.serialNumber || null,
        vendorId: device.vendorId,
        productId: device.productId,
        manufacturerName: device.manufacturerName || undefined,
        productName: device.productName || undefined,
        connectionType: 'usb'
      };

      // Validate against registry
      const validation = await this.validateDevice(deviceInfo);

      if (validation.status === 'approved') {
        // Open and configure device
        await device.open();
        
        // Store connected device
        const deviceKey = `usb-${device.vendorId}-${device.productId}-${device.serialNumber}`;
        this.connectedDevices.set(deviceKey, device);

        // Log successful connection
        await this.logDeviceEvent('connected', deviceInfo, {
          validation_result: 'approved',
          device_id: validation.device_id
        });

        this.callbacks.onConnected?.(deviceInfo);
        return deviceInfo;
      } else {
        // Device not approved - alert admin
        await this.logDeviceEvent('unauthorized_attempt', deviceInfo, {
          validation_result: validation.status,
          message: validation.message
        });

        this.callbacks.onValidationFailed?.(validation);
        
        // Notify admin of unauthorized device
        await this.notifyAdminUnauthorizedDevice(deviceInfo);
        
        return null;
      }
    } catch (error) {
      if ((error as Error).name === 'NotFoundError') {
        // User cancelled the device picker
        return null;
      }
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Disconnect a USB device
   */
  async disconnectUSBDevice(deviceKey: string): Promise<void> {
    const device = this.connectedDevices.get(deviceKey) as USBDevice;
    if (device) {
      try {
        await device.close();
        this.connectedDevices.delete(deviceKey);
        
        const deviceInfo: DeviceInfo = {
          serialNumber: device.serialNumber || null,
          vendorId: device.vendorId,
          productId: device.productId,
          connectionType: 'usb'
        };
        
        await this.logDeviceEvent('disconnected', deviceInfo);
        this.callbacks.onDisconnected?.(deviceInfo);
      } catch (error) {
        console.error('Error disconnecting USB device:', error);
      }
    }
  }

  // ============================================
  // WEBSERIAL METHODS
  // ============================================

  /**
   * Request and connect to a Serial port device
   */
  async connectSerialDevice(options?: SerialPortRequestOptions): Promise<DeviceInfo | null> {
    if (!isWebSerialSupported()) {
      throw new Error('WebSerial is not supported in this browser');
    }

    try {
      // Request port from user
      if (!navigator.serial) throw new Error('WebSerial not available');
      const port = await navigator.serial.requestPort(options);
      const info = port.getInfo();

      // Extract device info
      const deviceInfo: DeviceInfo = {
        serialNumber: null, // Serial ports don't expose serial numbers directly
        vendorId: info.usbVendorId || null,
        productId: info.usbProductId || null,
        connectionType: 'serial'
      };

      // Validate against registry
      const validation = await this.validateDevice(deviceInfo);

      if (validation.status === 'approved') {
        // Open port with common settings
        await port.open({
          baudRate: 9600,
          dataBits: 8,
          parity: 'none',
          stopBits: 1
        });

        // Store connected device
        const deviceKey = `serial-${info.usbVendorId}-${info.usbProductId}`;
        this.connectedDevices.set(deviceKey, port);

        // Start reading data
        this.startSerialReader(deviceKey, port, validation.device_id || 'unknown');

        // Log successful connection
        await this.logDeviceEvent('connected', deviceInfo, {
          validation_result: 'approved',
          device_id: validation.device_id
        });

        this.callbacks.onConnected?.(deviceInfo);
        return deviceInfo;
      } else {
        // Device not approved
        await this.logDeviceEvent('unauthorized_attempt', deviceInfo, {
          validation_result: validation.status,
          message: validation.message
        });

        this.callbacks.onValidationFailed?.(validation);
        await this.notifyAdminUnauthorizedDevice(deviceInfo);
        
        return null;
      }
    } catch (error) {
      if ((error as Error).name === 'NotFoundError') {
        // User cancelled
        return null;
      }
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Start reading data from a serial port
   */
  private async startSerialReader(
    deviceKey: string, 
    port: SerialPort, 
    deviceId: string
  ): Promise<void> {
    if (!port.readable) return;

    const reader = port.readable.getReader();
    this.deviceReaders.set(deviceKey, reader);

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Check for complete reading (usually ends with newline)
        const lines = buffer.split('\n');
        if (lines.length > 1) {
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            if (line) {
              const reading = this.parseReading(deviceId, line);
              if (reading) {
                this.callbacks.onData?.(reading);
              }
            }
          }
          buffer = lines[lines.length - 1];
        }
      }
    } catch (error) {
      console.error('Serial read error:', error);
      this.callbacks.onError?.(error as Error);
    } finally {
      reader.releaseLock();
      this.deviceReaders.delete(deviceKey);
    }
  }

  /**
   * Parse raw data from device into a reading
   * Override this for device-specific parsing
   */
  private parseReading(deviceId: string, rawData: string): DeviceReading | null {
    // Common scale format: "   125.50 kg" or "ST,GS,  125.50,kg"
    const numericMatch = rawData.match(/(-?\d+\.?\d*)\s*(kg|g|lb)?/i);
    
    if (numericMatch) {
      return {
        device_id: deviceId,
        value: parseFloat(numericMatch[1]),
        unit: numericMatch[2]?.toLowerCase() || 'kg',
        timestamp: new Date(),
        raw_data: rawData
      };
    }

    return null;
  }

  /**
   * Disconnect a serial device
   */
  async disconnectSerialDevice(deviceKey: string): Promise<void> {
    const reader = this.deviceReaders.get(deviceKey);
    if (reader) {
      await reader.cancel();
      this.deviceReaders.delete(deviceKey);
    }

    const port = this.connectedDevices.get(deviceKey) as SerialPort;
    if (port) {
      try {
        await port.close();
        this.connectedDevices.delete(deviceKey);
        
        const info = port.getInfo();
        const deviceInfo: DeviceInfo = {
          serialNumber: null,
          vendorId: info.usbVendorId || null,
          productId: info.usbProductId || null,
          connectionType: 'serial'
        };
        
        await this.logDeviceEvent('disconnected', deviceInfo);
        this.callbacks.onDisconnected?.(deviceInfo);
      } catch (error) {
        console.error('Error disconnecting serial device:', error);
      }
    }
  }

  // ============================================
  // BLUETOOTH DEVICE METHODS
  // ============================================

  /**
   * Connect to a Bluetooth device
   * Note: Web Bluetooth requires user interaction (click event)
   * Bluetooth devices are typically portable (handheld scanners, mobile printers)
   */
  async connectBluetoothDevice(options?: {
    filters?: BluetoothRequestDeviceFilter[];
    optionalServices?: BluetoothServiceUUID[];
    acceptAllDevices?: boolean;
  }): Promise<DeviceInfo | null> {
    if (!isWebBluetoothSupported() || !navigator.bluetooth) {
      console.error('Web Bluetooth API not supported');
      return null;
    }

    try {
      // Request device - browser shows pairing dialog
      const requestOptions: RequestDeviceOptions = options?.acceptAllDevices
        ? { acceptAllDevices: true, optionalServices: options?.optionalServices || [] }
        : { filters: options?.filters || [], optionalServices: options?.optionalServices || [] };

      const device = await navigator.bluetooth.requestDevice(requestOptions);

      if (!device) {
        return null;
      }

      const deviceInfo: DeviceInfo = {
        serialNumber: device.id, // Bluetooth uses UUID as identifier
        vendorId: null, // Not available for Bluetooth
        productId: null,
        connectionType: 'bluetooth',
        name: device.name || 'Unknown Bluetooth Device'
      };

      // For production devices, validate against registry
      // Bluetooth devices are often used as portable scanners - check if registration required
      const validation = await this.validateDevice(deviceInfo);
      
      if (validation.status !== 'approved') {
        this.callbacks.onUnauthorized?.(deviceInfo, validation.message || 'Device not registered');
        await this.notifyAdminUnauthorizedDevice(deviceInfo);
        return null;
      }

      // Connect to GATT server
      if (device.gatt) {
        await device.gatt.connect();
      }

      // Store connection
      const deviceKey = `bluetooth-${device.id}`;
      this.connectedDevices.set(deviceKey, device);

      // Set up disconnect handler
      device.addEventListener('gattserverdisconnected', () => {
        this.connectedDevices.delete(deviceKey);
        this.callbacks.onDisconnected?.(deviceInfo);
      });

      await this.logDeviceEvent('connected', deviceInfo);
      this.callbacks.onConnected?.(deviceInfo);

      return deviceInfo;
    } catch (error) {
      console.error('Bluetooth connection error:', error);
      return null;
    }
  }

  /**
   * Read data from a Bluetooth characteristic
   */
  async readBluetoothCharacteristic(
    deviceKey: string,
    serviceUUID: BluetoothServiceUUID,
    characteristicUUID: BluetoothCharacteristicUUID
  ): Promise<DataView | null> {
    const device = this.connectedDevices.get(deviceKey) as BluetoothDevice;
    if (!device?.gatt?.connected) {
      console.error('Bluetooth device not connected');
      return null;
    }

    try {
      const service = await device.gatt.getPrimaryService(serviceUUID);
      const characteristic = await service.getCharacteristic(characteristicUUID);
      return await characteristic.readValue();
    } catch (error) {
      console.error('Error reading Bluetooth characteristic:', error);
      return null;
    }
  }

  /**
   * Subscribe to Bluetooth notifications (for continuous readings)
   */
  async subscribeToBluetoothNotifications(
    deviceKey: string,
    serviceUUID: BluetoothServiceUUID,
    characteristicUUID: BluetoothCharacteristicUUID,
    onNotification: (value: DataView) => void
  ): Promise<boolean> {
    const device = this.connectedDevices.get(deviceKey) as BluetoothDevice;
    if (!device?.gatt?.connected) {
      console.error('Bluetooth device not connected');
      return false;
    }

    try {
      const service = await device.gatt.getPrimaryService(serviceUUID);
      const characteristic = await service.getCharacteristic(characteristicUUID);
      
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
        if (target?.value) {
          onNotification(target.value);
        }
      });

      await characteristic.startNotifications();
      return true;
    } catch (error) {
      console.error('Error subscribing to Bluetooth notifications:', error);
      return false;
    }
  }

  /**
   * Disconnect a Bluetooth device
   */
  async disconnectBluetoothDevice(deviceKey: string): Promise<void> {
    const device = this.connectedDevices.get(deviceKey) as BluetoothDevice;
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
      this.connectedDevices.delete(deviceKey);
      
      const deviceInfo: DeviceInfo = {
        serialNumber: device.id,
        vendorId: null,
        productId: null,
        connectionType: 'bluetooth',
        name: device.name || undefined
      };

      await this.logDeviceEvent('disconnected', deviceInfo);
      this.callbacks.onDisconnected?.(deviceInfo);
    }
  }

  // ============================================
  // NETWORK DEVICE METHODS (WiFi/Ethernet)
  // ============================================

  /**
   * Connect to a network device (WiFi/Ethernet)
   * Network devices communicate via HTTP, WebSocket, or MQTT
   * This doesn't use browser APIs - it connects via the device's IP/hostname
   */
  async connectNetworkDevice(config: NetworkDeviceConfig): Promise<DeviceInfo | null> {
    const deviceInfo: DeviceInfo = {
      serialNumber: config.serialNumber || config.ipAddress,
      vendorId: null,
      productId: null,
      connectionType: config.protocol === 'mqtt' ? 'wifi' : 'ethernet',
      name: config.name
    };

    // Validate device registration (production devices must be registered)
    const validation = await this.validateDevice(deviceInfo);
    
    if (validation.status !== 'approved') {
      this.callbacks.onUnauthorized?.(deviceInfo, validation.message || 'Device not registered');
      await this.notifyAdminUnauthorizedDevice(deviceInfo);
      return null;
    }

    const deviceKey = `network-${config.ipAddress}:${config.port}`;

    try {
      if (config.protocol === 'websocket') {
        // WebSocket connection for real-time devices
        await this.connectWebSocketDevice(deviceKey, config);
      } else if (config.protocol === 'http') {
        // HTTP polling for devices with REST APIs
        await this.startHTTPPolling(deviceKey, config);
      } else if (config.protocol === 'mqtt') {
        // MQTT would require a broker connection - placeholder
        console.warn('MQTT not yet implemented - requires broker configuration');
        return null;
      }

      await this.logDeviceEvent('connected', deviceInfo);
      this.callbacks.onConnected?.(deviceInfo);

      return deviceInfo;
    } catch (error) {
      console.error('Network device connection error:', error);
      return null;
    }
  }

  /**
   * Connect to a device via WebSocket
   */
  private async connectWebSocketDevice(
    deviceKey: string,
    config: NetworkDeviceConfig
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsProtocol = config.useTLS ? 'wss' : 'ws';
      const ws = new WebSocket(`${wsProtocol}://${config.ipAddress}:${config.port}`);

      ws.onopen = () => {
        // Store as a custom object since WebSocket isn't in our device types
        (this.connectedDevices as Map<string, unknown>).set(deviceKey, ws);
        resolve();
      };

      ws.onerror = (error) => {
        reject(error);
      };

      ws.onmessage = (event) => {
        // Parse incoming data as device reading
        try {
          const data = JSON.parse(event.data);
          const reading: DeviceReading = {
            device_id: deviceKey,
            value: data.value || data.weight || data.reading,
            unit: data.unit || 'kg',
            timestamp: new Date(),
            raw_data: event.data
          };
          this.callbacks.onData?.(reading);
        } catch {
          // If not JSON, try parsing as raw reading
          const reading = this.parseReading(deviceKey, event.data);
          if (reading) {
            this.callbacks.onData?.(reading);
          }
        }
      };

      ws.onclose = () => {
        this.connectedDevices.delete(deviceKey);
        this.callbacks.onDisconnected?.({
          serialNumber: config.serialNumber || config.ipAddress,
          vendorId: null,
          productId: null,
          connectionType: 'ethernet'
        });
      };
    });
  }

  /**
   * Start HTTP polling for a network device
   */
  private async startHTTPPolling(
    deviceKey: string,
    config: NetworkDeviceConfig
  ): Promise<void> {
    const protocol = config.useTLS ? 'https' : 'http';
    const baseUrl = `${protocol}://${config.ipAddress}:${config.port}`;
    const endpoint = config.endpoint || '/api/reading';
    const pollInterval = config.pollInterval || 1000;

    // Verify device is reachable
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers: config.authToken ? { 'Authorization': `Bearer ${config.authToken}` } : {}
    });

    if (!response.ok) {
      throw new Error(`Device not reachable: ${response.status}`);
    }

    // Mark as connected
    (this.connectedDevices as Map<string, unknown>).set(deviceKey, { type: 'http', baseUrl });

    // Start polling
    const pollerId = setInterval(async () => {
      try {
        const res = await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          headers: config.authToken ? { 'Authorization': `Bearer ${config.authToken}` } : {}
        });

        if (res.ok) {
          const data = await res.json();
          const reading: DeviceReading = {
            device_id: deviceKey,
            value: data.value || data.weight || data.reading,
            unit: data.unit || 'kg',
            timestamp: new Date(),
            raw_data: JSON.stringify(data)
          };
          this.callbacks.onData?.(reading);
        }
      } catch (error) {
        console.error('HTTP polling error:', error);
      }
    }, pollInterval);

    this.networkPollers.set(deviceKey, pollerId);
  }

  /**
   * Disconnect a network device
   */
  async disconnectNetworkDevice(deviceKey: string): Promise<void> {
    // Stop HTTP polling if active
    const pollerId = this.networkPollers.get(deviceKey);
    if (pollerId) {
      clearInterval(pollerId);
      this.networkPollers.delete(deviceKey);
    }

    // Close WebSocket if active
    const connection = this.connectedDevices.get(deviceKey);
    if (connection instanceof WebSocket) {
      connection.close();
    }

    this.connectedDevices.delete(deviceKey);

    await this.logDeviceEvent('disconnected', {
      serialNumber: deviceKey.replace('network-', ''),
      vendorId: null,
      productId: null,
      connectionType: 'ethernet'
    });
  }

  // ============================================
  // ADMIN NOTIFICATION
  // ============================================

  /**
   * Notify admin of unauthorized device attempt
   */
  private async notifyAdminUnauthorizedDevice(deviceInfo: DeviceInfo): Promise<void> {
    try {
      await apiClient.post('/api/admin/alerts', {
        type: 'unauthorized_device',
        severity: 'warning',
        message: `Unauthorized device connection attempt detected`,
        data: {
          vendor_id: deviceInfo.vendorId?.toString(16),
          product_id: deviceInfo.productId?.toString(16),
          serial_number: deviceInfo.serialNumber,
          connection_type: deviceInfo.connectionType,
          station_id: this.currentStationId
        }
      });
    } catch (error) {
      console.error('Failed to notify admin:', error);
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Get list of connected devices
   */
  getConnectedDevices(): string[] {
    return Array.from(this.connectedDevices.keys());
  }

  /**
   * Check if a specific device is connected
   */
  isDeviceConnected(deviceKey: string): boolean {
    return this.connectedDevices.has(deviceKey);
  }

  /**
   * Disconnect all devices
   */
  async disconnectAll(): Promise<void> {
    for (const deviceKey of this.connectedDevices.keys()) {
      if (deviceKey.startsWith('usb-')) {
        await this.disconnectUSBDevice(deviceKey);
      } else if (deviceKey.startsWith('serial-')) {
        await this.disconnectSerialDevice(deviceKey);
      } else if (deviceKey.startsWith('bluetooth-')) {
        await this.disconnectBluetoothDevice(deviceKey);
      } else if (deviceKey.startsWith('network-')) {
        await this.disconnectNetworkDevice(deviceKey);
      }
    }
  }

  /**
   * Get previously paired USB devices (already granted permission)
   */
  async getPairedUSBDevices(): Promise<USBDevice[]> {
    if (!isWebUSBSupported() || !navigator.usb) return [];
    return navigator.usb.getDevices();
  }

  /**
   * Get previously paired serial ports (already granted permission)
   */
  async getPairedSerialPorts(): Promise<SerialPort[]> {
    if (!isWebSerialSupported() || !navigator.serial) return [];
    return navigator.serial.getPorts();
  }

  /**
   * Get previously paired Bluetooth devices
   * Note: Web Bluetooth doesn't persist pairings across sessions
   * This returns currently connected Bluetooth devices only
   */
  getConnectedBluetoothDevices(): BluetoothDevice[] {
    const devices: BluetoothDevice[] = [];
    for (const [key, device] of this.connectedDevices.entries()) {
      if (key.startsWith('bluetooth-') && device instanceof Object && 'gatt' in device) {
        devices.push(device as BluetoothDevice);
      }
    }
    return devices;
  }

  /**
   * Get connected network devices
   */
  getConnectedNetworkDevices(): string[] {
    return Array.from(this.connectedDevices.keys()).filter(key => key.startsWith('network-'));
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const deviceService = new DeviceService();
export default deviceService;
