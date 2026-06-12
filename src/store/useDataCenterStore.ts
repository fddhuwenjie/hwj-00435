import { create } from 'zustand';
import {
  ServerRack,
  ServerDevice,
  Alert,
  DataCenterStats,
  ViewMode,
  TooltipData,
  DeviceStatus,
  HistoryData,
  NetworkNode,
  NetworkLink,
  LinkStatus,
  VirtualDevice,
  VirtualDeviceSize,
  PlannedDevice,
  PlanningState,
  PlanningRackInfo,
  HistorySnapshot,
  TimelineState,
  PlaybackMode,
  NetworkTooltipData,
} from '@/types';
import { generateId, clamp } from '@/utils/helpers';

const RACKS_PER_ROW = 8;
const ROWS_COUNT = 4;
const U_PER_RACK = 42;
const HISTORY_LENGTH = 100;

const generateInitialRacks = (): ServerRack[] => {
  const racks: ServerRack[] = [];
  const rackWidth = 0.6;
  const rackDepth = 1.0;
  const coldAisleWidth = 2.0;
  const hotAisleWidth = 1.5;

  for (let row = 0; row < ROWS_COUNT; row++) {
    for (let col = 0; col < RACKS_PER_ROW; col++) {
      const isEvenRow = row % 2 === 0;
      const zOffset = Math.floor(row / 2) * (rackDepth + coldAisleWidth + rackDepth + hotAisleWidth);
      const positionZ = isEvenRow ? zOffset : zOffset + rackDepth + coldAisleWidth;
      const positionX = col * (rackWidth + 0.2) - (RACKS_PER_ROW * (rackWidth + 0.2)) / 2 + rackWidth / 2;

      const rackId = `R-${row + 1}-${col + 1}`;
      const devices = generateDevicesForRack(rackId, row, col);

      const usedU = devices.reduce((sum, d) => sum + (d.endU - d.startU + 1), 0);
      const maxTemp = devices.length > 0 ? Math.max(...devices.map((d) => d.temperature)) : 22;

      racks.push({
        id: rackId,
        row,
        column: col,
        positionX,
        positionZ,
        topTemperature: maxTemp + 2 + Math.random() * 3,
        devices,
        usedU,
        totalU: U_PER_RACK,
      });
    }
  }
  return racks;
};

const generateDevicesForRack = (
  rackId: string,
  row: number,
  col: number
): ServerDevice[] => {
  const devices: ServerDevice[] = [];
  let currentU = 1;
  const deviceCount = 18 + Math.floor(Math.random() * 5);

  for (let i = 0; i < deviceCount && currentU <= U_PER_RACK; i++) {
    const uSize = Math.random() > 0.7 ? 4 : Math.random() > 0.5 ? 2 : 1;
    if (currentU + uSize - 1 > U_PER_RACK) break;

    const isHotRow = row % 2 === 1;
    const baseTemp = isHotRow ? 26 : 22;
    const tempVariation = Math.random() * 8;

    const statusRoll = Math.random();
    let status: DeviceStatus = 'running';
    let isOnline = true;

    if (statusRoll > 0.95) {
      status = 'fault';
    } else if (statusRoll > 0.85) {
      status = 'warning';
    } else if (statusRoll > 0.8) {
      status = 'idle';
      isOnline = Math.random() > 0.3;
    }

    const deviceId = `${rackId}-D${i + 1}`;
    const history: HistoryData[] = [];
    const now = Date.now();
    const baseCpu = 30 + Math.random() * 40;
    const deviceBaseTemp = baseTemp + tempVariation;

    for (let h = HISTORY_LENGTH - 1; h >= 0; h--) {
      history.push({
        timestamp: now - h * 3000,
        cpuUsage: clamp(baseCpu + (Math.random() - 0.5) * 20, 0, 100),
        temperature: clamp(deviceBaseTemp + (Math.random() - 0.5) * 4, 18, 40),
      });
    }

    devices.push({
      id: deviceId,
      rackId,
      name: `服务器-${row + 1}-${col + 1}-${i + 1}`,
      ip: `192.168.${10 + row}.${col * 20 + i + 1}`,
      startU: currentU,
      endU: currentU + uSize - 1,
      status,
      cpuUsage: history[history.length - 1].cpuUsage,
      memoryUsage: clamp(40 + Math.random() * 40, 0, 100),
      temperature: history[history.length - 1].temperature,
      powerConsumption: 200 + Math.random() * 400,
      isOnline: status === 'idle' ? isOnline : true,
      history,
    });

    currentU += uSize + (Math.random() > 0.7 ? 1 : 0);
  }

  return devices;
};

