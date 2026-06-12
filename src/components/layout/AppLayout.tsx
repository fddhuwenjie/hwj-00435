import { useCallback, useMemo } from 'react';
import { StatsBar } from '@/components/ui/StatsBar';
import { AlertPanel } from '@/components/ui/AlertPanel';
import { DeviceTooltip } from '@/components/ui/DeviceTooltip';
import { DeviceDetail } from '@/components/ui/DeviceDetail';
import { NetworkTooltip } from '@/components/ui/NetworkTooltip';
import { CapacityPlanning } from '@/components/ui/CapacityPlanning';
import { Timeline } from '@/components/ui/Timeline';
import { DataCenter } from '@/components/three/DataCenter';
import { CompareView } from '@/components/three/CompareView';
import { useDataCenterStore } from '@/store/useDataCenterStore';
import { useDataSimulation } from '@/hooks/useDataSimulation';
import { ServerDevice as ServerDeviceType, NetworkNode } from '@/types';
import { Eye, MapPin, RotateCcw, Network, Layers } from 'lucide-react';

export const AppLayout = () => {
  const {
    tooltip,
    selectedDevice,
    setTooltip,
    selectDevice,
    heatMapVisible,
    toggleHeatMap,
    viewMode,
    resetCamera,
    setTopView,
    networkViewVisible,
    toggleNetworkView,
    networkTooltip,
    setNetworkTooltip,
    planning,
    togglePlanningMode,
    timeline,
    getSnapshotAtTime,
    networkNodes,
  } = useDataCenterStore();

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

  const handleNetworkNodePointerOver = useCallback((e: any, node: NetworkNode) => {
    if (e && e.clientX !== undefined) {
      setNetworkTooltip({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        node,
        link: null,
      });
    }
  }, [setNetworkTooltip]);

  const handleNetworkNodePointerOut = useCallback(() => {
    setNetworkTooltip({
      visible: false,
      x: 0,
      y: 0,
      node: null,
      link: null,
    });
  }, [setNetworkTooltip]);

  const handleCloseDetail = useCallback(() => {
    selectDevice(null);
  }, [selectDevice]);

  const handlePerspectiveView = () => {
    resetCamera();
  };

  const handleTopView = () => {
    setTopView();
  };

  const snapshotA = useMemo(() => {
    if (timeline.mode === 'compare' && timeline.timeA) {
      return getSnapshotAtTime(timeline.timeA);
    }
    return null;
  }, [timeline.mode, timeline.timeA, getSnapshotAtTime]);

  const snapshotB = useMemo(() => {
    if (timeline.mode === 'compare' && timeline.timeB) {
      return getSnapshotAtTime(timeline.timeB);
    }
    return null;
  }, [timeline.mode, timeline.timeB, getSnapshotAtTime]);

  const isCompareMode = timeline.mode === 'compare' && snapshotA && snapshotB;

  const bottomPadding = timeline.mode === 'live' ? 'pb-0' : 'pb-28';

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
        <button
          onClick={toggleNetworkView}
          className={`p-3 rounded-lg border transition-all duration-300 ${
            networkViewVisible
              ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
              : 'bg-slate-800/50 border-slate-700/50 text-gray-400 hover:bg-slate-700/50'
          }`}
          title={networkViewVisible ? '隐藏网络拓扑' : '显示网络拓扑'}
        >
          <Network className="w-5 h-5" />
        </button>
        <button
          onClick={togglePlanningMode}
          className={`p-3 rounded-lg border transition-all duration-300 ${
            planning.isActive
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
              : 'bg-slate-800/50 border-slate-700/50 text-gray-400 hover:bg-slate-700/50'
          }`}
          title={planning.isActive ? '关闭容量规划' : '容量规划'}
        >
          <Layers className="w-5 h-5" />
        </button>
      </div>

      {planning.isActive && <CapacityPlanning />}

      {isCompareMode ? (
        <CompareView
          snapshotA={snapshotA!}
          snapshotB={snapshotB!}
          networkNodes={networkNodes}
          networkViewVisible={networkViewVisible}
        />
      ) : (
        <div className={`absolute inset-0 pt-16 pr-88 ${bottomPadding}`}>
          <DataCenter
            onDeviceClick={handleDeviceClick}
            onDevicePointerOver={handleDevicePointerOver}
            onDevicePointerOut={handleDevicePointerOut}
            onNetworkNodePointerOver={handleNetworkNodePointerOver}
            onNetworkNodePointerOut={handleNetworkNodePointerOut}
            planningMode={planning.isActive}
            plannedDevices={planning.plannedDevices}
          />
        </div>
      )}

      {!isCompareMode && <AlertPanel />}

      <DeviceTooltip
        visible={tooltip.visible}
        x={tooltip.x}
        y={tooltip.y}
        device={tooltip.device}
      />

      <NetworkTooltip
        visible={networkTooltip.visible}
        x={networkTooltip.x}
        y={networkTooltip.y}
        node={networkTooltip.node}
        link={networkTooltip.link}
      />

      <DeviceDetail
        device={selectedDevice}
        onClose={handleCloseDetail}
      />

      <Timeline />

      {timeline.mode === 'live' && (
        <div className="absolute bottom-4 left-4 z-30">
          <div className="bg-slate-900/80 backdrop-blur-md rounded-lg border border-cyan-500/30 px-4 py-2">
            <p className="text-xs text-gray-400">
              <span className="text-cyan-400">提示：</span>
              鼠标拖拽旋转 | 滚轮缩放 | 点击机架聚焦 | 点击设备查看详情
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
