"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function ThreeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let animId: number;
    let renderer: THREE.WebGLRenderer | null = null;
    let isDisposed = false;

    try {
      // 🚀 0 වන ප්‍රමාණයන් (Zero dimensions) නිසා Crash වීම වැළැක්වීමට Fallback එකක් යොදා ඇත
      const width = container.clientWidth || window.innerWidth || 800;
      const height = container.clientHeight || window.innerHeight || 600;

      if (width <= 0 || height <= 0) return;

      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      });

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(0, 0, 1.8);

      // Lights
      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
      dirLight.position.set(10, 10, 5);
      scene.add(dirLight);

      // Star Background (Exact original 5,001 points)
      const starCount = 1667; // 1667 * 3 = 5001 coordinates
      const starPositions = new Float32Array(starCount * 3);

      for (let i = 0; i < starCount * 3; i += 3) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = Math.cbrt(Math.random()) * 1.5;
        starPositions[i] = r * Math.sin(phi) * Math.cos(theta);
        starPositions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
        starPositions[i + 2] = r * Math.cos(phi);
      }

      const starGeometry = new THREE.BufferGeometry();
      starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));

      const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.015,
        transparent: true,
        depthWrite: false,
        sizeAttenuation: true,
      });

      const starPoints = new THREE.Points(starGeometry, starMaterial);
      const starGroup = new THREE.Group();
      starGroup.rotation.set(0, 0, Math.PI / 4);
      starGroup.add(starPoints);
      scene.add(starGroup);

      // Wireframe Icosahedron
      const shapeGroup = new THREE.Group();
      const icosaGeometry = new THREE.IcosahedronGeometry(1, 1);
      const icosaMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      });

      const shapeMesh = new THREE.Mesh(icosaGeometry, icosaMaterial);
      shapeGroup.add(shapeMesh);
      scene.add(shapeGroup);

      // Mouse tracking
      let mouseX = 0;
      let mouseY = 0;

      const handleMouseMove = (e: MouseEvent) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      };

      window.addEventListener("mousemove", handleMouseMove, { passive: true });

      // Resize listener
      const handleResize = () => {
        if (!container || !renderer || isDisposed) return;
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        if (w <= 0 || h <= 0) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      window.addEventListener("resize", handleResize);

      // Animation Loop
      const clock = new THREE.Clock();

      const animate = () => {
        if (isDisposed) return;
        animId = requestAnimationFrame(animate);

        const delta = Math.min(clock.getDelta(), 0.1);

        starGroup.rotation.x -= delta / 10;
        starGroup.rotation.y -= delta / 15;

        shapeMesh.rotation.x += delta * 0.2;
        shapeMesh.rotation.y += delta * 0.3;

        const targetX = (mouseY * Math.PI) / 5;
        const targetY = (mouseX * Math.PI) / 5;

        shapeGroup.rotation.x += (targetX - shapeGroup.rotation.x) * 0.05;
        shapeGroup.rotation.y += (targetY - shapeGroup.rotation.y) * 0.05;

        renderer?.render(scene, camera);
      };

      animate();

      return () => {
        isDisposed = true;
        cancelAnimationFrame(animId);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("resize", handleResize);

        starGeometry.dispose();
        starMaterial.dispose();
        icosaGeometry.dispose();
        icosaMaterial.dispose();
        renderer?.dispose();
      };
    } catch (err) {
      console.error("ThreeJS initialization error:", err);
      setHasError(true);
    }
  }, []);

  if (hasError) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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
