'use client';

import React, { useEffect, useRef } from 'react';

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

export default function StarryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let stars: Star[] = [];
    let shootingStars: ShootingStar[] = [];
    const maxStars = 150;

    // Resize canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    // Initialize stars
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

    // Add shooting star
    const spawnShootingStar = () => {
      if (shootingStars.length >= 2) return;
      
      shootingStars.push({
        x: Math.random() * canvas.width * 0.8,
        y: Math.random() * canvas.height * 0.4,
        length: Math.random() * 80 + 40,
        speed: Math.random() * 6 + 4,
        angle: Math.PI / 6 + Math.random() * (Math.PI / 12), // roughly 30-45 degrees down
        alpha: 1.0,
        active: true,
      });
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Shooting star trigger interval
    const spawnInterval = setInterval(() => {
      if (Math.random() < 0.45) {
        spawnShootingStar();
      }
    }, 4000);

    // Render loop
    const animate = () => {
      // Background gradient (deep space violet/black)
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#05020c');
      grad.addColorStop(0.5, '#0c041a');
      grad.addColorStop(1, '#15062a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw and update stars
      stars.forEach((star) => {
        // Twinkle update
        star.alpha += star.twinkleSpeed * star.direction;
        if (star.alpha >= 1) {
          star.alpha = 1;
          star.direction = -1;
        } else if (star.alpha <= 0.1) {
          star.alpha = 0.1;
          star.direction = 1;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(216, 180, 254, ${star.alpha})`;
        ctx.shadowBlur = star.size * 2;
        ctx.shadowColor = '#d8b4fe';
        ctx.fill();
      });
      ctx.shadowBlur = 0; // reset glow

      // Draw and update shooting stars
      shootingStars.forEach((sStar, idx) => {
        if (!sStar.active) return;

        // Draw line with tail
        const dx = Math.cos(sStar.angle) * sStar.length;
        const dy = Math.sin(sStar.angle) * sStar.length;

        const grad = ctx.createLinearGradient(sStar.x, sStar.y, sStar.x - dx, sStar.y - dy);
        grad.addColorStop(0, `rgba(251, 207, 232, ${sStar.alpha})`);
        grad.addColorStop(0.4, `rgba(192, 132, 252, ${sStar.alpha * 0.6})`);
        grad.addColorStop(1, `rgba(124, 58, 237, 0)`);

        ctx.beginPath();
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.moveTo(sStar.x, sStar.y);
        ctx.lineTo(sStar.x - dx, sStar.y - dy);
        ctx.stroke();

        // Update positions
        sStar.x += Math.cos(sStar.angle) * sStar.speed;
        sStar.y += Math.sin(sStar.angle) * sStar.speed;
        sStar.alpha -= 0.015;

        if (sStar.alpha <= 0 || sStar.x > canvas.width || sStar.y > canvas.height) {
          sStar.active = false;
        }
      });

      // Filter inactive shooting stars
      shootingStars = shootingStars.filter((sStar) => sStar.active);

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      clearInterval(spawnInterval);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10 pointer-events-none" />;
}