const generateNetworkNodes = (racks: ServerRack[]): NetworkNode[] => {
  return racks.map((rack) => ({
    id: `NET-${rack.id}`,
    rackId: rack.id,
    positionX: rack.positionX,
    positionY: 2.8,
    positionZ: rack.positionZ,
    ip: `10.0.${rack.row + 1}.${rack.column + 1}`,
    bandwidth: 10,
    packetLossRate: Math.random() * 0.5,
    isOnline: true,
  }));
};

const generateNetworkLinks = (racks: ServerRack[]): NetworkLink[] => {
  const links: NetworkLink[] = [];

  racks.forEach((rack) => {
    const rightRack = racks.find(
      (r) => r.row === rack.row && r.column === rack.column + 1
    );
    if (rightRack) {
      const utilization = 20 + Math.random() * 60;
      let status: LinkStatus = 'normal';
      if (utilization > 80) status = 'critical';
      else if (utilization > 50) status = 'warning';

      links.push({
        id: `LINK-${rack.id}-${rightRack.id}`,
        fromNodeId: `NET-${rack.id}`,
        toNodeId: `NET-${rightRack.id}`,
        bandwidthUtilization: utilization,
        trafficFlow: 1 + Math.random() * 5,
        status,
      });
    }

    if (rack.row % 2 === 0 && rack.row < ROWS_COUNT - 1) {
      const nextRowRack = racks.find(
        (r) => r.row === rack.row + 1 && r.column === rack.column
      );
      if (nextRowRack) {
        const utilization = 30 + Math.random() * 50;
        let status: LinkStatus = 'normal';
        if (utilization > 80) status = 'critical';
        else if (utilization > 50) status = 'warning';
        if (Math.random() > 0.9) status = 'disconnected';

        links.push({
          id: `LINK-${rack.id}-${nextRowRack.id}`,
          fromNodeId: `NET-${rack.id}`,
          toNodeId: `NET-${nextRowRack.id}`,
          bandwidthUtilization: utilization,
          trafficFlow: 2 + Math.random() * 4,
          status,
        });
      }
    }
  });

  return links;
};

const VIRTUAL_DEVICES: VirtualDevice[] = [
  {
    id: 'VIRT-1U-STD',
    name: '标准1U服务器',
    size: '1U',
    powerConsumption: 300,
    heatOutput: 250,
    type: 'server',
  },
  {
    id: 'VIRT-1U-HIGH',
    name: '高性能1U服务器',
    size: '1U',
    powerConsumption: 500,
    heatOutput: 420,
    type: 'server',
  },
  {
    id: 'VIRT-2U-STD',
    name: '标准2U服务器',
    size: '2U',
    powerConsumption: 600,
    heatOutput: 500,
    type: 'server',
  },
  {
    id: 'VIRT-2U-GPU',
    name: 'GPU服务器2U',
    size: '2U',
    powerConsumption: 1200,
    heatOutput: 1000,
    type: 'gpu',
  },
  {
    id: 'VIRT-4U-STORAGE',
    name: '存储服务器4U',
    size: '4U',
    powerConsumption: 800,
    heatOutput: 650,
    type: 'storage',
  },
  {
    id: 'VIRT-4U-AI',
    name: 'AI训练服务器4U',
    size: '4U',
    powerConsumption: 2000,
    heatOutput: 1700,
    type: 'ai',
  },
];

