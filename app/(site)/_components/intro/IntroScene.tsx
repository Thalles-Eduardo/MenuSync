"use client";

import { Suspense, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useVideoTexture } from "@react-three/drei";
import * as THREE from "three";
import ToriiCorridor from "./ToriiCorridor";

type Props = { progress: RefObject<number> };

// smoothstep
const ss = (t: number) => t * t * (3 - 2 * t);

// Move a câmera pelo corredor conforme o progress (0..1):
// A (0 -> 0.6): baixa, planando sobre a água, avançando pela trilha.
// B (0.6 -> 1): acelera em direção à luz do fim (o flash assume no final).
function CameraRig({ progress }: Props) {
  const { camera } = useThree();
  const pos = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const p = progress.current ?? 0;
    const a = ss(THREE.MathUtils.clamp(p / 0.6, 0, 1));
    const b = ss(THREE.MathUtils.clamp((p - 0.6) / 0.4, 0, 1));
    const t = state.clock.elapsedTime;

    // Avança em -Z pela trilha: 11 -> -3 (fase A) -> -19 (fase B).
    const z = p < 0.6 ? THREE.MathUtils.lerp(11, -3, a) : THREE.MathUtils.lerp(-3, -19, b);
    const y = 0.95 + Math.sin(t * 0.6) * 0.05; // skim baixo + leve bob
    const x = Math.sin(t * 0.25) * 0.18; // leve balanço lateral

    pos.set(x, y, z);
    look.set(x * 0.4, 1.05, z - 6); // mira adiante no corredor
    camera.position.copy(pos);
    camera.lookAt(look);
  });

  return null;
}

// Luz do fim do corredor: intensifica conforme a câmera se aproxima ("entrar na luz").
function EndLight({ progress }: Props) {
  const ref = useRef<THREE.PointLight>(null);
  useFrame(() => {
    if (ref.current) ref.current.intensity = 4 + (progress.current ?? 0) * 18;
  });
  return (
    <pointLight ref={ref} position={[0, 1.6, -23]} distance={26} color="#fff0d0" intensity={4} />
  );
}

function FujiBackdrop() {
  // Vídeo do Fuji ao fundo do corredor (autoplay/muted/loop/playsInline).
  const tex = useVideoTexture("/video/bgLoader.mp4", {
    muted: true,
    loop: true,
    playsInline: true,
    start: true,
  });
  return (
    <mesh position={[0, 11, -40]}>
      <planeGeometry args={[120, 68]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

export default function IntroScene({ progress }: Props) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0.95, 11], fov: 60 }}
      // Preenche o contêiner mesmo se o react-use-measure reportar tamanho
      // defasado no 1º layout (o <canvas> interno é forçado a 100%).
      className="!absolute !inset-0 !h-full !w-full [&_canvas]:!h-full [&_canvas]:!w-full"
    >
      <ambientLight intensity={0.7} />
      <hemisphereLight args={["#bcd3ff", "#20140c", 0.6]} />
      <directionalLight position={[5, 10, 2]} intensity={0.9} color="#ffe6c0" />
      <EndLight progress={progress} />
      {/* O corredor é procedural (renderiza na hora); só o vídeo fica em Suspense. */}
      <ToriiCorridor />
      <Suspense fallback={null}>
        <FujiBackdrop />
      </Suspense>
      <CameraRig progress={progress} />
    </Canvas>
  );
}
