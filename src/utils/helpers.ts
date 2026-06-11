import { DeviceStatus, AlertLevel } from '@/types';

export const statusColors: Record<DeviceStatus, string> = {
  running: '#00ff88',
  warning: '#ffcc00',
  fault: '#ff4444',
  idle: '#666666',
};

export const statusEmissiveColors: Record<DeviceStatus, string> = {
  running: '#003311',
  warning: '#332200',
  fault: '#330000',
  idle: '#1a1a1a',
};

export const alertLevelColors: Record<AlertLevel, string> = {
  info: '#00d4ff',
  warning: '#ffcc00',
  critical: '#ff4444',
};

export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const getTemperatureColor = (temp: number): string => {
  const normalized = Math.min(Math.max((temp - 18) / 20, 0), 1);
  const r = Math.floor(normalized * 255);
  const b = Math.floor((1 - normalized) * 255);
  const g = Math.floor(255 * (1 - Math.abs(normalized - 0.5) * 2));
  return `rgb(${r}, ${g}, ${b})`;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const getStatusLabel = (status: DeviceStatus): string => {
  const labels: Record<DeviceStatus, string> = {
    running: '运行中',
    warning: '告警',
    fault: '故障',
    idle: '空闲',
  };
  return labels[status];
};

export const getAlertLevelLabel = (level: AlertLevel): string => {
  const labels: Record<AlertLevel, string> = {
    info: '信息',
    warning: '警告',
    critical: '严重',
  };
  return labels[level];
};
