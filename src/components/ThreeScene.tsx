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

    let animId: number;
    let isDisposed = false;

    // 1. WEBGL RENDERER SETUP (OPTIMIZED FOR LOW-END & MOBILE DEVICES)
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false, // Low-end devices වල lag වීම වළක්වයි
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height);

    const scene = new THREE.Scene();

    // 2. CAMERA SETUP (EXACT FOV & POSITION TO PREVENT CLIPPING)
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 1.8);

    // 3. LIGHTS (EXACT ORIGINAL INTENSITIES)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    // 4. STAR BACKGROUND (100% IDENTICAL 5,001 SPHERICAL POINTS)
    const starCount = 1667; // 1667 * 3 = 5001 float coordinates
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 1.5; // Radius 1.5 (Exact original)
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
    starGroup.rotation.set(0, 0, Math.PI / 4); // Exact original 45-deg tilt
    starGroup.add(starPoints);
    scene.add(starGroup);

    // 5. WIREFRAME ICOSAHEDRON (EXACT ORIGINAL MESH & MATERIAL)
    const shapeGroup = new THREE.Group();
    const icosaGeometry = new THREE.IcosahedronGeometry(1, 1); // args={[1, 1]}
    const icosaMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });

    const shapeMesh = new THREE.Mesh(icosaGeometry, icosaMaterial);
    shapeGroup.add(shapeMesh);
    scene.add(shapeGroup);

    // 6. MOUSE TRACKING (SMOOTH INTERPOLATION)
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // 7. RESIZE LISTENER
    const handleResize = () => {
      if (!container || isDisposed) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 8. RENDER LOOP (EXACT ORIGINAL ROTATION SPEEDS)
    const clock = new THREE.Clock();

    const animate = () => {
      if (isDisposed) return;
      animId = requestAnimationFrame(animate);

      const delta = Math.min(clock.getDelta(), 0.1);

      // Starfield base rotation
      starGroup.rotation.x -= delta / 10;
      starGroup.rotation.y -= delta / 15;

      // Icosahedron continuous rotation
      shapeMesh.rotation.x += delta * 0.2;
      shapeMesh.rotation.y += delta * 0.3;

      // Mouse tracking offset
      const targetX = (mouseY * Math.PI) / 5;
      const targetY = (mouseX * Math.PI) / 5;

      shapeGroup.rotation.x += (targetX - shapeGroup.rotation.x) * 0.05;
      shapeGroup.rotation.y += (targetY - shapeGroup.rotation.y) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    // CLEANUP
    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();

      starGeometry.dispose();
      starMaterial.dispose();
      icosaGeometry.dispose();
      icosaMaterial.dispose();
      renderer.dispose();
    };
  }, []);

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
