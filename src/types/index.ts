export type DeviceStatus = 'running' | 'warning' | 'fault' | 'idle';

export type AlertLevel = 'info' | 'warning' | 'critical';

export interface HistoryData {
  timestamp: number;
  cpuUsage: number;
  temperature: number;
}

export interface ServerDevice {
  id: string;
  rackId: string;
  name: string;
  ip: string;
  startU: number;
  endU: number;
  status: DeviceStatus;
  cpuUsage: number;
  memoryUsage: number;
  temperature: number;
  powerConsumption: number;
  isOnline: boolean;
  history: HistoryData[];
}

export interface ServerRack {
  id: string;
  row: number;
  column: number;
  positionX: number;
  positionZ: number;
  topTemperature: number;
  devices: ServerDevice[];
  usedU: number;
  totalU: number;
}

export interface Alert {
  id: string;
  deviceId: string;
  deviceName: string;
  type: string;
  level: AlertLevel;
  message: string;
  timestamp: number;
}

export interface DataCenterStats {
  totalDevices: number;
  onlineDevices: number;
  alertDevices: number;
  offlineDevices: number;
  totalPower: number;
  pue: number;
  rackUtilization: number;
  coolingEfficiency: number;
}

export interface TemperaturePoint {
  x: number;
  z: number;
  temperature: number;
}

export type ViewMode = 'perspective' | 'top';

export interface TooltipData {
  visible: boolean;
  x: number;
  y: number;
  device: ServerDevice | null;
}
