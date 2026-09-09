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

    // 🚀 1. WEBGL INITIALIZATION
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
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
    camera.position.set(0, 1.5, 3.2);
    camera.lookAt(0, 0, 0);

    // 🚀 3. MILKY WAY GALAXY STARFIELD (SPIRAL DISK DISTRIBUTION)
    const starCount = 1500; // තාරකා සංඛ්‍යාව වැඩි කර ගැලැක්සි ස්වභාවය වැඩි කර ඇත
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      
      // Galaxy Spiral Arms Mathematics
      const radius = Math.random() * 4.5;
      const spinAngle = radius * 1.2;
      const branchAngle = ((i % 3) * 2 * Math.PI) / 3; // බාහු 3 කින් යුත් ගැලැක්සියක්
      
      const theta = branchAngle + spinAngle + (Math.random() - 0.5) * 0.5;

      const x = Math.cos(theta) * radius + (Math.random() - 0.5) * 0.3;
      // මැද කොටස (Core එක) ඝනකම් සහ ඈතට යද්දී තුනී වන තැටියක් මෙන් සැකසීම
      const y = (Math.random() - 0.5) * (0.8 / (radius + 0.4)); 
      const z = Math.sin(theta) * radius + (Math.random() - 0.5) * 0.3;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const starMaterial = new THREE.PointsMaterial({
      color: 0xa29bfe, // 🌌 Cosmic purple-blue galaxy tint
      size: 0.07,     // 🚀 ඔබ ඉල්ලූ පරිදි තාරකා ප්‍රමාණය විශාල කර ඇත (Larger Stars)
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending, // තාරකා එකිනෙක මත හැමී බබළන ස්වභාවය
    });

    const starPoints = new THREE.Points(starGeometry, starMaterial);
    
    // ගැලැක්සිය සැබෑ පෙනුමක් ලබා ගැනීමට මඳක් ඇල කර තැබීම (Tilt)
    const galaxyGroup = new THREE.Group();
    galaxyGroup.rotation.x = Math.PI / 6;
    galaxyGroup.add(starPoints);
    scene.add(galaxyGroup);

    // 🚀 4. 3D WIREFRAME ICOSAHEDRON (මැද පිහිටන හරය/Core එක ලෙස)
    const shapeGroup = new THREE.Group();
    const shapeGeometry = new THREE.IcosahedronGeometry(0.8, 1);
    const shapeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });

    const shapeMesh = new THREE.Mesh(shapeGeometry, shapeMaterial);
    shapeGroup.add(shapeMesh);
    scene.add(shapeGroup);

    // 🚀 5. MOUSE PARALLAX & AUTOMATIC MOVEMENT TRACKING
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

    // 🚀 7. DYNAMIC GALAXY ROTATION & ANIMATION LOOP
    const animate = () => {
      if (isCleanedUp) return;
      animationFrameId = requestAnimationFrame(animate);

      // Smooth mouse interpolation
      targetX += (mouseX * 0.4 - targetX) * 0.05;
      targetY += (mouseY * 0.4 - targetY) * 0.05;

      // 🌌 සැබෑ ගැලැක්සියක් මෙන් මුළු තාරකා පද්ධතියම ස්වයංක්‍රීයව සෙමෙන් කැරකැවීම (Automatic movement)
      galaxyGroup.rotation.y += 0.0015; 

      // Parallax interaction with mouse
      galaxyGroup.rotation.x = (Math.PI / 6) + targetY * 0.3;
      galaxyGroup.rotation.z = targetX * 0.3;

      // Icosahedron core rotation
      shapeMesh.rotation.x += 0.003;
      shapeMesh.rotation.y += 0.005;
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
      radius: Math.random() * 2.5,
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
