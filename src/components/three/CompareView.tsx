import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Environment } from './Environment';
import { HeatMap } from './HeatMap';
import { NetworkTopology } from './NetworkTopology';
import {
  ServerRack as ServerRackType,
  ServerDevice as ServerDeviceType,
  TemperaturePoint,
  NetworkNode,
  HistorySnapshot,
  DeviceStatus,
} from '@/types';
import { getTemperatureColor } from '@/utils/helpers';

interface CompareViewProps {
  snapshotA: HistorySnapshot;
  snapshotB: HistorySnapshot;
  networkNodes: NetworkNode[];
  networkViewVisible: boolean;
}

const getDeviceStatusChanged = (
  deviceA: ServerDeviceType,
  deviceB: ServerDeviceType
): boolean => {
  return (
    deviceA.status !== deviceB.status ||
    deviceA.isOnline !== deviceB.isOnline ||
    Math.abs(deviceA.temperature - deviceB.temperature) > 5 ||
    Math.abs(deviceA.cpuUsage - deviceB.cpuUsage) > 20
  );
};

const CompareRack = ({
  rackA,
  rackB,
  side,
}: {
  rackA: ServerRackType;
  rackB: ServerRackType;
  side: 'left' | 'right';
}) => {
  const rack = side === 'left' ? rackA : rackB;
  const otherRack = side === 'left' ? rackB : rackA;

  const changedDevices = useMemo(() => {
    const changed = new Set<string>();
    rack.devices.forEach((device) => {
      const otherDevice = otherRack.devices.find((d) => d.id === device.id);
      if (otherDevice && getDeviceStatusChanged(device, otherDevice)) {
        changed.add(device.id);
      }
    });
    return changed;
  }, [rack, otherRack]);

  const hasRackChanged = Math.abs(rack.topTemperature - otherRack.topTemperature) > 3;

  return (
    <group position={[rack.positionX, 2.0 / 2 + 0.3, rack.positionZ]}>
      {changedDevices.size > 0 && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.7, 2.1, 1.1]} />
          <meshBasicMaterial
            color={side === 'left' ? '#3b82f6' : '#f97316'}
            transparent
            opacity={0.1}
            side={2}
          />
        </mesh>
      )}

      <mesh position={[0, 2.0 / 2 + 0.6, 0]}>
        <boxGeometry args={[0.65, 0.05, 1.05]} />
        <meshBasicMaterial
          color={side === 'left' ? '#3b82f6' : '#f97316'}
          transparent
          opacity={hasRackChanged ? 0.8 : 0.3}
        />
      </mesh>

      {rack.devices.map((device) => {
        const uCount = device.endU - device.startU + 1;
        const U_HEIGHT = 0.0476;
        const height = uCount * U_HEIGHT;
        const y = 2.0 / 2 - (device.startU - 1) * U_HEIGHT - height / 2;
        const isChanged = changedDevices.has(device.id);

        const statusColors: Record<DeviceStatus, string> = {
          running: '#00ff88',
          warning: '#ffcc00',
          fault: '#ff4444',
          idle: '#666666',
        };

        return (
          <group key={device.id} position={[0, y, 0]}>
            {isChanged && (
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.56, height + 0.02, 0.88]} />
                <meshBasicMaterial
                  color={side === 'left' ? '#3b82f6' : '#f97316'}
                  transparent
                  opacity={0.3}
                  wireframe
                />
              </mesh>
            )}

            <mesh position={[0, 0, 0.43]}>
              <boxGeometry args={[0.5, height - 0.02, 0.01]} />
              <meshStandardMaterial
                color={statusColors[device.status]}
                emissive={statusColors[device.status]}
                emissiveIntensity={device.status === 'fault' ? 1 : device.status === 'warning' ? 0.6 : 0.3}
                metalness={0.3}
                roughness={0.5}
                transparent
                opacity={device.status === 'idle' ? 0.5 : 0.9}
              />
            </mesh>
          </group>
        );
      })}

      <mesh position={[0, 2.0 / 2 + 0.15, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
        <meshStandardMaterial
          color={getTemperatureColor(rack.topTemperature)}
          emissive={getTemperatureColor(rack.topTemperature)}
          emissiveIntensity={rack.topTemperature > 32 ? 1 : 0.5}
        />
      </mesh>
    </group>
  );
};

const CompareScene = ({
  snapshot,
  otherSnapshot,
  side,
  networkNodes,
  networkViewVisible,
}: {
  snapshot: HistorySnapshot;
  otherSnapshot: HistorySnapshot;
  side: 'left' | 'right';
  networkNodes: NetworkNode[];
  networkViewVisible: boolean;
}) => {
  const temperaturePoints = useMemo<TemperaturePoint[]>(() => {
    const points: TemperaturePoint[] = [];
    snapshot.racks.forEach((rack) => {
      points.push({
        x: rack.positionX,
        z: rack.positionZ,
        temperature: rack.topTemperature,
      });
    });
    return points;
  }, [snapshot.racks]);

  return (
    <>
      <color attach="background" args={['#0a1628']} />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={0.1}
        target={[0, 1, 0]}
      />

      <Environment />

      {snapshot.racks.map((rack) => {
        const otherRack = otherSnapshot.racks.find((r) => r.id === rack.id);
        if (!otherRack) return null;
        return (
          <CompareRack
            key={rack.id}
            rackA={rack}
            rackB={otherRack}
            side={side}
          />
        );
      })}

      <HeatMap temperaturePoints={temperaturePoints} visible={true} />

      {networkViewVisible && (
        <NetworkTopology
          nodes={networkNodes}
          links={[]}
          visible={networkViewVisible}
          onNodePointerOver={() => {}}
          onNodePointerOut={() => {}}
        />
      )}

      <EffectComposer>
        <Bloom
          intensity={0.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
};

export const CompareView = ({
  snapshotA,
  snapshotB,
  networkNodes,
  networkViewVisible,
}: CompareViewProps) => {
  return (
    <div className="absolute inset-0 pt-16 pr-88 flex">
      <div className="flex-1 relative border-r-2 border-blue-500/50">
        <div className="absolute top-2 left-2 z-20 px-3 py-1.5 bg-blue-500/80 rounded-lg text-white text-sm font-medium">
          A 时刻
        </div>
        <Canvas
          shadows
          camera={{ position: [15, 12, 15], fov: 50 }}
          gl={{ antialias: true, alpha: false }}
          style={{ background: '#0a1628' }}
        >
          <CompareScene
            snapshot={snapshotA}
            otherSnapshot={snapshotB}
            side="left"
            networkNodes={networkNodes}
            networkViewVisible={networkViewVisible}
          />
        </Canvas>
      </div>

      <div className="flex-1 relative border-l-2 border-orange-500/50">
        <div className="absolute top-2 right-2 z-20 px-3 py-1.5 bg-orange-500/80 rounded-lg text-white text-sm font-medium">
          B 时刻
        </div>
        <Canvas
          shadows
          camera={{ position: [15, 12, 15], fov: 50 }}
          gl={{ antialias: true, alpha: false }}
          style={{ background: '#0a1628' }}
        >
          <CompareScene
            snapshot={snapshotB}
            otherSnapshot={snapshotA}
            side="right"
            networkNodes={networkNodes}
            networkViewVisible={networkViewVisible}
          />
        </Canvas>
      </div>
    </div>
  );
};
