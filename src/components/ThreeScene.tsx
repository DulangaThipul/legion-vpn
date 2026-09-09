"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer | null = null;
    let isCleanedUp = false;

    // 🚀 1. WEBGL INITIALIZATION (SAFE & OPTIMIZED)
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    if (!renderer) return;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // සම්පූර්ණ කළු පාට අහස (Dark Sky)

    // 🚀 2. CAMERA SETUP
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.5, 4);
    camera.lookAt(0, 0, 0);

    // 🚀 3. MATRIX DIGITAL CLOUDS (GRID PARTICLES)
    const particleCount = 2500;
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // වලාකුළු මෙන් පහළ තට්ටුවක පැතිරී යන සේ සකස් කිරීම
      positions[i3] = (Math.random() - 0.5) * 8;     // X axis (Width)
      positions[i3 + 1] = -0.5 + Math.random() * 1.2; // Y axis (Height - පහළ වලාකුළු මට්ටම)
      positions[i3 + 2] = (Math.random() - 0.5) * 6;  // Z axis (Depth)

      scales[i] = Math.random();
    }

    const cloudGeometry = new THREE.BufferGeometry();
    cloudGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // Matrix Green & Cyberpunk Cyan වර්ණ සහිත Glowing Particles
    const cloudMaterial = new THREE.PointsMaterial({
      color: 0x00ff66, // Matrix Neon Green
      size: 0.05,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const cloudPoints = new THREE.Points(cloudGeometry, cloudMaterial);
    scene.add(cloudPoints);

    // 🚀 4. MOUSE PARALLAX INTERACTION
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // 🚀 5. RESIZE LISTENER
    const handleResize = () => {
      if (!renderer || isCleanedUp) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // 🚀 6. ANIMATION LOOP (WAVE & MATRIX MOTION)
    const clock = new THREE.Clock();

    const animate = () => {
      if (isCleanedUp) return;
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Mouse smoothing
      targetX += (mouseX * 0.5 - targetX) * 0.05;
      targetY += (mouseY * 0.5 - targetY) * 0.05;

      // වලාකුළු වල රැළි ස්වභාවය (Wave motion like rolling clouds)
      const positionAttribute = cloudGeometry.attributes.position as THREE.BufferAttribute;
      const vertex = new THREE.Vector3();

      for (let i = 0; i < particleCount; i++) {
        positionAttribute.getX(i);
        const z = positionAttribute.getZ(i);

        // Sine wave එකක් මඟින් වලාකුළු මෘදුව ගමන් කරවීම
        const y = -0.5 + Math.sin(elapsedTime * 0.8 + positionAttribute.getX(i) * 1.5) * 0.15;
        positionAttribute.setY(i, y);

        // ඉදිරියට ගලා යන හැඟීමක් ලබා දීම
        let newZ = z + 0.003;
        if (newZ > 3) newZ = -3;
        positionAttribute.setZ(i, newZ);
      }
      positionAttribute.needsUpdate = true;

      // Camera rotation based on mouse
      camera.position.x = targetX * 0.8;
      camera.position.y = 1.5 + targetY * 0.4;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // CLEANUP
    return () => {
      isCleanedUp = true;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      cloudGeometry.dispose();
      cloudMaterial.dispose();
      renderer?.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </div>
  );
}
