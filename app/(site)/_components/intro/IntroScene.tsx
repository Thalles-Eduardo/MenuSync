"use client";

import { Suspense, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useVideoTexture } from "@react-three/drei";
import * as THREE from "three";
import RestaurantModel from "./RestaurantModel";

type Props = { progress: RefObject<number> };

// smoothstep
const ss = (t: number) => t * t * (3 - 2 * t);

// Move a câmera pelo progress (0..1) em duas fases:
// A (0 -> 0.6): baixa, planando sobre a água, avançando para o restaurante.
// B (0.6 -> 1): sobe levemente, mira a entrada e entra.
function CameraRig({ progress }: Props) {
  const { camera } = useThree();
  const pos = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const p = progress.current ?? 0;
    const a = ss(THREE.MathUtils.clamp(p / 0.6, 0, 1));
    const b = ss(THREE.MathUtils.clamp((p - 0.6) / 0.4, 0, 1));

    // Fase A: z 9 -> 3.2 ; y 1.2 -> 0.55 (planando baixo sobre a água)
    const yA = THREE.MathUtils.lerp(1.2, 0.55, a);
    const zA = THREE.MathUtils.lerp(9, 3.2, a);
    // Fase B: z 3.2 -> 0.2 ; y 0.55 -> 1.1 (sobe e entra)
    const yB = THREE.MathUtils.lerp(0.55, 1.1, b);
    const zB = THREE.MathUtils.lerp(3.2, 0.2, b);

    pos.set(0, b > 0 ? yB : yA, b > 0 ? zB : zA);
    // Alvo sobe de ~0.8 para ~1.3 (mira a "entrada") na fase B.
    look.set(0, THREE.MathUtils.lerp(0.8, 1.3, b), 0);

    camera.position.copy(pos);
    camera.lookAt(look);
  });

  return null;
}

// Intensifica a luz quente conforme a câmera entra.
function WarmLight({ progress }: Props) {
  const ref = useRef<THREE.PointLight>(null);
  useFrame(() => {
    if (ref.current) ref.current.intensity = 2 + (progress.current ?? 0) * 12;
  });
  return (
    <pointLight
      ref={ref}
      position={[0, 1.4, 1.2]}
      distance={9}
      color="#ffcf8a"
      intensity={2}
    />
  );
}

function FujiBackdrop() {
  // Vídeo do Fuji como textura (autoplay/muted/loop/playsInline por padrão no drei).
  const tex = useVideoTexture("/video/bgLoader.mp4", {
    muted: true,
    loop: true,
    playsInline: true,
    start: true,
  });
  return (
    <mesh position={[0, 0, -12]}>
      <planeGeometry args={[52, 32]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

export default function IntroScene({ progress }: Props) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 1.2, 9], fov: 55 }}
      // Preenche o contêiner mesmo se o react-use-measure reportar tamanho
      // defasado no 1º layout (o <canvas> interno é forçado a 100%).
      className="!absolute !inset-0 !h-full !w-full [&_canvas]:!h-full [&_canvas]:!w-full"
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 8, 5]} intensity={1.1} />
      <WarmLight progress={progress} />
      <Suspense fallback={null}>
        <FujiBackdrop />
        <RestaurantModel position={[0, 0, 0]} rotationY={Math.PI} />
      </Suspense>
      <CameraRig progress={progress} />
    </Canvas>
  );
}
