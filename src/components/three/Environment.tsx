import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

const ROOM_WIDTH = 40;
const ROOM_DEPTH = 25;
const ROOM_HEIGHT = 6;
const FLOOR_HEIGHT = 0.3;

export const Environment = () => {
  const floorTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 256; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }

    ctx.fillStyle = '#3a3a4a';
    for (let i = 16; i < 256; i += 32) {
      for (let j = 16; j < 256; j += 32) {
        ctx.fillRect(i - 14, j - 14, 28, 28);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 12);
    return texture;
  }, []);

  const ceilingTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 512; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 5);
    return texture;
  }, []);

  const glassMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#88ccff',
    transparent: true,
    opacity: 0.15,
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.9,
    thickness: 0.5,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
  }), []);

  const frameMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#3a4a5a',
    metalness: 0.8,
    roughness: 0.3,
  }), []);

  return (
    <group>
      <ambientLight intensity={0.4} color="#88aaff" />

      <directionalLight
        position={[0, ROOM_HEIGHT - 0.5, 0]}
        intensity={0.6}
        color="#ffffff"
        castShadow
      />

      {Array.from({ length: 5 }).map((_, i) => (
        <group key={`light-row-${i}`}>
          {Array.from({ length: 8 }).map((_, j) => (
            <group key={`light-${i}-${j}`} position={[
              (j - 3.5) * 5,
              ROOM_HEIGHT - 0.3,
              (i - 2) * 5,
            ]}>
              <mesh>
                <boxGeometry args={[2, 0.1, 0.3]} />
                <meshStandardMaterial color="#2a2a3a" />
              </mesh>
              <mesh position={[0, -0.06, 0]}>
                <boxGeometry args={[1.8, 0.02, 0.25]} />
                <meshStandardMaterial
                  color="#ffffff"
                  emissive="#aaddff"
                  emissiveIntensity={2}
                />
              </mesh>
              <pointLight
                position={[0, -0.2, 0]}
                intensity={0.5}
                color="#aaddff"
                distance={6}
              />
            </group>
          ))}
        </group>
      ))}

      <mesh position={[0, -FLOOR_HEIGHT / 2, 0]} receiveShadow>
        <boxGeometry args={[ROOM_WIDTH, FLOOR_HEIGHT, ROOM_DEPTH]} />
        <meshStandardMaterial
          map={floorTexture}
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      <mesh position={[0, FLOOR_HEIGHT / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_WIDTH - 1, ROOM_DEPTH - 1]} />
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.03}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0, ROOM_HEIGHT - FLOOR_HEIGHT / 2, 0]}>
        <boxGeometry args={[ROOM_WIDTH, FLOOR_HEIGHT, ROOM_DEPTH]} />
        <meshStandardMaterial
          map={ceilingTexture}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      <mesh position={[0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2]} material={glassMaterial}>
        <boxGeometry args={[ROOM_WIDTH, ROOM_HEIGHT, 0.1]} />
      </mesh>
      <mesh position={[0, ROOM_HEIGHT / 2, ROOM_DEPTH / 2]} material={glassMaterial}>
        <boxGeometry args={[ROOM_WIDTH, ROOM_HEIGHT, 0.1]} />
      </mesh>
      <mesh position={[-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]} material={glassMaterial}>
        <boxGeometry args={[0.1, ROOM_HEIGHT, ROOM_DEPTH]} />
      </mesh>
      <mesh position={[ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]} material={glassMaterial}>
        <boxGeometry args={[0.1, ROOM_HEIGHT, ROOM_DEPTH]} />
      </mesh>

      <mesh position={[0, ROOM_HEIGHT + 0.05, 0]} material={frameMaterial}>
        <boxGeometry args={[ROOM_WIDTH + 0.2, 0.1, ROOM_DEPTH + 0.2]} />
      </mesh>
      <mesh position={[0, -FLOOR_HEIGHT - 0.05, 0]} material={frameMaterial}>
        <boxGeometry args={[ROOM_WIDTH + 0.2, 0.1, ROOM_DEPTH + 0.2]} />
      </mesh>
      <mesh position={[0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2 - 0.15]} material={frameMaterial}>
        <boxGeometry args={[0.2, ROOM_HEIGHT + 0.4, 0.2]} />
      </mesh>
      <mesh position={[0, ROOM_HEIGHT / 2, ROOM_DEPTH / 2 + 0.15]} material={frameMaterial}>
        <boxGeometry args={[0.2, ROOM_HEIGHT + 0.4, 0.2]} />
      </mesh>
      <mesh position={[-ROOM_WIDTH / 2 - 0.15, ROOM_HEIGHT / 2, 0]} material={frameMaterial}>
        <boxGeometry args={[0.2, ROOM_HEIGHT + 0.4, 0.2]} />
      </mesh>
      <mesh position={[ROOM_WIDTH / 2 + 0.15, ROOM_HEIGHT / 2, 0]} material={frameMaterial}>
        <boxGeometry args={[0.2, ROOM_HEIGHT + 0.4, 0.2]} />
      </mesh>

      <group position={[0, FLOOR_HEIGHT + 0.05, -3]}>
        <mesh>
          <boxGeometry args={[10, 0.02, 1]} />
          <meshStandardMaterial
            color="#00d4ff"
            emissive="#00d4ff"
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
          />
        </mesh>
        <Text
          position={[0, 0.3, 0]}
          fontSize={0.4}
          color="#00d4ff"
          anchorX="center"
          anchorY="middle"
        >
          冷通道 Cold Aisle
        </Text>
      </group>

      <group position={[0, FLOOR_HEIGHT + 0.05, 3]}>
        <mesh>
          <boxGeometry args={[10, 0.02, 1]} />
          <meshStandardMaterial
            color="#ff4444"
            emissive="#ff4444"
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
          />
        </mesh>
        <Text
          position={[0, 0.3, 0]}
          fontSize={0.4}
          color="#ff4444"
          anchorX="center"
          anchorY="middle"
        >
          热通道 Hot Aisle
        </Text>
      </group>

      <group position={[0, FLOOR_HEIGHT + 0.05, 5.5]}>
        <mesh>
          <boxGeometry args={[10, 0.02, 1]} />
          <meshStandardMaterial
            color="#00d4ff"
            emissive="#00d4ff"
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
          />
        </mesh>
        <Text
          position={[0, 0.3, 0]}
          fontSize={0.4}
          color="#00d4ff"
          anchorX="center"
          anchorY="middle"
        >
          冷通道 Cold Aisle
        </Text>
      </group>

      <group position={[0, FLOOR_HEIGHT + 0.05, -5.5]}>
        <mesh>
          <boxGeometry args={[10, 0.02, 1]} />
          <meshStandardMaterial
            color="#ff4444"
            emissive="#ff4444"
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
          />
        </mesh>
        <Text
          position={[0, 0.3, 0]}
          fontSize={0.4}
          color="#ff4444"
          anchorX="center"
          anchorY="middle"
        >
          热通道 Hot Aisle
        </Text>
      </group>

      <fog attach="fog" args={['#0a1628', 20, 60]} />
    </group>
  );
};
