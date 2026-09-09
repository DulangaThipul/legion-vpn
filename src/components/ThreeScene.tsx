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

    const width = window.innerWidth || 800;
    const height = window.innerHeight || 600;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height);

    const scene = new THREE.Scene();

    // 🚀 2. CAMERA SETUP
    const camera = new THREE.PerspectiveCamera(
      60,
      width / height,
      0.1,
      1000
    );
    camera.position.z = 2.8;

    // 🚀 3. ENHANCED & LARGER STARFIELD
    const starCount = 800; 
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 3.2;

      positions[i] = r * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = r * Math.cos(phi);
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const starMaterial = new THREE.PointsMaterial({
      color: 0x818cf8,
      size: 0.035, // හොඳින් පෙනෙන ප්‍රමාණයක තාරකා
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const starPoints = new THREE.Points(starGeometry, starMaterial);
    scene.add(starPoints);

    // 🚀 4. WIREFRAME ICOSAHEDRON SHAPE
    const shapeGroup = new THREE.Group();
    const shapeGeometry = new THREE.IcosahedronGeometry(0.9, 1);
    const shapeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });

    const shapeMesh = new THREE.Mesh(shapeGeometry, shapeMaterial);
    shapeGroup.add(shapeMesh);
    scene.add(shapeGroup);

    // 🚀 5. MOUSE & TOUCH TRACKING (DESKTOP PARALLAX & MOBILE AUTO-ROTATE)
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    let isUserInteracting = false;
    let autoRotateAngle = 0;

    const handleMouseMove = (e: MouseEvent) => {
      isUserInteracting = true;
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        isUserInteracting = true;
        mouseX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    // 🚀 6. RESIZE LISTENER
    const handleResize = () => {
      if (!renderer || isCleanedUp) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // 🚀 7. RENDER LOOP
    const clock = new THREE.Clock();

    const animate = () => {
      if (isCleanedUp) return;
      animationFrameId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.1);

      // ජංගම දුරකථන වලදී හෝ මවුස් ක්‍රියාකාරී නොවන විට ස්වයංක්‍රීයව කැරකේ
      if (!isUserInteracting) {
        autoRotateAngle += delta * 0.5;
        mouseX = Math.sin(autoRotateAngle) * 0.5;
        mouseY = Math.cos(autoRotateAngle * 0.5) * 0.3;
      }

      targetX += (mouseX * 0.6 - targetX) * 0.05;
      targetY += (mouseY * 0.6 - targetY) * 0.05;

      // Starfield rotation
      starPoints.rotation.x -= 0.0005;
      starPoints.rotation.y -= 0.0008;
      starPoints.rotation.x += (targetY * 0.2 - starPoints.rotation.x) * 0.03;
      starPoints.rotation.y += (targetX * 0.2 - starPoints.rotation.y) * 0.03;

      // Icosahedron rotation
      shapeMesh.rotation.x += delta * 0.2;
      shapeMesh.rotation.y += delta * 0.3;
      shapeGroup.rotation.x = targetY;
      shapeGroup.rotation.y = targetX;

      renderer.render(scene, camera);
    };

    animate();

    // CLEANUP
    return () => {
      isCleanedUp = true;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      starGeometry.dispose();
      starMaterial.dispose();
      shapeGeometry.dispose();
      shapeMaterial.dispose();
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
