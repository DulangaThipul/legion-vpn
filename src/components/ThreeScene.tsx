"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;
    let renderer: THREE.WebGLRenderer | null = null;
    let isDisposed = false;

    try {
      // 🚀 0 වන ප්‍රමාණයන් (Zero dimensions) මඟහරවා ගැනීමට Window size සෘජුවම ලබා දී ඇත
      const width = window.innerWidth || 800;
      const height = window.innerHeight || 600;

      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      });

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height);

      const scene = new THREE.Scene();
      
      // Camera (ප්‍රථම කේතයේ තිබූ පරිදිම position [0, 0, 1] ලෙස සකසා ඇත)
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(0, 0, 1);

      // Lights (ප්‍රථම කේතයේ තිබූ පරිදිම)
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
      directionalLight.position.set(10, 10, 5);
      scene.add(directionalLight);

      // 1. Star Background (හරියටම මුල් කේතයේ තිබූ 5001 points සහ radius 1.5)
      const count = 5001;
      const positions = new Float32Array(count);
      for (let i = 0; i < count; i += 3) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = Math.cbrt(Math.random()) * 1.5;
        positions[i] = r * Math.sin(phi) * Math.cos(theta);
        positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i + 2] = r * Math.cos(phi);
      }

      const starGeometry = new THREE.BufferGeometry();
      starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

      const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.015,
        transparent: true,
        depthWrite: false,
        sizeAttenuation: true,
      });

      const starPoints = new THREE.Points(starGeometry, starMaterial);
      const starGroup = new THREE.Group();
      starGroup.rotation.z = Math.PI / 4; // Original 45-degree tilt
      starGroup.add(starPoints);
      scene.add(starGroup);

      // 2. Wireframe Shape (Original Icosahedron args={[1, 1]} සහ opacity 0.5)
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

      // Mouse tracking offset
      let mouseX = 0;
      let mouseY = 0;

      const handleMouseMove = (e: MouseEvent) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      };

      window.addEventListener("mousemove", handleMouseMove, { passive: true });

      // Window Resize Listener
      const handleResize = () => {
        if (!renderer || isDisposed) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      window.addEventListener("resize", handleResize);

      // Animation Loop (මුල් කේතයේ තිබූ පරිදිම rotation speeds සහ interpolation)
      const clock = new THREE.Clock();

      const animate = () => {
        if (isDisposed) return;
        animId = requestAnimationFrame(animate);

        const delta = Math.min(clock.getDelta(), 0.1);

        // Star rotation (-delta/10, -delta/15)
        starGroup.rotation.x -= delta / 10;
        starGroup.rotation.y -= delta / 15;

        // Wireframe rotation (+delta*0.2, +delta*0.3)
        shapeMesh.rotation.x += delta * 0.2;
        shapeMesh.rotation.y += delta * 0.3;

        // Smooth mouse tracking interpolation
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
      console.error("ThreeJS Render Error:", err);
    }
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
