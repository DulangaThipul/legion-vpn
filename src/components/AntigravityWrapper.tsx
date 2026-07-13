"use client";

import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";

export default function AntigravityWrapper({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Prevent scrolling while gravity is active
    document.body.style.overflow = "hidden";

    // Destructure Matter.js modules
    const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      MouseConstraint = Matter.MouseConstraint,
      Mouse = Matter.Mouse,
      World = Matter.World,
      Bodies = Matter.Bodies;

    // Create engine and world
    const engine = Engine.create();
    const world = engine.world;
    engineRef.current = engine;

    // Define viewport boundaries
    const width = window.innerWidth;
    const height = window.innerHeight;
    const thickness = 60;
    
    // Add invisible walls/ground
    const ground = Bodies.rectangle(width / 2, height + thickness / 2, width, thickness, { isStatic: true });
    const leftWall = Bodies.rectangle(0 - thickness / 2, height / 2, thickness, height, { isStatic: true });
    const rightWall = Bodies.rectangle(width + thickness / 2, height / 2, thickness, height, { isStatic: true });
    const ceiling = Bodies.rectangle(width / 2, 0 - thickness / 2, width, thickness, { isStatic: true });
    
    World.add(world, [ground, leftWall, rightWall, ceiling]);

    // Select all immediate child elements inside the dashboard container to drop
    // We target `.glass-panel` and `header` elements for a clean dashboard effect
    const elements = Array.from(containerRef.current.querySelectorAll('.glass-panel, header')) as HTMLElement[];

    const domBodies: { body: Matter.Body; elem: HTMLElement; initialX: number; initialY: number }[] = [];

    elements.forEach((elem) => {
      const rect = elem.getBoundingClientRect();
      
      // Only map elements that are visible and have size
      if (rect.width === 0 || rect.height === 0) return;

      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      // Create a matching physics body
      const body = Bodies.rectangle(x, y, rect.width, rect.height, {
        restitution: 0.6, // Bounciness
        friction: 0.1,
        density: 0.05
      });

      World.add(world, body);
      domBodies.push({ body, elem, initialX: x, initialY: y });

      // Lock dimensions so they don't collapse when translating
      elem.style.width = `${rect.width}px`;
      elem.style.height = `${rect.height}px`;
      // Ensure elements stay above background matrix but below modals
      elem.style.zIndex = "50";
    });

    // Add Mouse Dragging Constraint
    const mouse = Mouse.create(document.body);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });
    World.add(world, mouseConstraint);

    // Run the engine
    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);

    // Sync DOM transforms with Physics bodies
    let animationFrameId: number;
    const updateDOM = () => {
      domBodies.forEach(({ body, elem, initialX, initialY }) => {
        const dx = body.position.x - initialX;
        const dy = body.position.y - initialY;
        
        // Update DOM position and rotation using CSS transform
        elem.style.transform = `translate(${dx}px, ${dy}px) rotate(${body.angle}rad)`;
        elem.style.transition = 'none'; // Disable Tailwind transitions
        elem.style.pointerEvents = 'auto'; 
      });
      animationFrameId = requestAnimationFrame(updateDOM);
    };

    updateDOM();

    // Cleanup on disable
    return () => {
      cancelAnimationFrame(animationFrameId);
      Runner.stop(runner);
      Engine.clear(engine);
      document.body.style.overflow = ""; // Restore scroll
      
      // Reset DOM elements
      domBodies.forEach(({ elem }) => {
        elem.style.transform = '';
        elem.style.transition = '';
        elem.style.width = '';
        elem.style.height = '';
        elem.style.zIndex = '';
      });
    };
  }, [isActive]);

  return (
    <>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
        {children}
      </div>
      
      {/* Floating Gravity Switch */}
      <button
        onClick={() => setIsActive(!isActive)}
        style={{
          position: "fixed",
          bottom: "2rem",
          left: "2rem",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: isActive ? "#bd00ff" : "rgba(5, 5, 5, 0.8)",
          backdropFilter: "blur(10px)",
          border: isActive ? "2px solid #bd00ff" : "1px solid rgba(255, 255, 255, 0.2)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 9999,
          boxShadow: isActive ? "0 0 25px rgba(189, 0, 255, 0.8)" : "0 0 15px rgba(255, 255, 255, 0.1)",
          transition: "all 0.3s ease"
        }}
        title="Toggle Anti-Gravity"
        onMouseOver={(e) => {
          if (!isActive) e.currentTarget.style.boxShadow = "0 0 20px rgba(255, 255, 255, 0.4)";
          e.currentTarget.style.transform = "scale(1.1)";
        }}
        onMouseOut={(e) => {
          if (!isActive) e.currentTarget.style.boxShadow = "0 0 15px rgba(255, 255, 255, 0.1)";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      </button>
    </>
  );
}
