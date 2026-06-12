import { useEffect, useRef } from 'react';
import { useDataCenterStore } from '@/store/useDataCenterStore';

export const useDataSimulation = () => {
  const { updateDeviceData, triggerRandomAlert, updateNetworkData, timeline } = useDataCenterStore();
  const dataIntervalRef = useRef<number | null>(null);
  const alertIntervalRef = useRef<number | null>(null);
  const networkIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (timeline.mode !== 'live') {
      if (dataIntervalRef.current) {
        clearInterval(dataIntervalRef.current);
        dataIntervalRef.current = null;
      }
      if (alertIntervalRef.current) {
        clearInterval(alertIntervalRef.current);
        alertIntervalRef.current = null;
      }
      if (networkIntervalRef.current) {
        clearInterval(networkIntervalRef.current);
        networkIntervalRef.current = null;
      }
      return;
    }

    dataIntervalRef.current = window.setInterval(() => {
      updateDeviceData();
    }, 3000);

    alertIntervalRef.current = window.setInterval(() => {
      if (Math.random() > 0.6) {
        triggerRandomAlert();
      }
    }, 8000);

    networkIntervalRef.current = window.setInterval(() => {
      updateNetworkData();
    }, 4000);

    return () => {
      if (dataIntervalRef.current) {
        clearInterval(dataIntervalRef.current);
      }
      if (alertIntervalRef.current) {
        clearInterval(alertIntervalRef.current);
      }
      if (networkIntervalRef.current) {
        clearInterval(networkIntervalRef.current);
      }
    };
  }, [updateDeviceData, triggerRandomAlert, updateNetworkData, timeline.mode]);
};
