import { ServerDevice } from '@/types';
import { statusColors, getStatusLabel } from '@/utils/helpers';
import { Cpu, HardDrive, Thermometer, Wifi, WifiOff, Network } from 'lucide-react';

interface DeviceTooltipProps {
  visible: boolean;
  x: number;
  y: number;
  device: ServerDevice | null;
}

export const DeviceTooltip = ({ visible, x, y, device }: DeviceTooltipProps) => {
  if (!visible || !device) return null;

  const statusColor = statusColors[device.status];

  return (
    <div
      className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full"
      style={{
        left: x,
        top: y - 10,
      }}
    >
      <div className="relative bg-slate-900/95 backdrop-blur-md border border-cyan-500/50 rounded-xl p-4 min-w-[280px] shadow-2xl shadow-cyan-500/20">
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-slate-900/95 border-r border-b border-cyan-500/50 rotate-45" />

        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${statusColor}20` }}
          >
            {device.isOnline ? (
              <Network className="w-5 h-5" style={{ color: statusColor }} />
            ) : (
              <WifiOff className="w-5 h-5 text-gray-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold truncate">{device.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
              >
                {getStatusLabel(device.status)}
              </span>
              <span className="text-xs text-gray-400 font-mono">{device.ip}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700/50 pt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <Cpu className="w-4 h-4" />
              <span>CPU</span>
            </div>
            <span className="text-white font-mono">{device.cpuUsage.toFixed(1)}%</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <HardDrive className="w-4 h-4" />
              <span>内存</span>
            </div>
            <span className="text-white font-mono">{device.memoryUsage.toFixed(1)}%</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <Thermometer className="w-4 h-4" />
              <span>温度</span>
            </div>
            <span
              className="font-mono"
              style={{
                color: device.temperature > 35 ? '#ff4444' : device.temperature > 30 ? '#ffcc00' : '#00ff88',
              }}
            >
              {device.temperature.toFixed(1)}°C
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <span className="w-4 h-4 text-center text-xs">U</span>
              <span>位置</span>
            </div>
            <span className="text-white font-mono">
              U{device.startU}-U{device.endU}
            </span>
          </div>
        </div>

        <div className="absolute top-0 left-0 w-full h-1 rounded-t-xl overflow-hidden">
          <div
            className="h-full"
            style={{
              background: `linear-gradient(90deg, ${statusColor}40, ${statusColor}00)`,
              opacity: 0.5,
            }}
          />
        </div>
      </div>
    </div>
  );
};
