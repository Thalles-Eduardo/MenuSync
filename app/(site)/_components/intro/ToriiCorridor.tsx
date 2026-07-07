"use client";

import { useMemo } from "react";

const RED = "#c0392b";
const LANTERN = "#ffb457";

function Lantern({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.16, 16, 12]} />
      <meshStandardMaterial
        color={LANTERN}
        emissive={LANTERN}
        emissiveIntensity={2.4}
        toneMapped={false}
      />
    </mesh>
  );
}

// Portal torii procedural (pilares + vigas), com duas lanternas penduradas.
function Torii({ z }: { z: number }) {
  return (
    <group position={[0, 0, z]}>
      <mesh position={[-1, 1.5, 0]}>
        <cylinderGeometry args={[0.1, 0.14, 3, 16]} />
        <meshStandardMaterial color={RED} roughness={0.6} />
      </mesh>
      <mesh position={[1, 1.5, 0]}>
        <cylinderGeometry args={[0.1, 0.14, 3, 16]} />
        <meshStandardMaterial color={RED} roughness={0.6} />
      </mesh>
      {/* kasagi (viga superior) */}
      <mesh position={[0, 3.0, 0]}>
        <boxGeometry args={[2.9, 0.22, 0.3]} />
        <meshStandardMaterial color={RED} roughness={0.6} />
      </mesh>
      {/* shimaki */}
      <mesh position={[0, 2.76, 0]}>
        <boxGeometry args={[2.6, 0.14, 0.26]} />
        <meshStandardMaterial color={RED} roughness={0.6} />
      </mesh>
      {/* nuki (viga inferior) */}
      <mesh position={[0, 2.1, 0]}>
        <boxGeometry args={[2.4, 0.16, 0.22]} />
        <meshStandardMaterial color={RED} roughness={0.6} />
      </mesh>
      {/* gakuzuka (strut central) */}
      <mesh position={[0, 2.45, 0]}>
        <boxGeometry args={[0.18, 0.55, 0.18]} />
        <meshStandardMaterial color={RED} roughness={0.6} />
      </mesh>
      <Lantern position={[-0.55, 1.85, 0]} />
      <Lantern position={[0.55, 1.85, 0]} />
    </group>
  );
}

export default function ToriiCorridor() {
  const gates = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < 7; i++) arr.push(3 - i * 4);
    return arr;
  }, []);

  return (
    <group>
      {/* superfície da água (plano escuro e levemente reflexivo) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]}>
        <planeGeometry args={[140, 140]} />
        <meshStandardMaterial color="#0d1a24" metalness={0.7} roughness={0.25} />
      </mesh>

      {gates.map((z, i) => (
        <Torii key={i} z={z} />
      ))}

      {/* luzes quentes ao longo do corredor */}
      <pointLight position={[0, 1.6, -1]} intensity={5} distance={10} color="#ffb066" />
      <pointLight position={[0, 1.6, -13]} intensity={5} distance={12} color="#ffb066" />
    </group>
  );
}
