import { useRef, useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useDataCenterStore } from '@/store/useDataCenterStore';

export const useCameraControls = () => {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const { cameraTarget, setCameraTarget } = useDataCenterStore();

  const animateCamera = useCallback((targetPos: THREE.Vector3, targetLookAt: THREE.Vector3) => {
    if (!controlsRef.current) return;

    const startPosition = camera.position.clone();
    const startTarget = controlsRef.current.target.clone();

    const duration = 1000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      camera.position.lerpVectors(startPosition, targetPos, eased);
      controlsRef.current.target.lerpVectors(startTarget, targetLookAt, eased);
      controlsRef.current.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [camera]);

  useEffect(() => {
    if (cameraTarget.position && cameraTarget.lookAt) {
      const pos = new THREE.Vector3(
        cameraTarget.position.x,
        cameraTarget.position.y,
        cameraTarget.position.z
      );
      const lookAt = new THREE.Vector3(
        cameraTarget.lookAt.x,
        cameraTarget.lookAt.y,
        cameraTarget.lookAt.z
      );
      animateCamera(pos, lookAt);
      setCameraTarget({ position: null, lookAt: null });
    }
  }, [cameraTarget, animateCamera, setCameraTarget]);

  return {
    controlsRef,
  };
};
