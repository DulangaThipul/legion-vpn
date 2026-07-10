"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Icosahedron } from "@react-three/drei";
import * as random from "maath/random/dist/maath-random.esm";

function StarBackground(props: any) {
  const ref = useRef<any>();
  // Generate 5001 random points in a sphere (must be divisible by 3)
  const sphere = random.inSphere(new Float32Array(5001), { radius: 1.5 });

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere as Float32Array} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#ffffff"
          size={0.015}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

function WireframeShape() {
  const meshRef = useRef<any>();
  const groupRef = useRef<any>();

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Continuous base rotation
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
    if (groupRef.current) {
      // Mouse tracking offset
      const targetX = (state.mouse.y * Math.PI) / 5;
      const targetY = (state.mouse.x * Math.PI) / 5;
      
      // Smoothly interpolate towards mouse position
      groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.05;
      groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <Icosahedron ref={meshRef} args={[1, 1]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#ffffff" wireframe={true} transparent opacity={0.5} />
      </Icosahedron>
    </group>
  );
}

export default function ThreeScene() {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: "none" }}>
      <Canvas style={{ width: "100%", height: "100%", display: "block" }} camera={{ position: [0, 0, 1] }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
        <StarBackground />
        <WireframeShape />
      </Canvas>
    </div>
  );
}
