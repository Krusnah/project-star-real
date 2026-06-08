'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  emoji: string;
  rotation: number;
  rotationSpeed: number;
}

interface FloatingHeartsProps {
  trigger: boolean;
  onComplete?: () => void;
}

const EMOJIS = ['💖', '💕', '⭐', '✨', '💫', '🌸', '💗', '🌟'];

export default function FloatingHearts({ trigger, onComplete }: FloatingHeartsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animIdRef = useRef<number>(0);
  const activeRef = useRef(false);

  useEffect(() => {
    if (!trigger) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Spawn burst of particles from a random position in the upper area
    const originX = Math.random() * canvas.width * 0.6 + canvas.width * 0.2;
    const originY = Math.random() * canvas.height * 0.3 + canvas.height * 0.1;

    particlesRef.current = Array.from({ length: 28 }, () => ({
      x: originX + (Math.random() - 0.5) * 40,
      y: originY + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 5,
      vy: -(Math.random() * 4 + 2),
      alpha: 1,
      size: Math.random() * 18 + 14,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
    }));

    activeRef.current = true;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gentle gravity
        p.alpha -= 0.012;
        p.rotation += p.rotationSpeed;

        if (p.alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.emoji, 0, 0);
        ctx.restore();
      });

      const alive = particlesRef.current.some((p) => p.alpha > 0);
      if (alive) {
        animIdRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        activeRef.current = false;
        onComplete?.();
      }
    };

    cancelAnimationFrame(animIdRef.current);
    animate();

    return () => {
      cancelAnimationFrame(animIdRef.current);
    };
  }, [trigger, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[60]"
      style={{ opacity: trigger ? 1 : 0 }}
    />
  );
}
