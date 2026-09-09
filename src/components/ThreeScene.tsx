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
    camera.position.set(0, 2.0, 3.8);
    camera.lookAt(0, 0, 0);

    // 🚀 3. REAL SPIRAL MILKY WAY GALAXY (LARGE GLOWING STARS & ARMS)
    const starCount = 2200; 
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    // ගැලැක්සියේ මැද Core එකේ වර්ණය (රන්වන්/සුදු) සහ පිටත බාහු වල වර්ණය (නිල්/පර්පල්)
    const colorInside = new THREE.Color("#fff5cb");
    const colorOutside = new THREE.Color("#818cf8");

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      
      // සැබෑ ගැලැක්සි සර්පිලාකාර සමීකරණය (Logarithmic Spiral Arms - Arms 4 ක්)
      const radius = Math.random() * 5.0;
      const spinAngle = radius * 1.4;
      const branchAngle = ((i % 4) * Math.PI * 2) / 4; 
      
      const theta = branchAngle + spinAngle + (Math.random() - 0.5) * 0.4;

      const x = Math.cos(theta) * radius + (Math.random() - 0.5) * 0.4;
      const y = (Math.random() - 0.5) * (0.6 / (radius + 0.3)); // මැද ඝනකම් තැටියක් වීම
      const z = Math.sin(theta) * radius + (Math.random() - 0.5) * 0.4;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      // තාරකා වල වර්ණ මිශ්‍ර කිරීම (Core සිට පිටතට)
      const mixedColor = colorInside.clone();
      mixedColor.lerp(colorOutside, radius / 5.0);
      
      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.11, // 🚀 ඔබ ඉල්ලූ පරිදි තාරකා ප්‍රමාණය හොඳින් පෙනෙන පරිදි විශාල කර ඇත
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      sizeAttenuation: true,
      vertexColors: true, // වර්ණ විවිධත්වය සක්‍රීය කිරීම
      blending: THREE.AdditiveBlending, // තාරකා එකිනෙක මත බබළන ස්වභාවය
    });

    const starPoints = new THREE.Points(starGeometry, starMaterial);
    
    // ගැලැක්සිය 3D පෙනුම සඳහා මඳක් ඇල කර තැබීම
    const galaxyGroup = new THREE.Group();
    galaxyGroup.rotation.x = Math.PI / 5;
    galaxyGroup.add(starPoints);
    scene.add(galaxyGroup);

    // 🚀 4. 3D WIREFRAME ICOSAHEDRON (ගැලැක්සියේ හරය/Core එක ලෙස මැද පිහිටයි)
    const shapeGroup = new THREE.Group();
    const shapeGeometry = new THREE.IcosahedronGeometry(0.7, 1);
    const shapeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });

    const shapeMesh = new THREE.Mesh(shapeGeometry, shapeMaterial);
    shapeGroup.add(shapeMesh);
    scene.add(shapeGroup);

    // 🚀 5. MOUSE PARALLAX & AUTO MOVEMENT
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

    // 🚀 7. RENDER LOOP (GALAXY ROTATION)
    const animate = () => {
      if (isCleanedUp) return;
      animationFrameId = requestAnimationFrame(animate);

      targetX += (mouseX * 0.4 - targetX) * 0.05;
      targetY += (mouseY * 0.4 - targetY) * 0.05;

      // 🌌 සැබෑ ගැලැක්සියක් මෙන් මුළු තාරකා පද්ධතියම ස්වයංක්‍රීයව පරිභ්‍රමණය වීම
      galaxyGroup.rotation.y += 0.002; 

      // Parallax effect
      galaxyGroup.rotation.x = (Math.PI / 5) + targetY * 0.25;
      galaxyGroup.rotation.z = targetX * 0.25;

      // Core wireframe rotation
      shapeMesh.rotation.x += 0.004;
      shapeMesh.rotation.y += 0.007;
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
