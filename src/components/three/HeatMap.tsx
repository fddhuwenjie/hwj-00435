import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { TemperaturePoint } from '@/types';
import { getTemperatureColor } from '@/utils/helpers';

interface HeatMapProps {
  temperaturePoints: TemperaturePoint[];
  visible: boolean;
}

const ROOM_WIDTH = 40;
const ROOM_DEPTH = 25;
const GRID_SIZE = 1;

export const HeatMap = ({ temperaturePoints, visible }: HeatMapProps) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const { texture, material } = useMemo(() => {
    const width = Math.floor(ROOM_WIDTH / GRID_SIZE);
    const height = Math.floor(ROOM_DEPTH / GRID_SIZE);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    const createGrid = () => {
      const tempGrid: number[][] = [];
      for (let z = 0; z < height; z++) {
        tempGrid[z] = [];
        for (let x = 0; x < width; x++) {
          const worldX = (x - width / 2) * GRID_SIZE;
          const worldZ = (z - height / 2) * GRID_SIZE;

          let nearestDist = Infinity;
          let nearestTemp = 22;

          for (const point of temperaturePoints) {
            const dist = Math.sqrt(
              Math.pow(worldX - point.x, 2) + Math.pow(worldZ - point.z, 2)
            );
            if (dist < nearestDist) {
              nearestDist = dist;
              nearestTemp = point.temperature;
            }
          }

          const hotZones = [
            { x: 0, z: -5.5, temp: 35 },
            { x: 0, z: 3, temp: 35 },
          ];

          for (const zone of hotZones) {
            const zoneDist = Math.sqrt(
              Math.pow(worldX - zone.x, 2) + Math.pow(worldZ - zone.z, 2)
            );
            if (zoneDist < 4) {
              nearestTemp = Math.max(nearestTemp, zone.temp * (1 - zoneDist / 4));
            }
          }

          const coldZones = [
            { x: 0, z: -3, temp: 20 },
            { x: 0, z: 5.5, temp: 20 },
          ];

          for (const zone of coldZones) {
            const zoneDist = Math.sqrt(
              Math.pow(worldX - zone.x, 2) + Math.pow(worldZ - zone.z, 2)
            );
            if (zoneDist < 4) {
              nearestTemp = Math.min(nearestTemp, zone.temp * (1 + zoneDist / 4) + 20 * (zoneDist / 4));
            }
          }

          tempGrid[z][x] = nearestTemp + (Math.random() - 0.5) * 2;
        }
      }
      return tempGrid;
    };

    const tempGrid = createGrid();

    for (let z = 0; z < height; z++) {
      for (let x = 0; x < width; x++) {
        const temp = tempGrid[z][x];
        ctx.fillStyle = getTemperatureColor(temp);
        ctx.fillRect(x, z, 1, 1);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });

    return { texture, material };
  }, [temperaturePoints]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.visible = visible;
    }
  }, [visible]);

  return (
    <group>
      <mesh
        ref={meshRef}
        position={[0, 0.31, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={material}
      >
        <planeGeometry args={[ROOM_WIDTH - 1, ROOM_DEPTH - 1]} />
      </mesh>

      {temperaturePoints.filter(p => p.temperature > 32).map((point, i) => (
        <group key={`hotspot-${i}`}>
          <mesh
            position={[point.x, 0.35, point.z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.3, 0.5, 16]} />
            <meshBasicMaterial
              color="#ff4444"
              transparent
              opacity={0.6 + Math.sin(Date.now() / 500) * 0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh
            position={[point.x, 0.36, point.z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.1, 0.3, 16]} />
            <meshBasicMaterial
              color="#ff8844"
              transparent
              opacity={0.8 + Math.sin(Date.now() / 300) * 0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}

      <group position={[-ROOM_WIDTH / 2 - 2, 0.4, 0]}>
        {Array.from({ length: 10 }).map((_, i) => {
          const temp = 18 + i * 2;
          return (
            <group key={`legend-${i}`} position={[0, 0, -i * 0.3]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.5, 0.25]} />
                <meshBasicMaterial color={getTemperatureColor(temp)} />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
};
