"use client";

import { useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export type Pointer = RefObject<{ x: number; y: number }>;

type SceneProps = {
  pointer: Pointer;
  reduced: boolean;
  interactive: boolean;
};

function makeSoftTexture(inner: string, outer: string, size = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.4, outer);
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Pseudo-random determinístico (puro) — evita Math.random() no render.
function rand(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function Embers({ reduced, pointer, count }: { reduced: boolean; pointer: Pointer; count: number }) {
  const ref = useRef<THREE.Points>(null);

  const { positions, speeds, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rand(i * 4 + 1) - 0.5) * 12;
      positions[i * 3 + 1] = (rand(i * 4 + 2) - 0.5) * 9;
      positions[i * 3 + 2] = (rand(i * 4 + 3) - 0.5) * 3;
      speeds[i] = 0.08 + rand(i * 4 + 4) * 0.22;
      phases[i] = rand(i * 7 + 5) * Math.PI * 2;
    }
    return { positions, speeds, phases };
  }, [count]);

  const texture = useMemo(
    () => makeSoftTexture("rgba(255,255,255,1)", "rgba(255,224,178,0.85)", 64),
    []
  );

  useFrame((state, delta) => {
    if (reduced || !ref.current) return;
    const attr = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      let y = attr.getY(i) + speeds[i] * delta;
      const x = attr.getX(i) + Math.sin(t * 0.5 + phases[i]) * 0.0025;
      if (y > 4.5) y = -4.5;
      attr.setY(i, y);
      attr.setX(i, x);
    }
    attr.needsUpdate = true;
    // Parallax sutil do campo de partículas conforme o cursor.
    ref.current.position.x = (pointer.current.x - 0.5) * 0.6;
    ref.current.position.y = -(pointer.current.y - 0.5) * 0.4;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        size={0.09}
        sizeAttenuation
        transparent
        opacity={0.55}
        color="#e3b579"
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function LanternGlow({ pointer }: { pointer: Pointer }) {
  const ref = useRef<THREE.Sprite>(null);
  const { viewport } = useThree();
  const target = useRef(new THREE.Vector3());
  const texture = useMemo(
    () => makeSoftTexture("rgba(255,238,204,0.9)", "rgba(255,196,120,0.35)", 256),
    []
  );

  useFrame(() => {
    if (!ref.current) return;
    const x = (pointer.current.x - 0.5) * viewport.width;
    const y = -(pointer.current.y - 0.5) * viewport.height;
    target.current.set(x, y, 0);
    ref.current.position.lerp(target.current, 0.08);
  });

  return (
    <sprite ref={ref} scale={[7, 7, 1]}>
      <spriteMaterial
        map={texture}
        transparent
        opacity={0.2}
        color="#ffcf8a"
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </sprite>
  );
}

export default function AtmosphereScene({ pointer, reduced, interactive }: SceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      camera={{ position: [0, 0, 5], fov: 50 }}
      frameloop={reduced ? "demand" : "always"}
    >
      <Embers reduced={reduced} pointer={pointer} count={interactive ? 180 : 90} />
      {interactive && <LanternGlow pointer={pointer} />}
    </Canvas>
  );
}
