"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function MatrixParticles() {
  const count = 1000; // Drastically reduced for performance
  const mesh = useRef<THREE.InstancedMesh>(null);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 50;
      const y = (Math.random() - 0.5) * 50;
      const z = (Math.random() - 0.5) * 50;
      // Varying speeds for depth effect
      const speed = 0.02 + Math.random() * 0.15;
      // Varying lengths to simulate data packets
      const scaleY = 0.2 + Math.random() * 1.5;
      temp.push({ x, y, z, speed, scaleY });
    }
    return temp;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!mesh.current) return;
    particles.forEach((particle, i) => {
      particle.y -= particle.speed;
      // Reset position when falling below view
      if (particle.y < -25) {
        particle.y = 25;
      }
      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.scale.set(1, particle.scaleY, 1);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.015, 1, 0.015]} />
      <meshBasicMaterial color="#FFFFFF" transparent opacity={0.15} />
    </instancedMesh>
  );
}

export default function DashboardMatrix() {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: -1, pointerEvents: "none" }}>
      <Canvas camera={{ position: [0, 0, 20], fov: 60 }} dpr={[1, 1.5]}>
        <color attach="background" args={["#030303"]} />
        <MatrixParticles />
      </Canvas>
    </div>
  );
}
