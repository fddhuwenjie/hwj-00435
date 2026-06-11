import { useRef, useEffect } from 'react';
import { AlertTriangle, Info, X, AlertCircle } from 'lucide-react';
import { useDataCenterStore } from '@/store/useDataCenterStore';
import { formatDateTime, alertLevelColors, getAlertLevelLabel } from '@/utils/helpers';
import { AlertLevel } from '@/types';

const alertIcons: Record<AlertLevel, typeof AlertTriangle> = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
};

export const AlertPanel = () => {
  const { alerts } = useDataCenterStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [alerts.length]);

  return (
    <div className="fixed right-4 top-20 bottom-4 z-40 w-80 flex flex-col">
      <div className="bg-slate-900/90 backdrop-blur-md rounded-t-xl border border-cyan-500/30 border-b-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <h2 className="text-white font-semibold">告警日志</h2>
            <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
              {alerts.length}
            </span>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 border-t-0 rounded-b-xl overflow-y-auto"
      >
        <div className="p-2 space-y-2">
          {alerts.map((alert, index) => {
            const Icon = alertIcons[alert.level];
            const color = alertLevelColors[alert.level];
            const isNew = index === 0;

            return (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border transition-all duration-500 ${
                  isNew
                    ? 'bg-slate-800/80 border-cyan-500/50 animate-pulse'
                    : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div
                    className="p-1.5 rounded-md"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        {getAlertLevelLabel(alert.level)}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {formatDateTime(alert.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200 font-medium mb-0.5 truncate">
                      {alert.deviceName}
                    </p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {alert.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
