import React, { useEffect, useRef } from 'react';

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  speed: number;
}

export const WaterBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Active ripples pool
    const ripples: Ripple[] = [];

    const addRipple = (x: number, y: number) => {
      ripples.push({
        x,
        y,
        radius: 2,
        maxRadius: Math.random() * 80 + 50,
        alpha: 0.35,
        speed: Math.random() * 0.8 + 0.6,
      });
      if (ripples.length > 20) ripples.shift();
    };

    // Periodic gentle rain droplet drops
    let lastDropTime = 0;
    const dropInterval = 1800; // ms

    // Mouse interaction for subtle ripples
    let lastMouseMove = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastMouseMove > 250) {
        addRipple(e.clientX, e.clientY);
        lastMouseMove = now;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    let time = 0;

    const render = (timestamp: number) => {
      time += 0.008;

      // Spawn periodic ambient drops
      if (timestamp - lastDropTime > dropInterval) {
        addRipple(Math.random() * width, Math.random() * height);
        lastDropTime = timestamp;
      }

      ctx.clearRect(0, 0, width, height);

      // Deep water gradient base
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.3,
        50,
        width * 0.5,
        height * 0.6,
        Math.max(width, height)
      );
      bgGrad.addColorStop(0, '#0a1926');
      bgGrad.addColorStop(0.5, '#07121e');
      bgGrad.addColorStop(1, '#040b12');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Harmonic fluid wave layer 1 (Deep current)
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 15) {
        const y =
          height * 0.72 +
          Math.sin(x * 0.003 + time * 1.2) * 35 +
          Math.cos(x * 0.002 + time * 0.8) * 20;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      const waveGrad1 = ctx.createLinearGradient(0, height * 0.6, 0, height);
      waveGrad1.addColorStop(0, 'rgba(14, 165, 233, 0.04)');
      waveGrad1.addColorStop(1, 'rgba(6, 182, 212, 0.01)');
      ctx.fillStyle = waveGrad1;
      ctx.fill();

      // Harmonic fluid wave layer 2 (Surface flow)
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 15) {
        const y =
          height * 0.82 +
          Math.sin(x * 0.004 - time * 1.5) * 25 +
          Math.cos(x * 0.003 + time * 1.1) * 18;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      const waveGrad2 = ctx.createLinearGradient(0, height * 0.7, 0, height);
      waveGrad2.addColorStop(0, 'rgba(20, 184, 166, 0.05)');
      waveGrad2.addColorStop(1, 'rgba(14, 165, 233, 0.01)');
      ctx.fillStyle = waveGrad2;
      ctx.fill();

      // Draw and update gentle concentric ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed;
        r.alpha *= 0.982;

        if (r.alpha <= 0.01 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${r.alpha})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Inner echo ring
        if (r.radius > 15) {
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius * 0.65, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(20, 184, 166, ${r.alpha * 0.5})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
};
