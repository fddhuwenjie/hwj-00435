import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Environment } from './Environment';
import { ServerRack } from './ServerRack';
import { HeatMap } from './HeatMap';
import { NetworkTopology } from './NetworkTopology';
import { useDataCenterStore } from '@/store/useDataCenterStore';
import {
  ServerRack as ServerRackType,
  ServerDevice as ServerDeviceType,
  TemperaturePoint,
  NetworkNode,
  HistorySnapshot,
  PlannedDevice,
} from '@/types';
import { useCameraControls } from '@/hooks/useCameraControls';

interface DataCenterProps {
  onDeviceClick: (device: ServerDeviceType) => void;
  onDevicePointerOver: (e: any, device: ServerDeviceType) => void;
  onDevicePointerOut: () => void;
  onNetworkNodePointerOver: (e: any, node: NetworkNode) => void;
  onNetworkNodePointerOut: () => void;
  snapshotA?: HistorySnapshot | null;
  snapshotB?: HistorySnapshot | null;
  compareMode?: boolean;
  plannedDevices?: PlannedDevice[];
  planningMode?: boolean;
}

const DataCenterContent = ({
  onDeviceClick,
  onDevicePointerOver,
  onDevicePointerOut,
  onNetworkNodePointerOver,
  onNetworkNodePointerOut,
  snapshotA,
  snapshotB,
  compareMode,
  plannedDevices,
  planningMode,
}: DataCenterProps) => {
  const {
    racks: liveRacks,
    selectedRackId,
    heatMapVisible,
    selectRack,
    networkNodes,
    networkLinks,
    networkViewVisible,
  } = useDataCenterStore();
  const { controlsRef } = useCameraControls();

  const displayRacks = useMemo(() => {
    if (compareMode && snapshotA && snapshotB) {
      return snapshotA.racks;
    }
    return liveRacks;
  }, [compareMode, snapshotA, snapshotB, liveRacks]);

  const temperaturePoints = useMemo<TemperaturePoint[]>(() => {
    const points: TemperaturePoint[] = [];
    displayRacks.forEach((rack) => {
      points.push({
        x: rack.positionX,
        z: rack.positionZ,
        temperature: rack.topTemperature,
      });
    });
    return points;
  }, [displayRacks]);

  const handleRackClick = (rack: ServerRackType) => {
    if (selectedRackId === rack.id) {
      selectRack(null);
    } else {
      selectRack(rack);
    }
  };

  const displayPlannedDevices = useMemo(() => {
    if (!planningMode || !plannedDevices) return [];
    return plannedDevices;
  }, [planningMode, plannedDevices]);

  return (
    <>
      <color attach="background" args={['#0a1628']} />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={0.1}
        target={[0, 1, 0]}
      />

      <Environment />

      {displayRacks.map((rack) => (
        <ServerRack
          key={rack.id}
          rack={rack}
          isSelected={selectedRackId === rack.id}
          onRackClick={handleRackClick}
          onDeviceClick={onDeviceClick}
          onDevicePointerOver={onDevicePointerOver}
          onDevicePointerOut={onDevicePointerOut}
          plannedDevices={displayPlannedDevices.filter((d) => d.rackId === rack.id)}
        />
      ))}

      <HeatMap
        temperaturePoints={temperaturePoints}
        visible={heatMapVisible}
      />

      <NetworkTopology
        nodes={networkNodes}
        links={networkLinks}
        visible={networkViewVisible}
        onNodePointerOver={onNetworkNodePointerOver}
        onNodePointerOut={onNetworkNodePointerOut}
      />

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

export const DataCenter = (props: DataCenterProps) => {
  return (
    <Canvas
      shadows
      camera={{ position: [15, 12, 15], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#0a1628' }}
    >
      <DataCenterContent {...props} />
    </Canvas>
  );
};
