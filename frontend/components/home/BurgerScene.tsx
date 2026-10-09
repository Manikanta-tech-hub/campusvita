"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import type { Mesh } from "three";

function TestBurger() {
  const meshRef = useRef<Mesh>(null);

  return (
    <mesh ref={meshRef} rotation={[0.2, 0.4, 0]}>
      <torusGeometry args={[1.4, 0.45, 32, 64]} />
      <meshStandardMaterial color="#f59e0b" roughness={0.35} metalness={0} />
    </mesh>
  );
}

export default function BurgerScene() {
  return (
    <div className="h-[500px] w-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={1.2} />

        <directionalLight
          position={[3, 4, 5]}
          intensity={2}
        />

        <TestBurger />

        <Environment preset="studio" />

        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  );
}