const generateHistorySnapshots = (racks: ServerRack[], alerts: Alert[], stats: DataCenterStats): HistorySnapshot[] => {
  const snapshots: HistorySnapshot[] = [];
  const now = Date.now();
  const SNAPSHOT_COUNT = 24;

  for (let i = SNAPSHOT_COUNT - 1; i >= 0; i--) {
    const timestamp = now - i * 60 * 60 * 1000;

    const snapshotRacks: ServerRack[] = racks.map((rack) => ({
      ...rack,
      topTemperature: rack.topTemperature + (Math.random() - 0.5) * 6,
      devices: rack.devices.map((device) => {
        let newStatus: DeviceStatus = device.status;
        if (device.status === 'fault') {
          newStatus = Math.random() > 0.3 ? 'fault' : 'warning';
        } else if (device.status === 'warning') {
          newStatus = Math.random() > 0.5 ? 'warning' : 'running';
        } else {
          newStatus = Math.random() > 0.9 ? 'warning' : 'running';
        }
        return {
          ...device,
          cpuUsage: clamp(device.cpuUsage + (Math.random() - 0.5) * 30, 5, 95),
          temperature: clamp(device.temperature + (Math.random() - 0.5) * 8, 18, 42),
          powerConsumption: clamp(device.powerConsumption + (Math.random() - 0.5) * 100, 150, 650),
          status: newStatus,
          isOnline: device.isOnline || Math.random() > 0.1,
        };
      }),
    }));

    snapshots.push({
      timestamp,
      racks: snapshotRacks,
      alerts: alerts.slice(0, 3),
      stats: {
        ...stats,
        totalPower: stats.totalPower * (0.8 + Math.random() * 0.4),
        rackUtilization: clamp(stats.rackUtilization + (Math.random() - 0.5) * 10, 30, 90),
        coolingEfficiency: clamp(stats.coolingEfficiency + (Math.random() - 0.5) * 15, 60, 95),
      },
    });
  }

  return snapshots;
};

const getUCount = (size: VirtualDeviceSize): number => {
  switch (size) {
    case '1U': return 1;
    case '2U': return 2;
    case '4U': return 4;
    default: return 1;
  }
};

interface CameraTarget {
  position: { x: number; y: number; z: number } | null;
  lookAt: { x: number; y: number; z: number } | null;
}

interface DataCenterState {
  racks: ServerRack[];
  alerts: Alert[];
  stats: DataCenterStats;
  selectedDevice: ServerDevice | null;
  selectedRackId: string | null;
  tooltip: TooltipData;
  viewMode: ViewMode;
  heatMapVisible: boolean;
  focusRackId: string | null;
  cameraTarget: CameraTarget;

  networkNodes: NetworkNode[];
  networkLinks: NetworkLink[];
  networkViewVisible: boolean;
  networkTooltip: NetworkTooltipData;

  planning: PlanningState;
  virtualDevices: VirtualDevice[];

  timeline: TimelineState;

  updateDeviceData: () => void;
  updateNetworkData: () => void;
  triggerRandomAlert: () => void;
  selectDevice: (device: ServerDevice | null) => void;
  selectRack: (rackId: ServerRack | null) => void;
  setTooltip: (tooltip: TooltipData) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleHeatMap: () => void;
  setFocusRackId: (rackId: string | null) => void;
  setCameraTarget: (target: CameraTarget) => void;
  resetCamera: () => void;
  setTopView: () => void;
  addAlert: (alert: Alert) => void;

  toggleNetworkView: () => void;
  setNetworkTooltip: (tooltip: NetworkTooltipData) => void;

  togglePlanningMode: () => void;
  selectVirtualDevice: (device: VirtualDevice | null) => void;
  addPlannedDevice: (rackId: string, startU: number, virtualDevice: VirtualDevice) => boolean;
  removePlannedDevice: (plannedDeviceId: string) => void;
  clearPlannedDevices: () => void;
  calculateRackPlanningInfo: (rackId: string) => PlanningRackInfo;

  setPlaybackMode: (mode: PlaybackMode) => void;
  setCurrentTime: (time: number | ((prev: number) => number)) => void;
  setTimeA: (time: number | null) => void;
  setTimeB: (time: number | null) => void;
  togglePlayback: () => void;
  setPlaybackSpeed: (speed: number) => void;
  getSnapshotAtTime: (time: number) => HistorySnapshot | null;
}

