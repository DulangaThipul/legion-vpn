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

    // 🚀 1. WEBGL INITIALIZATION WITH FALLBACK (BRAVE SHIELDS SAFE)
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false, // Low-end GPU memory optimization
        powerPreference: "high-performance",
      });
    } catch {
      run2DFallback(canvas);
      return;
    }

    if (!renderer) {
      run2DFallback(canvas);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);

    const scene = new THREE.Scene();

    // 🚀 2. CAMERA SETUP
    const camera = new THREE.PerspectiveCamera(
      60,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.1,
      1000
    );
    camera.position.z = 2.8;

    // 🚀 3. 3D ENHANCED & LARGER STARFIELD
    const starCount = 800; 
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      // තාරකා වල ගැඹුර වැඩි කිරීමට radius එක තරමක් පුළුල් කර ඇත
      const r = Math.cbrt(Math.random()) * 3.2;

      positions[i] = r * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = r * Math.cos(phi);
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const starMaterial = new THREE.PointsMaterial({
      color: 0x818cf8,
      size: 0.045, // 🚀 තාරකා ප්‍රමාණය මඳක් විශාල කර ඇත (Larger Stars)
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      sizeAttenuation: true, // 3D පෙනුම වැඩි කිරීමට දුර අනුව ප්‍රමාණය වෙනස් වේ
    });

    const starPoints = new THREE.Points(starGeometry, starMaterial);
    scene.add(starPoints);

    // 🚀 4. 3D WIREFRAME ICOSAHEDRON
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

    // 🚀 5. 3D MOUSE PARALLAX TRACKING
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // 🚀 6. RESIZE LISTENER
    const handleResize = () => {
      if (!container || !renderer || isCleanedUp) return;
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // 🚀 7. DYNAMIC 3D RENDER LOOP
    const animate = () => {
      if (isCleanedUp) return;
      animationFrameId = requestAnimationFrame(animate);

      // Smooth mouse interpolation for 3D depth effect
      targetX += (mouseX * 0.5 - targetX) * 0.05;
      targetY += (mouseY * 0.5 - targetY) * 0.05;

      // Starfield 3D rotation & parallax reaction
      starPoints.rotation.x -= 0.0005;
      starPoints.rotation.y -= 0.0008;
      starPoints.rotation.x += (targetY * 0.2 - starPoints.rotation.x) * 0.03;
      starPoints.rotation.y += (targetX * 0.2 - starPoints.rotation.y) * 0.03;

      // Icosahedron rotation & parallax reaction
      shapeMesh.rotation.x += 0.004;
      shapeMesh.rotation.y += 0.006;
      shapeGroup.rotation.x = targetY;
      shapeGroup.rotation.y = targetX;

      renderer.render(scene, camera);
    };

    animate();

    // CLEANUP
    return () => {
      isCleanedUp = true;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      starGeometry.dispose();
      starMaterial.dispose();
      shapeGeometry.dispose();
      shapeMaterial.dispose();
      if (renderer) {
        renderer.dispose();
      }
    };
  }, []);

  const run2DFallback = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.2,
      alpha: Math.random(),
      speed: Math.random() * 0.02 + 0.005,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#818cf8";
      for (const s of stars) {
        s.alpha += s.speed;
        ctx.globalAlpha = Math.abs(Math.sin(s.alpha));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      animId = requestAnimationFrame(render);
    };

    render();
  };

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
