import { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { ServerDevice as ServerDeviceType } from '@/types';
import { statusColors, statusEmissiveColors } from '@/utils/helpers';

interface ServerDeviceProps {
  device: ServerDeviceType;
  rackHeight: number;
  onClick: (device: ServerDeviceType) => void;
  onPointerOver: (e: any, device: ServerDeviceType) => void;
  onPointerOut: () => void;
}

const U_HEIGHT = 0.0476;

export const ServerDevice = ({
  device,
  rackHeight,
  onClick,
  onPointerOver,
  onPointerOut,
}: ServerDeviceProps) => {
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    if (device.status === 'fault' || device.temperature > 35) {
      const interval = setInterval(() => {
        setPulsing((p) => !p);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [device.status, device.temperature]);

  const { deviceWidth, deviceDepth, deviceHeight, deviceY } = useMemo(() => {
    const uCount = device.endU - device.startU + 1;
    const height = uCount * U_HEIGHT;
    const y = rackHeight / 2 - (device.startU - 1) * U_HEIGHT - height / 2;
    return {
      deviceWidth: 0.52,
      deviceDepth: 0.85,
      deviceHeight: height,
      deviceY: y,
    };
  }, [device.startU, device.endU, rackHeight]);

  const color = useMemo(() => {
    const baseColor = statusColors[device.status];
    if ((device.status === 'fault' || device.temperature > 35) && pulsing) {
      return baseColor;
    }
    return baseColor;
  }, [device.status, device.temperature, pulsing]);

  const emissiveIntensity = useMemo(() => {
    if (device.status === 'fault') return pulsing ? 1.0 : 0.3;
    if (device.status === 'warning') return pulsing ? 0.6 : 0.2;
    if (device.status === 'running') return 0.3;
    return 0.1;
  }, [device.status, pulsing]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    onClick(device);
  };

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    onPointerOver(e, device);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    onPointerOut();
    document.body.style.cursor = 'auto';
  };

  return (
    <group position={[0, deviceY, 0]}>
      <mesh
        position={[0, 0, 0]}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[deviceWidth, deviceHeight, deviceDepth]} />
        <meshStandardMaterial
          color={device.status === 'idle' ? '#444444' : '#2a3a4a'}
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>

      <mesh
        position={[0, 0, deviceDepth / 2 + 0.001]}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[deviceWidth - 0.02, deviceHeight - 0.02, 0.01]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          metalness={0.3}
          roughness={0.5}
          transparent
          opacity={device.status === 'idle' ? 0.5 : 0.9}
        />
      </mesh>

      {device.status !== 'idle' && (
        <>
          <mesh
            position={[-deviceWidth / 2 + 0.06, deviceHeight / 2 - 0.03, deviceDepth / 2 + 0.006]}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            <boxGeometry args={[0.02, 0.02, 0.01]} />
            <meshStandardMaterial
              color={statusColors[device.status]}
              emissive={statusColors[device.status]}
              emissiveIntensity={device.isOnline ? 2 : 0.2}
            />
          </mesh>

          {Array.from({ length: Math.min(Math.floor(device.cpuUsage / 20), 5) }).map((_, i) => (
            <mesh
              key={i}
              position={[
                -deviceWidth / 2 + 0.12 + i * 0.06,
                -deviceHeight / 2 + 0.03,
                deviceDepth / 2 + 0.006,
              ]}
            >
              <boxGeometry args={[0.04, deviceHeight * 0.6 * ((i + 1) / 5), 0.01]} />
              <meshStandardMaterial
                color={i < 3 ? '#00ff88' : i < 4 ? '#ffcc00' : '#ff4444'}
                emissive={i < 3 ? '#003311' : i < 4 ? '#332200' : '#330000'}
                emissiveIntensity={0.5}
              />
            </mesh>
          ))}
        </>
      )}

      {!device.isOnline && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[deviceWidth + 0.01, deviceHeight + 0.01, deviceDepth + 0.01]} />
          <meshStandardMaterial
            color="#1a1a1a"
            transparent
            opacity={0.5}
          />
        </mesh>
      )}
    </group>
  );
};