const calculateStats = (racks: ServerRack[]): DataCenterStats => {
  const allDevices = racks.flatMap((r) => r.devices);
  const totalDevices = allDevices.length;
  const onlineDevices = allDevices.filter((d) => d.isOnline).length;
  const alertDevices = allDevices.filter((d) => d.status === 'warning' || d.status === 'fault').length;
  const offlineDevices = allDevices.filter((d) => !d.isOnline).length;
  const totalPower = allDevices.reduce((sum, d) => sum + d.powerConsumption, 0) / 1000;
  const totalUsedU = racks.reduce((sum, r) => sum + r.usedU, 0);
  const totalU = racks.reduce((sum, r) => sum + r.totalU, 0);
  const pue = 1.3 + Math.random() * 0.2;
  const coolingEfficiency = 80 + Math.random() * 10;

  return {
    totalDevices,
    onlineDevices,
    alertDevices,
    offlineDevices,
    totalPower,
    pue,
    rackUtilization: (totalUsedU / totalU) * 100,
    coolingEfficiency,
  };
};

export const useDataCenterStore = create<DataCenterState>((set, get) => ({
  racks: generateInitialRacks(),
  alerts: [
    {
      id: generateId(),
      deviceId: 'INIT-1',
      deviceName: '系统初始化',
      type: 'info',
      level: 'info',
      message: '数据中心监控系统已启动',
      timestamp: Date.now(),
    },
  ],
  stats: calculateStats(generateInitialRacks()),
  selectedDevice: null,
  selectedRackId: null,
  tooltip: { visible: false, x: 0, y: 0, device: null },
  viewMode: 'perspective',
  heatMapVisible: true,
  focusRackId: null,
  cameraTarget: { position: null, lookAt: null },

  updateDeviceData: () => {
    const { racks } = get();
    const now = Date.now();

    const updatedRacks = racks.map((rack) => {
      const updatedDevices = rack.devices.map((device) => {
        if (!device.isOnline && device.status !== 'fault') {
          return device;
        }

        const cpuDelta = (Math.random() - 0.5) * 10;
        const tempDelta = (Math.random() - 0.5) * 2;

        let newCpu = clamp(device.cpuUsage + cpuDelta, 5, 95);
        let newTemp = clamp(device.temperature + tempDelta, 18, 42);

        if (device.status === 'fault') {
          newTemp = clamp(newTemp, 35, 45);
          newCpu = clamp(newCpu, 80, 100);
        }

        const newHistory = [...device.history.slice(1), {
          timestamp: now,
          cpuUsage: newCpu,
          temperature: newTemp,
        }];

        let newStatus = device.status;
        if (device.status !== 'fault' && device.status !== 'idle') {
          if (newTemp > 35 || newCpu > 90) {
            newStatus = 'warning';
          } else if (newTemp > 38) {
            newStatus = 'fault';
          } else {
            newStatus = 'running';
          }
        }

        return {
          ...device,
          cpuUsage: newCpu,
          memoryUsage: clamp(device.memoryUsage + (Math.random() - 0.5) * 5, 20, 95),
          temperature: newTemp,
          powerConsumption: clamp(device.powerConsumption + (Math.random() - 0.5) * 20, 150, 650),
          status: newStatus,
          history: newHistory,
        };
      });

      const maxTemp = updatedDevices.length > 0
        ? Math.max(...updatedDevices.map((d) => d.temperature))
        : 22;

      return {
        ...rack,
        devices: updatedDevices,
        topTemperature: maxTemp + 2 + Math.random() * 2,
        usedU: updatedDevices.reduce((sum, d) => sum + (d.endU - d.startU + 1), 0),
      };
    });

    set({
      racks: updatedRacks,
      stats: calculateStats(updatedRacks),
    });
  },

  triggerRandomAlert: () => {
    const { racks, addAlert } = get();
    const allDevices = racks.flatMap((r) => r.devices).filter((d) => d.isOnline);
    if (allDevices.length === 0) return;

    const randomDevice = allDevices[Math.floor(Math.random() * allDevices.length)];
    const alertType = Math.random();

    if (alertType > 0.7) {
      const updatedRacks = racks.map((rack) => {
        if (rack.id !== randomDevice.rackId) return rack;
        return {
          ...rack,
          devices: rack.devices.map((d) => {
            if (d.id !== randomDevice.id) return d;
            return {
              ...d,
              temperature: clamp(d.temperature + 10 + Math.random() * 5, 38, 45),
              status: 'fault' as const,
            };
          }),
        };
      });

      addAlert({
        id: generateId(),
        deviceId: randomDevice.id,
        deviceName: randomDevice.name,
        type: 'temperature',
        level: 'critical',
        message: `${randomDevice.name} 温度飙升，当前温度超过安全阈值！`,
        timestamp: Date.now(),
      });

      set({ racks: updatedRacks });
    } else if (alertType > 0.4) {
      const updatedRacks = racks.map((rack) => {
        if (rack.id !== randomDevice.rackId) return rack;
        return {
          ...rack,
          devices: rack.devices.map((d) => {
            if (d.id !== randomDevice.id) return d;
            return {
              ...d,
              isOnline: false,
              status: 'fault' as const,
            };
          }),
        };
      });

      addAlert({
        id: generateId(),
        deviceId: randomDevice.id,
        deviceName: randomDevice.name,
        type: 'offline',
        level: 'critical',
        message: `${randomDevice.name} 设备离线，连接中断！`,
        timestamp: Date.now(),
      });

      set({ racks: updatedRacks });
    } else {
      addAlert({
        id: generateId(),
        deviceId: randomDevice.id,
        deviceName: randomDevice.name,
        type: 'cpu',
        level: 'warning',
        message: `${randomDevice.name} CPU使用率持续偏高，请注意监控`,
        timestamp: Date.now(),
      });
    }
  },

  selectDevice: (device) => set({ selectedDevice: device }),
  selectRack: (rack) => {
    if (rack) {
      set({
        selectedRackId: rack.id,
        focusRackId: rack.id,
        cameraTarget: {
          position: { x: rack.positionX + 3, y: 2.5, z: rack.positionZ + 3 },
          lookAt: { x: rack.positionX, y: 1, z: rack.positionZ },
        },
      });
    } else {
      set({
        selectedRackId: null,
        focusRackId: null,
      });
    }
  },
  setTooltip: (tooltip) => set({ tooltip }),
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleHeatMap: () => set((state) => ({ heatMapVisible: !state.heatMapVisible })),
  setFocusRackId: (rackId) => set({ focusRackId: rackId }),
  setCameraTarget: (target) => set({ cameraTarget: target }),
  resetCamera: () => set({
    cameraTarget: {
      position: { x: 15, y: 12, z: 15 },
      lookAt: { x: 0, y: 1, z: 0 },
    },
    viewMode: 'perspective',
  }),
  setTopView: () => set({
    cameraTarget: {
      position: { x: 0, y: 25, z: 0.01 },
      lookAt: { x: 0, y: 0, z: 0 },
    },
    viewMode: 'top',
  }),

  addAlert: (alert) => {
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 100),
    }));
  },

  networkNodes: generateNetworkNodes(generateInitialRacks()),
  networkLinks: generateNetworkLinks(generateInitialRacks()),
  networkViewVisible: false,
  networkTooltip: { visible: false, x: 0, y: 0, node: null, link: null },

  updateNetworkData: () => {
    const { networkLinks, networkNodes } = get();
    const updatedLinks = networkLinks.map((link) => {
      const delta = (Math.random() - 0.5) * 15;
      const newUtilization = clamp(link.bandwidthUtilization + delta, 5, 95);
      let status: LinkStatus;
      if (newUtilization > 80) status = 'critical';
      else if (newUtilization > 50) status = 'warning';
      else status = 'normal';

      const wasDisconnected = link.status === 'disconnected';
      if (wasDisconnected && Math.random() > 0.95) {
        status = 'normal';
      } else if (wasDisconnected) {
        status = 'disconnected';
      }

      if (status !== 'disconnected' && Math.random() > 0.98) {
        status = 'disconnected';
      }
      return {
        ...link,
        bandwidthUtilization: newUtilization,
        trafficFlow: clamp(link.trafficFlow + (Math.random() - 0.5) * 1, 0.5, 8),
        status,
      };
    });

    const updatedNodes = networkNodes.map((node) => ({
      ...node,
      packetLossRate: clamp(node.packetLossRate + (Math.random() - 0.5) * 0.2, 0, 5),
    }));

    set({ networkLinks: updatedLinks, networkNodes: updatedNodes });
  },

  toggleNetworkView: () => set((state) => ({ networkViewVisible: !state.networkViewVisible })),
  setNetworkTooltip: (tooltip) => set({ networkTooltip: tooltip }),

  virtualDevices: VIRTUAL_DEVICES,
  planning: {
    isActive: false,
    plannedDevices: [],
    selectedVirtualDevice: null,
    rackInfos: {},
  },

  togglePlanningMode: () => set((state) => ({
    planning: { ...state.planning, isActive: !state.planning.isActive },
  })),

  selectVirtualDevice: (device) => set((state) => ({
    planning: { ...state.planning, selectedVirtualDevice: device },
  })),

  calculateRackPlanningInfo: (rackId) => {
    const { racks, planning } = get();
    const rack = racks.find((r) => r.id === rackId);
    if (!rack) {
      return {
        rackId,
        estimatedPower: 0,
        remainingU: 0,
        estimatedTemperature: 0,
        isOverCapacity: false,
        isOverTemperature: false,
      };
    }

    const rackPlannedDevices = planning.plannedDevices.filter((d) => d.rackId === rackId);
    const currentPower = rack.devices.reduce((sum, d) => sum + d.powerConsumption, 0);
    const plannedPower = rackPlannedDevices.reduce((sum, d) => sum + d.powerConsumption, 0);
    const totalPower = currentPower + plannedPower;

    const plannedUsedU = rackPlannedDevices.reduce((sum, d) => sum + (d.endU - d.startU + 1), 0);
    const remainingU = rack.totalU - rack.usedU - plannedUsedU;

    const currentHeat = rack.devices.reduce((sum, d) => sum + d.powerConsumption * 0.8, 0);
    const plannedHeat = rackPlannedDevices.reduce((sum, d) => sum + d.heatOutput, 0);
    const baseTemp = 22;
    const tempIncrease = ((currentHeat + plannedHeat) / 1000) * 3;
    const estimatedTemperature = baseTemp + tempIncrease;

    const maxPower = rack.maxPower || 8000;
    const maxTemp = rack.maxTemperature || 35;

    return {
      rackId,
      estimatedPower: totalPower,
      remainingU,
      estimatedTemperature,
      isOverCapacity: totalPower > maxPower || remainingU < 0,
      isOverTemperature: estimatedTemperature > maxTemp,
    };
  },

  addPlannedDevice: (rackId, startU, virtualDevice) => {
    const { racks, planning } = get();
    const rack = racks.find((r) => r.id === rackId);
    if (!rack) return false;

    const uCount = getUCount(virtualDevice.size);
    const endU = startU + uCount - 1;

    if (endU > rack.totalU) return false;

    const rackPlannedDevices = planning.plannedDevices.filter((d) => d.rackId === rackId);
    const allUsedU = new Set<number>();

    rack.devices.forEach((d) => {
      for (let u = d.startU; u <= d.endU; u++) allUsedU.add(u);
    });
    rackPlannedDevices.forEach((d) => {
      for (let u = d.startU; u <= d.endU; u++) allUsedU.add(u);
    });

    for (let u = startU; u <= endU; u++) {
      if (allUsedU.has(u)) return false;
    }

    const newPlannedDevice: PlannedDevice = {
      id: `PLAN-${generateId()}`,
      virtualDeviceId: virtualDevice.id,
      rackId,
      startU,
      endU,
      powerConsumption: virtualDevice.powerConsumption,
      heatOutput: virtualDevice.heatOutput,
    };

    const newPlannedDevices = [...planning.plannedDevices, newPlannedDevice];

    const rackInfos = { ...planning.rackInfos };
    const newInfo = get().calculateRackPlanningInfo(rackId);
    rackInfos[rackId] = newInfo;

    if (newInfo.isOverCapacity || newInfo.isOverTemperature) {
      return false;
    }

    set((state) => ({
      planning: {
        ...state.planning,
        plannedDevices: newPlannedDevices,
        rackInfos,
      },
    }));

    return true;
  },

  removePlannedDevice: (plannedDeviceId) => {
    set((state) => {
      const device = state.planning.plannedDevices.find((d) => d.id === plannedDeviceId);
      const newPlannedDevices = state.planning.plannedDevices.filter((d) => d.id !== plannedDeviceId);

      const rackInfos = { ...state.planning.rackInfos };
      if (device) {
        const { racks } = get();
        const rack = racks.find((r) => r.id === device.rackId);
        if (rack) {
          const rackPlannedDevices = newPlannedDevices.filter((d) => d.rackId === device.rackId);
          const currentPower = rack.devices.reduce((sum, d) => sum + d.powerConsumption, 0);
          const plannedPower = rackPlannedDevices.reduce((sum, d) => sum + d.powerConsumption, 0);
          const totalPower = currentPower + plannedPower;

          const plannedUsedU = rackPlannedDevices.reduce((sum, d) => sum + (d.endU - d.startU + 1), 0);
          const remainingU = rack.totalU - rack.usedU - plannedUsedU;

          const currentHeat = rack.devices.reduce((sum, d) => sum + d.powerConsumption * 0.8, 0);
          const plannedHeat = rackPlannedDevices.reduce((sum, d) => sum + d.heatOutput, 0);
          const baseTemp = 22;
          const tempIncrease = ((currentHeat + plannedHeat) / 1000) * 3;
          const estimatedTemperature = baseTemp + tempIncrease;

          const maxPower = rack.maxPower || 8000;
          const maxTemp = rack.maxTemperature || 35;

          rackInfos[device.rackId] = {
            rackId: device.rackId,
            estimatedPower: totalPower,
            remainingU,
            estimatedTemperature,
            isOverCapacity: totalPower > maxPower || remainingU < 0,
            isOverTemperature: estimatedTemperature > maxTemp,
          };
        }
      }

      return {
        planning: {
          ...state.planning,
          plannedDevices: newPlannedDevices,
          rackInfos,
        },
      };
    });
  },

  clearPlannedDevices: () => set((state) => ({
    planning: {
      ...state.planning,
      plannedDevices: [],
      rackInfos: {},
    },
  })),

  timeline: {
    mode: 'live',
    currentTime: Date.now(),
    timeA: null,
    timeB: null,
    isPlaying: false,
    playbackSpeed: 1,
    snapshots: generateHistorySnapshots(generateInitialRacks(), [], calculateStats(generateInitialRacks())),
  },

  setPlaybackMode: (mode) => set((state) => ({
    timeline: { ...state.timeline, mode },
  })),

  setCurrentTime: (time) => set((state) => ({
    timeline: {
      ...state.timeline,
      currentTime: typeof time === 'function' ? time(state.timeline.currentTime) : time,
    },
  })),

  setTimeA: (time) => set((state) => ({
    timeline: { ...state.timeline, timeA: time },
  })),

  setTimeB: (time) => set((state) => ({
    timeline: { ...state.timeline, timeB: time },
  })),

  togglePlayback: () => set((state) => ({
    timeline: { ...state.timeline, isPlaying: !state.timeline.isPlaying },
  })),

  setPlaybackSpeed: (speed) => set((state) => ({
    timeline: { ...state.timeline, playbackSpeed: speed },
  })),

  getSnapshotAtTime: (time) => {
    const { timeline } = get();
    const { snapshots } = timeline;
    if (snapshots.length === 0) return null;

    let closest = snapshots[0];
    let minDiff = Math.abs(time - snapshots[0].timestamp);

    for (const snapshot of snapshots) {
      const diff = Math.abs(time - snapshot.timestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closest = snapshot;
      }
    }

    return closest;
  },
}));
