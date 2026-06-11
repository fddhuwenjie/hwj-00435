import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Environment } from './Environment';
import { ServerRack } from './ServerRack';
import { HeatMap } from './HeatMap';
import { useDataCenterStore } from '@/store/useDataCenterStore';
import { ServerRack as ServerRackType, ServerDevice as ServerDeviceType, TemperaturePoint } from '@/types';
import { useCameraControls } from '@/hooks/useCameraControls';

interface DataCenterProps {
  onDeviceClick: (device: ServerDeviceType) => void;
  onDevicePointerOver: (e: any, device: ServerDeviceType) => void;
  onDevicePointerOut: () => void;
}

const DataCenterContent = ({
  onDeviceClick,
  onDevicePointerOver,
  onDevicePointerOut,
}: DataCenterProps) => {
  const { racks, selectedRackId, heatMapVisible, selectRack } = useDataCenterStore();
  const { controlsRef } = useCameraControls();

  const temperaturePoints = useMemo<TemperaturePoint[]>(() => {
    const points: TemperaturePoint[] = [];
    racks.forEach((rack) => {
      points.push({
        x: rack.positionX,
        z: rack.positionZ,
        temperature: rack.topTemperature,
      });
    });
    return points;
  }, [racks]);

  const handleRackClick = (rack: ServerRackType) => {
    if (selectedRackId === rack.id) {
      selectRack(null);
    } else {
      selectRack(rack);
    }
  };

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

      {racks.map((rack) => (
        <ServerRack
          key={rack.id}
          rack={rack}
          isSelected={selectedRackId === rack.id}
          onRackClick={handleRackClick}
          onDeviceClick={onDeviceClick}
          onDevicePointerOver={onDevicePointerOver}
          onDevicePointerOut={onDevicePointerOut}
        />
      ))}

      <HeatMap
        temperaturePoints={temperaturePoints}
        visible={heatMapVisible}
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
