import { useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { ServerRack as ServerRackType, ServerDevice as ServerDeviceType, PlannedDevice } from '@/types';
import { ServerDevice } from './ServerDevice';
import { getTemperatureColor } from '@/utils/helpers';

interface ServerRackProps {
  rack: ServerRackType;
  isSelected: boolean;
  onRackClick: (rack: ServerRackType) => void;
  onDeviceClick: (device: ServerDeviceType) => void;
  onDevicePointerOver: (e: any, device: ServerDeviceType) => void;
  onDevicePointerOut: () => void;
  plannedDevices?: PlannedDevice[];
}

const RACK_WIDTH = 0.6;
const RACK_DEPTH = 1.0;
const RACK_HEIGHT = 2.0;

export const ServerRack = ({
  rack,
  isSelected,
  onRackClick,
  onDeviceClick,
  onDevicePointerOver,
  onDevicePointerOut,
  plannedDevices = [],
}: ServerRackProps) => {
  const frameMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: isSelected ? '#00d4ff' : '#3a4a5a',
    metalness: 0.8,
    roughness: 0.3,
    emissive: isSelected ? '#00d4ff' : '#000000',
    emissiveIntensity: isSelected ? 0.3 : 0,
  }), [isSelected]);

  const sideMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#2a3a4a',
    metalness: 0.7,
    roughness: 0.4,
  }), []);

  const topTempColor = getTemperatureColor(rack.topTemperature);
  const isOverheating = rack.topTemperature > 32;

  const handleRackClick = (e: any) => {
    e.stopPropagation();
    onRackClick(rack);
  };

  return (
    <group position={[rack.positionX, RACK_HEIGHT / 2 + 0.3, rack.positionZ]}>
      <mesh
        position={[0, 0, -RACK_DEPTH / 2]}
        onClick={handleRackClick}
        material={frameMaterial}
      >
        <boxGeometry args={[RACK_WIDTH, RACK_HEIGHT, 0.05]} />
      </mesh>

      <mesh
        position={[0, 0, RACK_DEPTH / 2]}
        onClick={handleRackClick}
        material={frameMaterial}
      >
        <boxGeometry args={[RACK_WIDTH, RACK_HEIGHT, 0.05]} />
      </mesh>

      <mesh
        position={[-RACK_WIDTH / 2, 0, 0]}
        onClick={handleRackClick}
        material={sideMaterial}
      >
        <boxGeometry args={[0.05, RACK_HEIGHT, RACK_DEPTH]} />
      </mesh>

      <mesh
        position={[RACK_WIDTH / 2, 0, 0]}
        onClick={handleRackClick}
        material={sideMaterial}
      >
        <boxGeometry args={[0.05, RACK_HEIGHT, RACK_DEPTH]} />
      </mesh>

      <mesh
        position={[0, RACK_HEIGHT / 2, 0]}
        onClick={handleRackClick}
        material={frameMaterial}
      >
        <boxGeometry args={[RACK_WIDTH, 0.05, RACK_DEPTH]} />
      </mesh>

      <mesh
        position={[0, -RACK_HEIGHT / 2, 0]}
        onClick={handleRackClick}
        material={frameMaterial}
      >
        <boxGeometry args={[RACK_WIDTH, 0.05, RACK_DEPTH]} />
      </mesh>

      <group position={[0, 0, 0]}>
        {rack.devices.map((device) => (
          <ServerDevice
            key={device.id}
            device={device}
            rackHeight={RACK_HEIGHT}
            onClick={onDeviceClick}
            onPointerOver={onDevicePointerOver}
            onPointerOut={onDevicePointerOut}
          />
        ))}

        {plannedDevices.map((planned) => {
          const uCount = planned.endU - planned.startU + 1;
          const U_HEIGHT = 0.0476;
          const height = uCount * U_HEIGHT;
          const y = RACK_HEIGHT / 2 - (planned.startU - 1) * U_HEIGHT - height / 2;

          return (
            <group key={planned.id} position={[0, y, 0]}>
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.52, height, 0.85]} />
                <meshBasicMaterial
                  color="#00d4ff"
                  transparent
                  opacity={0.2}
                  wireframe
                />
              </mesh>
              <mesh position={[0, 0, 0.43]}>
                <boxGeometry args={[0.5, height - 0.02, 0.01]} />
                <meshBasicMaterial
                  color="#00d4ff"
                  transparent
                  opacity={0.6}
                />
              </mesh>
              <mesh position={[0, height / 2 - 0.02, 0]}>
                <boxGeometry args={[0.5, 0.01, 0.86]} />
                <meshBasicMaterial
                  color="#00d4ff"
                  transparent
                  opacity={0.8}
                />
              </mesh>
              <mesh position={[0, -height / 2 + 0.02, 0]}>
                <boxGeometry args={[0.5, 0.01, 0.86]} />
                <meshBasicMaterial
                  color="#00d4ff"
                  transparent
                  opacity={0.8}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      <group position={[0, RACK_HEIGHT / 2 + 0.15, 0]}>
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
          <meshStandardMaterial
            color={topTempColor}
            emissive={topTempColor}
            emissiveIntensity={isOverheating ? 1 : 0.5}
          />
        </mesh>
        <Text
          position={[0, 0.12, 0]}
          fontSize={0.15}
          color={isOverheating ? '#ff4444' : '#ffffff'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {rack.topTemperature.toFixed(1)}°C
        </Text>
      </group>

      <Text
        position={[0, RACK_HEIGHT / 2 + 0.45, 0]}
        fontSize={0.12}
        color="#00d4ff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {rack.id}
      </Text>

      <Text
        position={[0, -RACK_HEIGHT / 2 - 0.12, 0]}
        fontSize={0.08}
        color="#888888"
        anchorX="center"
        anchorY="middle"
      >
        {rack.usedU}/{rack.totalU}U
      </Text>

      {isSelected && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[RACK_WIDTH + 0.1, RACK_HEIGHT + 0.1, RACK_DEPTH + 0.1]} />
          <meshBasicMaterial
            color="#00d4ff"
            transparent
            opacity={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {isOverheating && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[RACK_WIDTH + 0.15, RACK_HEIGHT + 0.15, RACK_DEPTH + 0.15]} />
          <meshBasicMaterial
            color="#ff4444"
            transparent
            opacity={0.05}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};
