"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Icosahedron } from "@react-three/drei";

function StarBackground(props: any) {
  const ref = useRef<any>();
  
  // 🚀 maath/random බිඳ වැටීම වැළැක්වීමට Native JavaScript මගින් exact original 5,001 points ජනනය කර ඇත
  const sphere = useMemo(() => {
    const buffer = new Float32Array(5001);
    for (let i = 0; i < 5001; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 1.5;
      buffer[i] = r * Math.sin(phi) * Math.cos(theta);
      buffer[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      buffer[i + 2] = r * Math.cos(phi);
    }
    return buffer;
  }, []);

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
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
    if (groupRef.current) {
      const targetX = (state.mouse.y * Math.PI) / 5;
      const targetY = (state.mouse.x * Math.PI) / 5;
      
      groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.05;
      groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.05;
    }
  });

  return (
    <group ref= {groupRef}>
      <Icosahedron ref={meshRef} args={[1, 1]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#ffffff" wireframe={true} transparent opacity={0.5} />
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
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
      <Canvas 
        style={{ width: "100%", height: "100%", display: "block" }} 
        camera={{ position: [0, 0, 1] }} 
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: "high-performance", alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
        <StarBackground />
        <WireframeShape />
      </Canvas>
    </div>
  );
}
