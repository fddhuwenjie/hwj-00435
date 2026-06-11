import { useCallback } from 'react';
import { StatsBar } from '@/components/ui/StatsBar';
import { AlertPanel } from '@/components/ui/AlertPanel';
import { DeviceTooltip } from '@/components/ui/DeviceTooltip';
import { DeviceDetail } from '@/components/ui/DeviceDetail';
import { DataCenter } from '@/components/three/DataCenter';
import { useDataCenterStore } from '@/store/useDataCenterStore';
import { useDataSimulation } from '@/hooks/useDataSimulation';
import { ServerDevice as ServerDeviceType } from '@/types';
import { Eye, MapPin, RotateCcw } from 'lucide-react';

export const AppLayout = () => {
  const { tooltip, selectedDevice, setTooltip, selectDevice, heatMapVisible, toggleHeatMap, viewMode, resetCamera, setTopView, setViewMode } = useDataCenterStore();

  useDataSimulation();

  const handleDeviceClick = useCallback((device: ServerDeviceType) => {
    selectDevice(device);
  }, [selectDevice]);

  const handleDevicePointerOver = useCallback((e: any, device: ServerDeviceType) => {
    if (e && e.clientX !== undefined) {
      setTooltip({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        device,
      });
    }
  }, [setTooltip]);

  const handleDevicePointerOut = useCallback(() => {
    setTooltip({
      visible: false,
      x: 0,
      y: 0,
      device: null,
    });
  }, [setTooltip]);

  const handleCloseDetail = useCallback(() => {
    selectDevice(null);
  }, [selectDevice]);

  const handlePerspectiveView = () => {
    resetCamera();
  };

  const handleTopView = () => {
    setTopView();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950">
      <StatsBar />

      <div className="absolute left-4 top-24 z-30 flex flex-col gap-2">
        <button
          onClick={handlePerspectiveView}
          className={`p-3 rounded-lg border transition-all duration-300 ${
            viewMode === 'perspective'
              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
              : 'bg-slate-800/50 border-slate-700/50 text-gray-400 hover:bg-slate-700/50'
          }`}
          title="透视视图"
        >
          <Eye className="w-5 h-5" />
        </button>
        <button
          onClick={handleTopView}
          className={`p-3 rounded-lg border transition-all duration-300 ${
            viewMode === 'top'
              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
              : 'bg-slate-800/50 border-slate-700/50 text-gray-400 hover:bg-slate-700/50'
          }`}
          title="俯视视图"
        >
          <MapPin className="w-5 h-5" />
        </button>
        <button
          onClick={resetCamera}
          className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-gray-400 hover:bg-slate-700/50 transition-all duration-300"
          title="重置视角"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={toggleHeatMap}
          className={`p-3 rounded-lg border transition-all duration-300 ${
            heatMapVisible
              ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
              : 'bg-slate-800/50 border-slate-700/50 text-gray-400 hover:bg-slate-700/50'
          }`}
          title={heatMapVisible ? '隐藏热力图' : '显示热力图'}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </button>
      </div>

      <div className="absolute inset-0 pt-16 pr-88">
        <DataCenter
          onDeviceClick={handleDeviceClick}
          onDevicePointerOver={handleDevicePointerOver}
          onDevicePointerOut={handleDevicePointerOut}
        />
      </div>

      <AlertPanel />

      <DeviceTooltip
        visible={tooltip.visible}
        x={tooltip.x}
        y={tooltip.y}
        device={tooltip.device}
      />

      <DeviceDetail
        device={selectedDevice}
        onClose={handleCloseDetail}
      />

      <div className="absolute bottom-4 left-4 z-30">
        <div className="bg-slate-900/80 backdrop-blur-md rounded-lg border border-cyan-500/30 px-4 py-2">
          <p className="text-xs text-gray-400">
            <span className="text-cyan-400">提示：</span>
            鼠标拖拽旋转 | 滚轮缩放 | 点击机架聚焦 | 点击设备查看详情
          </p>
        </div>
      </div>
    </div>
  );
};
