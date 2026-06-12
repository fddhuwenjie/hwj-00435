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
  maxPower?: number;
  maxTemperature?: number;
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

export interface NetworkNode {
  id: string;
  rackId: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  ip: string;
  bandwidth: number;
  packetLossRate: number;
  isOnline: boolean;
}

export type LinkStatus = 'normal' | 'warning' | 'critical' | 'disconnected';

export interface NetworkLink {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  bandwidthUtilization: number;
  trafficFlow: number;
  status: LinkStatus;
}

export type VirtualDeviceSize = '1U' | '2U' | '4U';

export interface VirtualDevice {
  id: string;
  name: string;
  size: VirtualDeviceSize;
  powerConsumption: number;
  heatOutput: number;
  type: string;
}

export interface PlannedDevice {
  id: string;
  virtualDeviceId: string;
  rackId: string;
  startU: number;
  endU: number;
  powerConsumption: number;
  heatOutput: number;
}

export interface PlanningRackInfo {
  rackId: string;
  estimatedPower: number;
  remainingU: number;
  estimatedTemperature: number;
  isOverCapacity: boolean;
  isOverTemperature: boolean;
}

export interface PlanningState {
  isActive: boolean;
  plannedDevices: PlannedDevice[];
  selectedVirtualDevice: VirtualDevice | null;
  rackInfos: Record<string, PlanningRackInfo>;
}

export type PlaybackMode = 'live' | 'playback' | 'compare';

export interface HistorySnapshot {
  timestamp: number;
  racks: ServerRack[];
  alerts: Alert[];
  stats: DataCenterStats;
}

export interface TimelineState {
  mode: PlaybackMode;
  currentTime: number;
  timeA: number | null;
  timeB: number | null;
  isPlaying: boolean;
  playbackSpeed: number;
  snapshots: HistorySnapshot[];
}

export interface NetworkTooltipData {
  visible: boolean;
  x: number;
  y: number;
  node: NetworkNode | null;
  link: NetworkLink | null;
}
