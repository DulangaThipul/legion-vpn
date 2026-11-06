"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function MatrixParticles() {
  // Optimized particle count for silky 60/120fps scrolling on both mobile and low-end PCs
  const count = 350;
  const mesh = useRef<THREE.InstancedMesh>(null);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 50;
      const y = (Math.random() - 0.5) * 50;
      const z = (Math.random() - 0.5) * 50;
      const speed = 0.03 + Math.random() * 0.14;
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
      <meshBasicMaterial color="#a855f7" transparent opacity={0.18} />
    </instancedMesh>
  );
}

export default function DashboardMatrix() {
  return (
    <div 
      style={{ 
        position: "fixed", 
        top: 0, 
        left: 0, 
        width: "100%", 
        height: "100%", 
        zIndex: -1, 
        pointerEvents: "none",
        contain: "strict",
        transform: "translateZ(0)"
      }}
    >
      <Canvas 
        camera={{ position: [0, 0, 20], fov: 60 }} 
        dpr={[1, 1.25]}
        gl={{ powerPreference: "low-power", antialias: false, depth: false, stencil: false }}
      >
        <color attach="background" args={["#040308"]} />
        <MatrixParticles />
      </Canvas>
    </div>
  );
}
