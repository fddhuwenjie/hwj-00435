import { useState } from 'react';
import {
  Server,
  Cpu,
  HardDrive,
  Zap,
  Thermometer,
  X,
  Trash2,
  Plus,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { useDataCenterStore } from '@/store/useDataCenterStore';
import { VirtualDevice, VirtualDeviceSize, ServerRack } from '@/types';

const deviceIcons: Record<string, typeof Server> = {
  server: Server,
  gpu: Cpu,
  storage: HardDrive,
  ai: Cpu,
};

const sizeColors: Record<VirtualDeviceSize, string> = {
  '1U': 'text-green-400 border-green-500/30 bg-green-500/10',
  '2U': 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  '4U': 'text-orange-400 border-orange-500/30 bg-orange-500/10',
};

export const CapacityPlanning = () => {
  const {
    planning,
    virtualDevices,
    racks,
    togglePlanningMode,
    selectVirtualDevice,
    addPlannedDevice,
    removePlannedDevice,
    clearPlannedDevices,
    calculateRackPlanningInfo,
  } = useDataCenterStore();

  const [targetRackId, setTargetRackId] = useState<string | null>(null);
  const [targetStartU, setTargetStartU] = useState<number>(1);

  const handleSelectDevice = (device: VirtualDevice) => {
    if (planning.selectedVirtualDevice?.id === device.id) {
      selectVirtualDevice(null);
    } else {
      selectVirtualDevice(device);
    }
  };

  const handleAddToRack = () => {
    if (!planning.selectedVirtualDevice || !targetRackId) return;

    const uCount = planning.selectedVirtualDevice.size === '1U' ? 1 :
                   planning.selectedVirtualDevice.size === '2U' ? 2 : 4;

    const rack = racks.find((r) => r.id === targetRackId);
    if (!rack) return;

    const rackPlannedDevices = planning.plannedDevices.filter((d) => d.rackId === targetRackId);
    const allUsedU = new Set<number>();

    rack.devices.forEach((d) => {
      for (let u = d.startU; u <= d.endU; u++) allUsedU.add(u);
    });
    rackPlannedDevices.forEach((d) => {
      for (let u = d.startU; u <= d.endU; u++) allUsedU.add(u);
    });

    let startU = targetStartU;
    let found = false;

    for (let u = 1; u <= rack.totalU - uCount + 1; u++) {
      let available = true;
      for (let i = 0; i < uCount; i++) {
        if (allUsedU.has(u + i)) {
          available = false;
          break;
        }
      }
      if (available) {
        startU = u;
        found = true;
        break;
      }
    }

    if (!found) {
      return;
    }

    addPlannedDevice(targetRackId, startU, planning.selectedVirtualDevice);
  };

  const getAvailableUOptions = (rack: ServerRack) => {
    const options: number[] = [];
    if (!planning.selectedVirtualDevice) return options;

    const uCount = planning.selectedVirtualDevice.size === '1U' ? 1 :
                   planning.selectedVirtualDevice.size === '2U' ? 2 : 4;

    const rackPlannedDevices = planning.plannedDevices.filter((d) => d.rackId === rack.id);
    const allUsedU = new Set<number>();

    rack.devices.forEach((d) => {
      for (let u = d.startU; u <= d.endU; u++) allUsedU.add(u);
    });
    rackPlannedDevices.forEach((d) => {
      for (let u = d.startU; u <= d.endU; u++) allUsedU.add(u);
    });

    for (let u = 1; u <= rack.totalU - uCount + 1; u++) {
      let available = true;
      for (let i = 0; i < uCount; i++) {
        if (allUsedU.has(u + i)) {
          available = false;
          break;
        }
      }
      if (available) {
        options.push(u);
      }
    }

    return options;
  };

  const totalPlannedPower = planning.plannedDevices.reduce((sum, d) => sum + d.powerConsumption, 0);
  const totalPlannedU = planning.plannedDevices.reduce((sum, d) => sum + (d.endU - d.startU + 1), 0);

  if (!planning.isActive) return null;

  return (
    <div className="fixed left-4 top-20 z-40 w-80 flex flex-col max-h-[calc(100vh-120px)]">
      <div className="bg-slate-900/90 backdrop-blur-md rounded-t-xl border border-cyan-500/30 border-b-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-white font-semibold">容量规划</h2>
            <span className="px-2 py-0.5 text-xs rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              模拟
            </span>
          </div>
          <button
            onClick={togglePlanningMode}
            className="p-1 rounded hover:bg-slate-700/50 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 border-t-0 rounded-b-xl overflow-y-auto">
        <div className="p-3 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2">可用设备</h3>
            <div className="space-y-2">
              {virtualDevices.map((device) => {
                const Icon = deviceIcons[device.type] || Server;
                const isSelected = planning.selectedVirtualDevice?.id === device.id;
                return (
                  <div
                    key={device.id}
                    onClick={() => handleSelectDevice(device)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-500/50'
                        : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg border ${sizeColors[device.size]}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white truncate">{device.name}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${sizeColors[device.size]}`}>
                            {device.size}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-orange-400" />
                            {device.powerConsumption}W
                          </span>
                          <span className="flex items-center gap-1">
                            <Thermometer className="w-3 h-3 text-red-400" />
                            {device.heatOutput}W
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {planning.selectedVirtualDevice && (
            <div className="border-t border-slate-700/50 pt-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">部署到机柜</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">选择机柜</label>
                  <select
                    value={targetRackId || ''}
                    onChange={(e) => {
                      setTargetRackId(e.target.value || null);
                      const options = getAvailableUOptions(racks.find((r) => r.id === e.target.value)!);
                      if (options.length > 0) setTargetStartU(options[0]);
                    }}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="">-- 选择机柜 --</option>
                    {racks.map((rack) => (
                      <option key={rack.id} value={rack.id}>
                        {rack.id} ({rack.usedU}/{rack.totalU}U 已用)
                      </option>
                    ))}
                  </select>
                </div>

                {targetRackId && (
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">起始U位</label>
                    <select
                      value={targetStartU}
                      onChange={(e) => setTargetStartU(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500/50"
                    >
                      {getAvailableUOptions(racks.find((r) => r.id === targetRackId)!).map((u) => (
                        <option key={u} value={u}>
                          U{u} - U{u + (planning.selectedVirtualDevice?.size === '1U' ? 0 : planning.selectedVirtualDevice?.size === '2U' ? 1 : 3)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {targetRackId && (() => {
                  const info = calculateRackPlanningInfo(targetRackId);
                  const rack = racks.find((r) => r.id === targetRackId);
                  const uCount = planning.selectedVirtualDevice.size === '1U' ? 1 :
                                 planning.selectedVirtualDevice.size === '2U' ? 2 : 4;
                  const willExceedPower = info.estimatedPower + planning.selectedVirtualDevice.powerConsumption > (rack?.maxPower || 8000);
                  const willExceedTemp = info.estimatedTemperature + (planning.selectedVirtualDevice.heatOutput / 1000) * 3 > (rack?.maxTemperature || 35);
                  const willExceedU = info.remainingU - uCount < 0;
                  const canDeploy = !willExceedPower && !willExceedTemp && !willExceedU;

                  return (
                    <>
                      <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 space-y-2">
                        <p className="text-xs text-gray-400">部署预估影响</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">功耗</span>
                          <span className={willExceedPower ? 'text-red-400 font-medium' : 'text-white'}>
                            {(info.estimatedPower + planning.selectedVirtualDevice.powerConsumption).toFixed(0)}W
                            <span className="text-gray-500"> / {rack?.maxPower || 8000}W</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">剩余U位</span>
                          <span className={willExceedU ? 'text-red-400 font-medium' : 'text-white'}>
                            {info.remainingU - uCount}U
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">预估温度</span>
                          <span className={willExceedTemp ? 'text-red-400 font-medium' : 'text-white'}>
                            {(info.estimatedTemperature + (planning.selectedVirtualDevice.heatOutput / 1000) * 3).toFixed(1)}°C
                            <span className="text-gray-500"> / {rack?.maxTemperature || 35}°C</span>
                          </span>
                        </div>
                      </div>

                      {(willExceedPower || willExceedTemp || willExceedU) && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-400">无法部署</p>
                            <p className="text-xs text-red-300/80 mt-0.5">
                              {willExceedPower && '超出机柜功率上限。'}
                              {willExceedTemp && '超出温度安全阈值。'}
                              {willExceedU && 'U位空间不足。'}
                            </p>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleAddToRack}
                        disabled={!canDeploy}
                        className={`w-full py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                          canDeploy
                            ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30'
                            : 'bg-gray-700/20 border border-gray-600/30 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        添加设备
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {planning.plannedDevices.length > 0 && (
            <div className="border-t border-slate-700/50 pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-300">已规划设备 ({planning.plannedDevices.length})</h3>
                <button
                  onClick={clearPlannedDevices}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  清空
                </button>
              </div>
              <div className="space-y-2">
                {planning.plannedDevices.map((planned) => {
                  const vDev = virtualDevices.find((v) => v.id === planned.virtualDeviceId);
                  const Icon = vDev ? (deviceIcons[vDev.type] || Server) : Server;
                  return (
                    <div
                      key={planned.id}
                      className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center gap-2"
                    >
                      <div className="p-1.5 rounded bg-cyan-500/10">
                        <Icon className="w-3 h-3 text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">
                          {vDev?.name || '未知设备'}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {planned.rackId} · U{planned.startU}-U{planned.endU}
                        </p>
                      </div>
                      <button
                        onClick={() => removePlannedDevice(planned.id)}
                        className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t border-slate-700/50 pt-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">规划汇总</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <div className="flex items-center gap-1.5 text-orange-400 mb-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase tracking-wider">新增功耗</span>
                </div>
                <p className="text-lg font-bold text-white font-mono">
                  {(totalPlannedPower / 1000).toFixed(2)} kW
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <div className="flex items-center gap-1.5 text-cyan-400 mb-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase tracking-wider">新增U位</span>
                </div>
                <p className="text-lg font-bold text-white font-mono">{totalPlannedU} U</p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
            <p className="text-xs text-cyan-300">
              <span className="font-medium">提示：</span>
              所有规划数据均为模拟，不影响实际运行数据。可随时清空重新规划。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
