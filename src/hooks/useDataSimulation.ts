import { useEffect, useRef } from 'react';
import { useDataCenterStore } from '@/store/useDataCenterStore';

export const useDataSimulation = () => {
  const { updateDeviceData, triggerRandomAlert } = useDataCenterStore();
  const dataIntervalRef = useRef<number | null>(null);
  const alertIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    dataIntervalRef.current = window.setInterval(() => {
      updateDeviceData();
    }, 3000);

    alertIntervalRef.current = window.setInterval(() => {
      if (Math.random() > 0.6) {
        triggerRandomAlert();
      }
    }, 8000);

    return () => {
      if (dataIntervalRef.current) {
        clearInterval(dataIntervalRef.current);
      }
      if (alertIntervalRef.current) {
        clearInterval(alertIntervalRef.current);
      }
    };
  }, [updateDeviceData, triggerRandomAlert]);
};
