import { Server, Cpu, Thermometer, AlertTriangle, Wifi, WifiOff, Zap, Gauge, Layers, Snowflake } from 'lucide-react';
import { useDataCenterStore } from '@/store/useDataCenterStore';

export const StatsBar = () => {
  const { stats } = useDataCenterStore();

  const statItems = [
    {
      label: '总设备数',
      value: stats.totalDevices,
      icon: Server,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
    },
    {
      label: '在线设备',
      value: stats.onlineDevices,
      icon: Wifi,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
    },
    {
      label: '告警设备',
      value: stats.alertDevices,
      icon: AlertTriangle,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
    },
    {
      label: '离线设备',
      value: stats.offlineDevices,
      icon: WifiOff,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
    },
    {
      label: '总功耗',
      value: `${stats.totalPower.toFixed(1)} kW`,
      icon: Zap,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
    },
    {
      label: 'PUE',
      value: stats.pue.toFixed(2),
      icon: Gauge,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
    },
    {
      label: '机柜利用率',
      value: `${stats.rackUtilization.toFixed(1)}%`,
      icon: Layers,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
    {
      label: '冷却效率',
      value: `${stats.coolingEfficiency.toFixed(1)}%`,
      icon: Snowflake,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
    },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-cyan-500/30">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Server className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">数据中心监控系统</h1>
              <p className="text-xs text-gray-400">3D Visualization Monitoring</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {statItems.map((item, index) => (
              <div
                key={index}
                className={`px-4 py-2 rounded-lg border ${item.bgColor} ${item.borderColor} transition-all duration-300 hover:scale-105`}
              >
                <div className="flex items-center gap-2">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{item.label}</p>
                    <p className={`text-lg font-bold font-mono ${item.color} transition-all duration-300`}>
                      {item.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-gray-400">系统运行中</span>
          </div>
        </div>
      </div>
    </div>
  );
};
