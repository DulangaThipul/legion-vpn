"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Icosahedron } from "@react-three/drei";

function StarBackground(props: any) {
  const ref = useRef<any>();
  
  // maath/random ක්‍රෑෂ් වීම වැළැක්වීමට Pure JS මගින් හරියටම මුල් විදිහටම තාරකා 5,001 ක් ජනනය කර ඇත
  const sphere = useMemo(() => {
    const count = 5001;
    const buffer = new Float32Array(count);
    for (let i = 0; i < count; i += 3) {
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
          size={0.025} // 🚀 තාරකා ප්‍රමාණය මඳක් විශාල කර ඇත (Larger Stars)
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
  const autoRotateTime = useRef(0);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Continuous base rotation (ඔබේ මුල් කෝඩ් එකේ පරිදිම)
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
    if (groupRef.current) {
      const hasMouseMoved = state.mouse.x !== 0 || state.mouse.y !== 0;
      
      let targetX, targetY;
      if (hasMouseMoved) {
        // Desktop: Mouse tracking offset
        targetX = (state.mouse.y * Math.PI) / 5;
        targetY = (state.mouse.x * Math.PI) / 5;
      } else {
        // Mobile / Idle: Smooth Auto-rotate
        autoRotateTime.current += delta * 0.5;
        targetX = Math.sin(autoRotateTime.current) * 0.5;
        targetY = Math.cos(autoRotateTime.current * 0.5) * 0.3;
      }
      
      // Smoothly interpolate towards target position
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
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: "none" }}>
      <Canvas 
        style={{ width: "100%", height: "100%", display: "block" }} 
        camera={{ position: [0, 0, 1.5] }} 
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
        <StarBackground />
        <WireframeShape />
      </Canvas>
    </div>
  );
}
