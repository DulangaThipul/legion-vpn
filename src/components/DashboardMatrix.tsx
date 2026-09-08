"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";

function MatrixParticles({ count }: { count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 40;
      const y = (Math.random() - 0.5) * 40;
      const z = (Math.random() - 0.5) * 20;
      const speed = 0.05 + Math.random() * 0.12;
      const scaleY = 0.4 + Math.random() * 1.6;
      temp.push({ x, y, z, speed, scaleY });
    }
    return temp;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!mesh.current) return;
    particles.forEach((p, i) => {
      p.y -= p.speed;
      if (p.y < -20) p.y = 20;
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(1, p.scaleY, 1);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.02, 1, 0.02]} />
      <meshBasicMaterial color="#6366f1" transparent opacity={0.35} />
    </instancedMesh>
  );
}

export default function DashboardMatrix() {
  const [particleCount, setParticleCount] = useState(80);

  useEffect(() => {
    // Low-end / Mobile detection for maximum performance
    if (typeof window !== "undefined") {
      setParticleCount(window.innerWidth < 768 ? 80 : 220);
    }
  }, []);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
      <Canvas 
        camera={{ position: [0, 0, 18], fov: 60 }} 
        dpr={1} 
        gl={{ powerPreference: "low-power", antialias: false, depth: false, stencil: false }}
      >
        <color attach="background" args={["#030307"]} />
        <MatrixParticles count={particleCount} />
      </Canvas>
    </div>
  );
}
