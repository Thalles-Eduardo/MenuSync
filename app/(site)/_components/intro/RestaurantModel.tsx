"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODEL_URL = "/3d/japanese_restaurant.glb";
useGLTF.preload(MODEL_URL);

type Props = {
  position?: [number, number, number];
  rotationY?: number;
  targetSize?: number; // maior dimensão do modelo, em unidades de cena
};

export default function RestaurantModel({
  position = [0, 0, 0],
  rotationY = 0,
  targetSize = 4,
}: Props) {
  const { scene } = useGLTF(MODEL_URL);
  const ref = useRef<THREE.Group>(null);

  // Normaliza: centraliza em X/Z, apoia a base em y=0 e escala para targetSize.
  const normalized = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    clone.position.set(-center.x, -box.min.y, -center.z);
    const wrapper = new THREE.Group();
    wrapper.add(clone);
    wrapper.scale.setScalar(targetSize / maxDim);
    return wrapper;
  }, [scene, targetSize]);

  // Balanço idle sutil.
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.6) * 0.03;
    }
  });

  return (
    <group ref={ref} position={position} rotation={[0, rotationY, 0]}>
      <primitive object={normalized} />
    </group>
  );
}
