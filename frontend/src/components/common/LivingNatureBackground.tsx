import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  swaySpeed: number;
  swayOffset: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  speed: number;
}

export const LivingNatureBackground: React.FC = () => {
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

    // Drifting pollen/spores pool
    const particleCount = 45;
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.2 + 0.8,
        speedY: -(Math.random() * 0.45 + 0.2),
        speedX: (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.5 + 0.2,
        swaySpeed: Math.random() * 0.02 + 0.01,
        swayOffset: Math.random() * Math.PI * 2,
      });
    }

    // Rain droplet ripples pool
    const ripples: Ripple[] = [];
    const addRipple = (x: number, y: number) => {
      ripples.push({
        x,
        y,
        radius: 2,
        maxRadius: Math.random() * 70 + 40,
        alpha: 0.35,
        speed: Math.random() * 0.7 + 0.5,
      });
      if (ripples.length > 25) ripples.shift();
    };

    // Periodic organic droplet drops
    let lastDropTime = 0;
    const dropInterval = 2200;

    // Mouse movement spawns gentle ripples & pushes particles
    let lastMouseMove = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastMouseMove > 200) {
        addRipple(e.clientX, e.clientY);
        lastMouseMove = now;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    let time = 0;

    const render = (timestamp: number) => {
      time += 0.015;

      // Random environmental raindrop
      if (timestamp - lastDropTime > dropInterval) {
        addRipple(Math.random() * width, Math.random() * height * 0.9 + height * 0.05);
        lastDropTime = timestamp;
      }

      ctx.clearRect(0, 0, width, height);

      // Deep Moss / Lichen Ambient Radial Gradients
      const ambientGrad = ctx.createRadialGradient(
        width * 0.3,
        height * 0.85,
        50,
        width * 0.3,
        height * 0.85,
        width * 0.6
      );
      ambientGrad.addColorStop(0, 'rgba(232, 238, 222, 0.045)');
      ambientGrad.addColorStop(0.5, 'rgba(74, 222, 128, 0.02)');
      ambientGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = ambientGrad;
      ctx.fillRect(0, 0, width, height);

      // Floor light pool (from authored Sylva hero)
      const floorGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 1.05,
        10,
        width * 0.5,
        height * 1.05,
        width * 0.7
      );
      floorGrad.addColorStop(0, 'rgba(238, 243, 231, 0.08)');
      floorGrad.addColorStop(0.4, 'rgba(238, 243, 231, 0.03)');
      floorGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, 0, width, height);

      // Render expanding rain ripples on moss water
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += r.speed;
        r.alpha -= 0.0035;

        if (r.alpha <= 0 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(180, 220, 190, ${r.alpha})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Subtle inner echo ring
        if (r.radius > 12) {
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius * 0.65, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(134, 239, 172, ${r.alpha * 0.5})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Render drifting pollen/spores
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y += p.speedY;
        p.x += Math.sin(time * p.swaySpeed + p.swayOffset) * 0.6 + p.speedX;

        // Reset particle when it floats past top
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        // Soft golden-green lichen glow
        ctx.fillStyle = `rgba(220, 240, 205, ${p.opacity})`;
        ctx.shadowColor = 'rgba(134, 239, 172, 0.4)';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
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
