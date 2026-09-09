"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Icosahedron } from "@react-three/drei";

// 🚀 OPTIMIZED STARFIELD (PURE JS - ZERO EXTERNAL BUNDLE CRASHES)
function StarBackground(props: any) {
  const ref = useRef<any>();

  // 1,800 floats = 600 stars (Low-end budget phones වලට සුපිරියටම smooth)
  const sphere = useMemo(() => {
    const count = 1800;
    const arr = new Float32Array(count);
    for (let i = 0; i < count; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 1.5;
      arr[i] = r * Math.sin(phi) * Math.cos(theta);
      arr[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta * 0.05;
      ref.current.rotation.y -= delta * 0.075;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#818cf8"
          size={0.012}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

// 🚀 OPTIMIZED INTERACTIVE WIREFRAME SHAPE
function WireframeShape() {
  const meshRef = useRef<any>();
  const groupRef = useRef<any>();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.15;
      meshRef.current.rotation.y += delta * 0.2;
    }
    if (groupRef.current) {
      const targetX = (state.mouse.y * Math.PI) / 6;
      const targetY = (state.mouse.x * Math.PI) / 6;
      groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.05;
      groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Radius 0.75 ලෙස සකසා camera clipping bug එක සම්පූර්ණයෙන්ම වළක්වා ඇත */}
      <Icosahedron ref={meshRef} args={[0.75, 1]} position={[0, 0, 0]}>
        <meshBasicMaterial color="#ffffff" wireframe={true} transparent opacity={0.35} />
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
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        pointerEvents: "none",
        contain: "strict"
      }}
    >
      <Canvas
        style={{ width: "100%", height: "100%", display: "block" }}
        // Camera z-axis එක 2.2 දක්වා ගෙනැවිත් Clipping bug එක fix කර ඇත
        camera={{ position: [0, 0, 2.2], fov: 60 }}
        dpr={[1, 1.2]} // High-resolution phones වල GPU overheating & thermal throttling නවතී
        gl={{
          antialias: false,
          powerPreference: "high-performance",
          alpha: true
        }}
      >
        <StarBackground />
        <WireframeShape />
      </Canvas>
    </div>
  );
}
