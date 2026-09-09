"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Icosahedron } from "@react-three/drei";

// 🚀 maath import crash එක වළක්වා ගනිමින් තාරකා 5,001 ක් ජනනය කරන ශ්‍රිතය
function generateSphere(count: number, radius: number) {
  const buffer = new Float32Array(count);
  for (let i = 0; i < count; i += 3) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = Math.cbrt(Math.random()) * radius;
    const sinPhi = Math.sin(phi);
    buffer[i] = r * sinPhi * Math.cos(theta);
    buffer[i + 1] = r * sinPhi * Math.sin(theta);
    buffer[i + 2] = r * Math.cos(phi);
  }
  return buffer;
}

function StarBackground(props: any) {
  const ref = useRef<any>();
  // 🚀 Low-end phones වල Lag වීම වැළැක්වීමට එක් වරක් පමණක් generate වේ
  const sphere = useMemo(() => generateSphere(5001, 1.5), []);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
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
        <meshStandardMaterial color="#ffffff" wireframe={true} transparent opacity={0.6} />
      </Icosahedron>
    </group>
  );
}

export default function ThreeScene() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: "none" }}>
      <Canvas
        style={{ width: "100%", height: "100%", display: "block" }}
        camera={{ position: [0, 0, 2], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ powerPreference: "high-performance", antialias: false, alpha: true }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
        <StarBackground />
        <WireframeShape />
      </Canvas>
    </div>
  );
}
