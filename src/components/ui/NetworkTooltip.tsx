import { NetworkNode, NetworkLink } from '@/types';
import { Wifi, WifiOff, Activity, Server, AlertTriangle } from 'lucide-react';

interface NetworkTooltipProps {
  visible: boolean;
  x: number;
  y: number;
  node: NetworkNode | null;
  link: NetworkLink | null;
}

export const NetworkTooltip = ({ visible, x, y, node, link }: NetworkTooltipProps) => {
  if (!visible || (!node && !link)) return null;

  if (node) {
    return (
      <div
        className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full"
        style={{
          left: x,
          top: y - 10,
        }}
      >
        <div className="relative bg-slate-900/95 backdrop-blur-md border border-cyan-500/50 rounded-xl p-4 min-w-[240px] shadow-2xl shadow-cyan-500/20">
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-slate-900/95 border-r border-b border-cyan-500/50 rotate-45" />

          <div className="flex items-start gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: node.isOnline ? '#00d4ff20' : '#ff444420' }}
            >
              {node.isOnline ? (
                <Wifi className="w-5 h-5 text-cyan-400" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold truncate">网络节点 - {node.rackId}</p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    node.isOnline
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {node.isOnline ? '在线' : '离线'}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700/50 pt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Server className="w-4 h-4" />
                <span>IP 地址</span>
              </div>
              <span className="text-white font-mono">{node.ip}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Activity className="w-4 h-4" />
                <span>带宽</span>
              </div>
              <span className="text-white font-mono">{node.bandwidth} Gbps</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <AlertTriangle className="w-4 h-4" />
                <span>丢包率</span>
              </div>
              <span
                className="font-mono"
                style={{
                  color: node.packetLossRate > 2 ? '#ff4444' : node.packetLossRate > 1 ? '#ffcc00' : '#00ff88',
                }}
              >
                {node.packetLossRate.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="absolute top-0 left-0 w-full h-1 rounded-t-xl overflow-hidden">
            <div
              className="h-full"
              style={{
                background: `linear-gradient(90deg, ${node.isOnline ? '#00d4ff40' : '#ff444440'}, transparent)`,
                opacity: 0.5,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (link) {
    const utilizationColor =
      link.bandwidthUtilization > 80 ? '#ff4444' :
      link.bandwidthUtilization > 50 ? '#ffcc00' : '#00ff88';

    return (
      <div
        className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full"
        style={{
          left: x,
          top: y - 10,
        }}
      >
        <div className="relative bg-slate-900/95 backdrop-blur-md border border-cyan-500/50 rounded-xl p-4 min-w-[240px] shadow-2xl shadow-cyan-500/20">
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-slate-900/95 border-r border-b border-cyan-500/50 rotate-45" />

          <div className="flex items-start gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${utilizationColor}20` }}
            >
              <Activity className="w-5 h-5" style={{ color: utilizationColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold truncate">网络链路</p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: `${utilizationColor}20`, color: utilizationColor }}
                >
                  {link.status === 'disconnected' ? '已断开' :
                   link.status === 'critical' ? '高负载' :
                   link.status === 'warning' ? '中负载' : '正常'}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700/50 pt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">带宽利用率</span>
              <span className="text-white font-mono">{link.bandwidthUtilization.toFixed(1)}%</span>
            </div>

            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${link.bandwidthUtilization}%`,
                  backgroundColor: utilizationColor,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">流量</span>
              <span className="text-white font-mono">{link.trafficFlow.toFixed(2)} Gbps</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
