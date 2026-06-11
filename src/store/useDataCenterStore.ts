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
  updateDeviceData: () => void;
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
}

const calculateStats = (racks: ServerRack[], alerts: Alert[]): DataCenterStats => {
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
  stats: calculateStats(generateInitialRacks(), []),
  selectedDevice: null,
  selectedRackId: null,
  tooltip: { visible: false, x: 0, y: 0, device: null },
  viewMode: 'perspective',
  heatMapVisible: true,
  focusRackId: null,
  cameraTarget: { position: null, lookAt: null },

  updateDeviceData: () => {
    const { racks, alerts } = get();
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
      stats: calculateStats(updatedRacks, alerts),
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
}));
