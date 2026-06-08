'use client';

import React, { useEffect, useRef } from 'react';

type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

interface Star {
  x: number;
  y: number;
  size: number;
  twinkleSpeed: number;
  alpha: number;
  direction: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  alpha: number;
  active: boolean;
}

interface PhaseParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  life: number;
  maxLife: number;
  wobble: number;
  wobbleSpeed: number;
}

interface PhaseConfig {
  bgColors: [string, string, string];
  particleColor: string;
  particleGlow: string;
  particleCount: number;
  spawnRate: number; // fraction per frame
  direction: 'down' | 'up' | 'sparkle';
  speedY: number;
  sizeRange: [number, number];
  shape: 'circle' | 'teardrop' | 'diamond';
}

const PHASE_CONFIGS: Record<CyclePhase, PhaseConfig> = {
  menstrual: {
    bgColors: ['#0a0110', '#140318', '#1e0510'],
    particleColor: 'rgba(220, 38, 38, ',
    particleGlow: '#dc2626',
    particleCount: 30,
    spawnRate: 0.04,
    direction: 'down',
    speedY: 1.2,
    sizeRange: [2, 5],
    shape: 'teardrop',
  },
  follicular: {
    bgColors: ['#020c0a', '#041510', '#071e0f'],
    particleColor: 'rgba(52, 211, 153, ',
    particleGlow: '#34d399',
    particleCount: 35,
    spawnRate: 0.05,
    direction: 'up',
    speedY: 0.9,
    sizeRange: [1.5, 4],
    shape: 'circle',
  },
  ovulation: {
    bgColors: ['#0c0900', '#180e00', '#221500'],
    particleColor: 'rgba(251, 191, 36, ',
    particleGlow: '#fbbf24',
    particleCount: 55,
    spawnRate: 0.08,
    direction: 'sparkle',
    speedY: 1.5,
    sizeRange: [1, 3.5],
    shape: 'diamond',
  },
  luteal: {
    bgColors: ['#0a0415', '#12061e', '#170828'],
    particleColor: 'rgba(167, 139, 250, ',
    particleGlow: '#a78bfa',
    particleCount: 28,
    spawnRate: 0.035,
    direction: 'up',
    speedY: 0.6,
    sizeRange: [2, 6],
    shape: 'circle',
  },
};

interface StarryBackgroundProps {
  phase?: CyclePhase;
}

