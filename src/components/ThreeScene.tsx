"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer | null = null;
    let isCleanedUp = false;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    if (!renderer) return;

    // 🚀 Window dimensions සෘජුවම භාවිත කිරීම නිසා Size 0 වීමේ දෝෂ සම්පූර්ණයෙන්ම වැළකේ
    const width = window.innerWidth || 800;
    const height = window.innerHeight || 600;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030307);

    // 🚀 Camera Setup
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 0, 4);

    // 🚀 Lighting (Interactive Torch / Flashlight)
    const ambientLight = new THREE.AmbientLight(0x222228, 0.5);
    scene.add(ambientLight);

    const flashlight = new THREE.PointLight(0x818cf8, 4, 10);
    flashlight.position.set(0, 0, 2);
    scene.add(flashlight);

    // 🚀 Interactive 3D Torus Knot Object (විශාල, පැහැදිලි ත්‍රිමාණ හැඩයක්)
    const geometry = new THREE.TorusKnotGeometry(1, 0.35, 128, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.4,
      metalness: 0.6,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // 🚀 Mouse & Touch Tracking (Desktop Parallax & Mobile Auto Animation)
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    let isUserActive = false;
    let autoAngle = 0;

    const handleMouseMove = (e: MouseEvent) => {
      isUserActive = true;
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        isUserActive = true;
        mouseX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    // Window Resize Handler
    const handleResize = () => {
      if (!renderer || isCleanedUp) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // 🚀 Render Loop
    const clock = new THREE.Clock();

    const animate = () => {
      if (isCleanedUp) return;
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();

      // Mobile හෝ මවුස් එක පාවිච්චි නොකරන විට ස්වයංක්‍රීයව ලයිට් එක වටේට ගමන් කරයි
      if (!isUserActive) {
        autoAngle += delta * 0.8;
        mouseX = Math.sin(autoAngle) * 1.5;
        mouseY = Math.cos(autoAngle * 0.5) * 1.0;
      }

      // Smooth interpolation
      targetX += (mouseX * 1.5 - targetX) * 0.05;
      targetY += (mouseY * 1.5 - targetY) * 0.05;

    // Flashlight position update
      flashlight.position.x = targetX;
      flashlight.position.y = targetY;

      // Mesh slow rotation
      mesh.rotation.x += delta * 0.2;
      mesh.rotation.y += delta * 0.3;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isCleanedUp = true;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      geometry.dispose();
      material.dispose();
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
