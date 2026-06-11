import { X, Cpu, HardDrive, Thermometer, Zap, Network, Server } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ServerDevice } from '@/types';
import { statusColors, getStatusLabel, formatTime } from '@/utils/helpers';

interface DeviceDetailProps {
  device: ServerDevice | null;
  onClose: () => void;
}

export const DeviceDetail = ({ device, onClose }: DeviceDetailProps) => {
  if (!device) return null;

  const statusColor = statusColors[device.status];

  const chartData = device.history.map((h) => ({
    time: formatTime(h.timestamp),
    cpu: h.cpuUsage.toFixed(1),
    temperature: h.temperature.toFixed(1),
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900/95 backdrop-blur-md border border-cyan-500/30 rounded-2xl w-[700px] max-h-[80vh] overflow-hidden shadow-2xl shadow-cyan-500/20">
        <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${statusColor}20` }}
            >
              <Server className="w-6 h-6" style={{ color: statusColor }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{device.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span
                  className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                >
                  {getStatusLabel(device.status)}
                </span>
                <span className="text-sm text-gray-400 font-mono">{device.ip}</span>
                <span className="text-sm text-gray-500">|</span>
                <span className="text-sm text-gray-400">U{device.startU}-U{device.endU}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[calc(80vh-100px)]">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-gray-400">CPU 使用率</span>
              </div>
              <p className="text-2xl font-bold font-mono text-cyan-400">
                {device.cpuUsage.toFixed(1)}%
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-gray-400">内存使用率</span>
              </div>
              <p className="text-2xl font-bold font-mono text-purple-400">
                {device.memoryUsage.toFixed(1)}%
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-gray-400">温度</span>
              </div>
              <p
                className="text-2xl font-bold font-mono"
                style={{
                  color: device.temperature > 35 ? '#ff4444' : device.temperature > 30 ? '#ffcc00' : '#00ff88',
                }}
              >
                {device.temperature.toFixed(1)}°C
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-gray-400">功耗</span>
              </div>
              <p className="text-2xl font-bold font-mono text-yellow-400">
                {device.powerConsumption.toFixed(0)}W
              </p>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              最近 5 分钟趋势
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    fontSize={11}
                    tick={{ fill: '#64748b' }}
                    interval={10}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tick={{ fill: '#64748b' }}
                    yAxisId="left"
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tick={{ fill: '#64748b' }}
                    yAxisId="right"
                    orientation="right"
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #0891b2',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="cpu"
                    name="CPU (%)"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="temperature"
                    name="温度 (°C)"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-xs text-gray-400">设备 ID</span>
                <p className="text-sm text-white font-mono mt-1">{device.id}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">所属机柜</span>
                <p className="text-sm text-white font-mono mt-1">{device.rackId}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">网络状态</span>
                <p className="text-sm mt-1 flex items-center gap-2">
                  <Network
                    className="w-4 h-4"
                    style={{ color: device.isOnline ? '#00ff88' : '#666' }}
                  />
                  <span style={{ color: device.isOnline ? '#00ff88' : '#666' }}>
                    {device.isOnline ? '在线' : '离线'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