export default function StarryBackground({ phase }: StarryBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<CyclePhase | undefined>(phase);

  // Keep the ref in sync so the animation loop always has the latest phase
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let stars: Star[] = [];
    let shootingStars: ShootingStar[] = [];
    let phaseParticles: PhaseParticle[] = [];
    const maxStars = 150;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    const initStars = () => {
      stars = [];
      for (let i = 0; i < maxStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.8 + 0.2,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          alpha: Math.random(),
          direction: Math.random() > 0.5 ? 1 : -1,
        });
      }
    };

    const spawnShootingStar = () => {
      if (shootingStars.length >= 2) return;
      shootingStars.push({
        x: Math.random() * canvas.width * 0.8,
        y: Math.random() * canvas.height * 0.4,
        length: Math.random() * 80 + 40,
        speed: Math.random() * 6 + 4,
        angle: Math.PI / 6 + Math.random() * (Math.PI / 12),
        alpha: 1.0,
        active: true,
      });
    };

    const spawnPhaseParticle = (cfg: PhaseConfig) => {
      if (phaseParticles.length >= cfg.particleCount) return;

      const sizeRange = cfg.sizeRange;
      const size = Math.random() * (sizeRange[1] - sizeRange[0]) + sizeRange[0];
      const maxLife = 80 + Math.random() * 80;

      let x: number, y: number, vx: number, vy: number;

      if (cfg.direction === 'down') {
        // Rain from top
        x = Math.random() * canvas.width;
        y = -10;
        vx = (Math.random() - 0.5) * 0.5;
        vy = cfg.speedY + Math.random() * 0.8;
      } else if (cfg.direction === 'up') {
        // Rise from bottom
        x = Math.random() * canvas.width;
        y = canvas.height + 10;
        vx = (Math.random() - 0.5) * 0.7;
        vy = -(cfg.speedY + Math.random() * 0.6);
      } else {
        // Sparkle — random position, drifts slowly
        x = Math.random() * canvas.width;
        y = Math.random() * canvas.height;
        vx = (Math.random() - 0.5) * 1.5;
        vy = -(0.3 + Math.random() * 0.8);
      }

      phaseParticles.push({
        x,
        y,
        vx,
        vy,
        alpha: 0,
        size,
        life: 0,
        maxLife,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: (Math.random() - 0.5) * 0.08,
      });
    };

    const drawTeardrop = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
      ctx.beginPath();
      ctx.moveTo(x, y - size * 1.5);
      ctx.bezierCurveTo(x + size, y - size * 0.5, x + size, y + size * 0.5, x, y + size);
      ctx.bezierCurveTo(x - size, y + size * 0.5, x - size, y - size * 0.5, x, y - size * 1.5);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    const drawDiamond = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
      ctx.beginPath();
      ctx.moveTo(x, y - size * 1.5);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x, y + size * 1.5);
      ctx.lineTo(x - size, y);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const spawnInterval = setInterval(() => {
      if (Math.random() < 0.45) spawnShootingStar();
    }, 4000);

    const animate = () => {
      const currentPhase = phaseRef.current;
      const cfg = currentPhase ? PHASE_CONFIGS[currentPhase] : null;

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      if (cfg) {
        grad.addColorStop(0, cfg.bgColors[0]);
        grad.addColorStop(0.5, cfg.bgColors[1]);
        grad.addColorStop(1, cfg.bgColors[2]);
      } else {
        grad.addColorStop(0, '#05020c');
        grad.addColorStop(0.5, '#0c041a');
        grad.addColorStop(1, '#15062a');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      stars.forEach((star) => {
        star.alpha += star.twinkleSpeed * star.direction;
        if (star.alpha >= 1) { star.alpha = 1; star.direction = -1; }
        else if (star.alpha <= 0.1) { star.alpha = 0.1; star.direction = 1; }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(216, 180, 254, ${star.alpha})`;
        ctx.shadowBlur = star.size * 2;
        ctx.shadowColor = '#d8b4fe';
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Draw shooting stars
      shootingStars.forEach((sStar) => {
        if (!sStar.active) return;
        const dx = Math.cos(sStar.angle) * sStar.length;
        const dy = Math.sin(sStar.angle) * sStar.length;
        const g = ctx.createLinearGradient(sStar.x, sStar.y, sStar.x - dx, sStar.y - dy);
        g.addColorStop(0, `rgba(251, 207, 232, ${sStar.alpha})`);
        g.addColorStop(0.4, `rgba(192, 132, 252, ${sStar.alpha * 0.6})`);
        g.addColorStop(1, `rgba(124, 58, 237, 0)`);
        ctx.beginPath();
        ctx.strokeStyle = g;
        ctx.lineWidth = 2;
        ctx.moveTo(sStar.x, sStar.y);
        ctx.lineTo(sStar.x - dx, sStar.y - dy);
        ctx.stroke();
        sStar.x += Math.cos(sStar.angle) * sStar.speed;
        sStar.y += Math.sin(sStar.angle) * sStar.speed;
        sStar.alpha -= 0.015;
        if (sStar.alpha <= 0 || sStar.x > canvas.width || sStar.y > canvas.height) {
          sStar.active = false;
        }
      });
      shootingStars = shootingStars.filter((s) => s.active);

      // Phase particles
      if (cfg) {
        // Maybe spawn a new one
        if (Math.random() < cfg.spawnRate) {
          spawnPhaseParticle(cfg);
        }

        phaseParticles.forEach((p) => {
          p.life++;
          p.wobble += p.wobbleSpeed;
          p.x += p.vx + Math.sin(p.wobble) * 0.4;
          p.y += p.vy;

          // Fade in / fade out
          const halfLife = p.maxLife / 2;
          if (p.life < halfLife) {
            p.alpha = p.life / halfLife;
          } else {
            p.alpha = 1 - (p.life - halfLife) / halfLife;
          }
          p.alpha = Math.max(0, Math.min(1, p.alpha)) * 0.75;

          if (p.alpha <= 0 || p.life >= p.maxLife) return;

          const colorStr = cfg.particleColor + p.alpha + ')';

          ctx.shadowBlur = p.size * 3;
          ctx.shadowColor = cfg.particleGlow;

          if (cfg.shape === 'teardrop') {
            ctx.save();
            ctx.translate(p.x, p.y);
            drawTeardrop(ctx, 0, 0, p.size, colorStr);
            ctx.restore();
          } else if (cfg.shape === 'diamond') {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.wobble * 0.5);
            drawDiamond(ctx, 0, 0, p.size, colorStr);
            ctx.restore();
          } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = colorStr;
            ctx.fill();
          }

          ctx.shadowBlur = 0;
        });

        // Trim dead particles
        phaseParticles = phaseParticles.filter((p) => p.life < p.maxLife && p.alpha > 0);
      } else {
        phaseParticles = [];
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      clearInterval(spawnInterval);
      cancelAnimationFrame(animationId);
    };
  }, []); // only run once; phase changes are handled via phaseRef

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10 pointer-events-none" />;
}
