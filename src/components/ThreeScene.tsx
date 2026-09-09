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

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020202); // සම්පූර්ණ අඳුරු පසුබිම

    // 🚀 Camera Setup
    const camera = new THREE.PerspectiveCamera(
      50,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.1,
      1000
    );
    camera.position.set(0, 0, 4.5);

    // 🚀 Cinematic Lighting (අඳුරු පරිසරයක චලනය වන Torch / Spotlight)
    const ambientLight = new THREE.AmbientLight(0x111115, 0.4); // ඉතා අවම ආලෝකයක්
    scene.add(ambientLight);

    // ප්‍රධාන චලනය වන ෆ්ලෑෂ් ලයිට් එක (Moving Flashlight)
    const flashlight = new THREE.PointLight(0xfff2e0, 3.5, 8);
    flashlight.position.set(0, 0, 2);
    scene.add(flashlight);

    // ලයිට් එකේ පිහිටීම පෙන්වන කුඩා දීප්තිමත් ලපයක් (ঐচ্ছিক)
    const bulbGeometry = new THREE.SphereGeometry(0.04, 16, 16);
    const bulbMaterial = new THREE.MeshBasicMaterial({ color: 0xfff2e0 });
    const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
    flashlight.add(bulb);

    // 🚀 3D Sculpture / Stone Relief (මූර්තියක් වැනි සංකීර්ණ හැඩයක්)
    const sculptureGroup = new THREE.Group();

    // අද්භූත සුවිශේෂී මූර්ති ස්වරූපයක් සඳහා Knot සහ Torus එකතු කිරීම
    const geometry1 = new THREE.TorusKnotGeometry(1, 0.3, 128, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0x888890,
      roughness: 0.75,
      metalness: 0.25,
      bumpScale: 0.05,
    });

    const sculptureMesh = new THREE.Mesh(geometry1, material);
    sculptureGroup.add(sculptureMesh);
    scene.add(sculptureGroup);

    // 🚀 Mouse & Touch Tracking Variables
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

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || isCleanedUp) return;
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // 🚀 Animation Loop (Mouse Tracking + Mobile Auto-orbit Flashlight)
    const clock = new THREE.Clock();

    const animate = () => {
      if (isCleanedUp) return;
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();

      // ජංගම දුරකථන වලදී හෝ මවුස් එක ක්‍රියාත්මක නොවන විට ලයිට් එක ස්වයංක්‍රීයව වටේට ගමන් කරයි (Auto Mobile Mode)
      if (!isUserActive) {
        autoAngle += delta * 0.8;
        mouseX = Math.sin(autoAngle) * 1.2;
        mouseY = Math.cos(autoAngle * 0.5) * 0.8;
      }

      // Smooth interpolation (මෘදු චලනයක් සඳහා)
      targetX += (mouseX * 1.8 - targetX) * 0.05;
      targetY += (mouseY * 1.8 - targetY) * 0.05;

      // ෆ්ලෑෂ් ලයිට් එක මවුස් එක හෝ ස්වයංක්‍රීය පථය දිගේ ගමන් කරවීම
      flashlight.position.x = targetX;
      flashlight.position.y = targetY;

      // මූර්තිය ඉතා සෙමෙන් ස්වයංක්‍රීයව කැරකැවීම
      sculptureMesh.rotation.x += delta * 0.1;
      sculptureMesh.rotation.y += delta * 0.15;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      isCleanedUp = true;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      geometry1.dispose();
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
