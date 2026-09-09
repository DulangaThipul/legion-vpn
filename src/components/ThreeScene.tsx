"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene, Camera & WebGL Renderer Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // Lights (Ambient & Directional matching original)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    // 1. Star Background (Exact original 5,001 points in sphere, radius 1.5)
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
    });

    const starPoints = new THREE.Points(starGeometry, starMaterial);
    const starGroup = new THREE.Group();
    starGroup.rotation.z = Math.PI / 4; // Matching original rotation tilt
    starGroup.add(starPoints);
    scene.add(starGroup);

    // 2. Wireframe Shape (Icosahedron matching original args={[1, 1]} and opacity 0.5)
    const icosaGeometry = new THREE.IcosahedronGeometry(1, 1);
    const icosaMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    const icosaMesh = new THREE.Mesh(icosaGeometry, icosaMaterial);
    
    const shapeGroup = new THREE.Group();
    shapeGroup.add(icosaMesh);
    scene.add(shapeGroup);

    // Mouse Tracking Offset
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Window Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Animation Loop (Matching original rotation speeds & interpolation)
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Star rotation matching useFrame (delta/10, delta/15)
      starGroup.rotation.x -= delta / 10;
      starGroup.rotation.y -= delta / 15;

      // Wireframe rotation matching meshRef (delta*0.2, delta*0.3)
      icosaMesh.rotation.x += delta * 0.2;
      icosaMesh.rotation.y += delta * 0.3;

      // Smooth mouse interpolation matching groupRef
      const targetX = (mouseY * Math.PI) / 5;
      const targetY = (mouseX * Math.PI) / 5;
      shapeGroup.rotation.x += (targetX - shapeGroup.rotation.x) * 0.05;
      shapeGroup.rotation.y += (targetY - shapeGroup.rotation.y) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on unmount
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      starGeometry.dispose();
      starMaterial.dispose();
      icosaGeometry.dispose();
      icosaMaterial.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
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
      }}
    />
  );
}
