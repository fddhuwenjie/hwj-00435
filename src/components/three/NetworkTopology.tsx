import { useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { NetworkNode, NetworkLink, LinkStatus } from '@/types';

interface NetworkTopologyProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  visible: boolean;
  onNodePointerOver: (e: any, node: NetworkNode) => void;
  onNodePointerOut: () => void;
}

const getLinkColor = (status: LinkStatus, utilization: number): string => {
  if (status === 'disconnected') return '#ff4444';
  if (utilization > 80 || status === 'critical') return '#ff4444';
  if (utilization > 50 || status === 'warning') return '#ffcc00';
  return '#00ff88';
};

const getLinkWidth = (trafficFlow: number): number => {
  return 0.02 + trafficFlow * 0.008;
};

const NetworkLine = ({
  start,
  end,
  color,
  width,
  status,
}: {
  start: { x: number; y: number; z: number };
  end: { x: number; y: number; z: number };
  color: string;
  width: number;
  status: LinkStatus;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [pulsePhase, setPulsePhase] = useState(0);

  useFrame((_, delta) => {
    if (status === 'disconnected') {
      setPulsePhase((p) => (p + delta * 3) % (Math.PI * 2));
    }
  });

  const { geometry, material } = useMemo(() => {
    const startVec = new THREE.Vector3(start.x, start.y, start.z);
    const endVec = new THREE.Vector3(end.x, end.y, end.z);
    const midVec = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);
    midVec.y += 0.8;

    const curve = new THREE.QuadraticBezierCurve3(startVec, midVec, endVec);
    const tubeGeometry = new THREE.TubeGeometry(curve, 32, width, 8, false);

    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: status === 'disconnected' ? 0.8 : 0.7,
    });

    return { geometry: tubeGeometry, material: mat };
  }, [start, end, color, width, status]);

  useEffect(() => {
    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshBasicMaterial).color.set(color);
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity = status === 'disconnected'
        ? 0.4 + Math.sin(pulsePhase) * 0.4
        : 0.7;
    }
  }, [color, status, pulsePhase]);

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} />
  );
};

const NetworkNodeSphere = ({
  node,
  onPointerOver,
  onPointerOut,
}: {
  node: NetworkNode;
  onPointerOver: (e: any, node: NetworkNode) => void;
  onPointerOut: () => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [pulsePhase, setPulsePhase] = useState(0);

  useFrame((_, delta) => {
    setPulsePhase((p) => (p + delta * 2) % (Math.PI * 2));
    if (glowRef.current) {
      const scale = 1 + Math.sin(pulsePhase) * 0.2;
      glowRef.current.scale.setScalar(scale);
    }
  });

  const color = node.isOnline ? '#00d4ff' : '#ff4444';

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    onPointerOver(e, node);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    onPointerOut();
    document.body.style.cursor = 'auto';
  };

  return (
    <group position={[node.positionX, node.positionY, node.positionZ]}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
        />
      </mesh>

      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={node.isOnline ? 0.8 : 0.4}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>

      <mesh position={[0, 0.15, 0]}>
        <ringGeometry args={[0.06, 0.09, 16]} />
        <meshBasicMaterial
          color={node.isOnline ? '#00ff88' : '#ff4444'}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

export const NetworkTopology = ({
  nodes,
  links,
  visible,
  onNodePointerOver,
  onNodePointerOut,
}: NetworkTopologyProps) => {
  const groupRef = useRef<THREE.Group>(null);

  const nodeMap = useMemo(() => {
    const map = new Map<string, NetworkNode>();
    nodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [nodes]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.visible = visible;
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      {links.map((link) => {
        const fromNode = nodeMap.get(link.fromNodeId);
        const toNode = nodeMap.get(link.toNodeId);
        if (!fromNode || !toNode) return null;

        const color = getLinkColor(link.status, link.bandwidthUtilization);
        const width = getLinkWidth(link.trafficFlow);

        return (
          <NetworkLine
            key={link.id}
            start={{ x: fromNode.positionX, y: fromNode.positionY, z: fromNode.positionZ }}
            end={{ x: toNode.positionX, y: toNode.positionY, z: toNode.positionZ }}
            color={color}
            width={width}
            status={link.status}
          />
        );
      })}

      {nodes.map((node) => (
        <NetworkNodeSphere
          key={node.id}
          node={node}
          onPointerOver={onNodePointerOver}
          onPointerOut={onNodePointerOut}
        />
      ))}
    </group>
  );
};
