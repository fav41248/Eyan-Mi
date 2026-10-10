import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  type: 'heart' | 'petal' | 'sparkle' | 'goldStar';
  color: string;
}

interface ConfettiHeartsCanvasProps {
  burstTrigger?: number;
  interactive?: boolean;
}

export const ConfettiHeartsCanvas: React.FC<ConfettiHeartsCanvasProps> = ({
  burstTrigger = 0,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Colors: Ivory, blush pink, dusty rose, champagne gold, soft burgundy
  const colors = [
    '#F8D2D2', // Blush
    '#C07D85', // Dusty rose
    '#D4AF37', // Champagne gold
    '#FAF7F2', // Warm ivory
    '#E8A598', // Soft peach
    '#802035', // Soft burgundy
  ];

  const spawnBurst = (x: number, y: number, count = 35) => {
    const types: Particle['type'][] = ['heart', 'petal', 'sparkle', 'goldStar'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      particlesRef.current.push({
        x,
        y,
        size: 10 + Math.random() * 14,
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed - 1.5,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        opacity: 0.95,
        type: types[Math.floor(Math.random() * types.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  };

  useEffect(() => {
    if (burstTrigger > 0 && canvasRef.current) {
      const { width, height } = canvasRef.current;
      spawnBurst(width * 0.5, height * 0.4, 50);
      spawnBurst(width * 0.25, height * 0.5, 30);
      spawnBurst(width * 0.75, height * 0.5, 30);
    }
  }, [burstTrigger]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initial ambient floating particles
    const initialCount = prefersReducedMotion ? 12 : 28;
    particlesRef.current = [];
    const types: Particle['type'][] = ['heart', 'petal', 'sparkle'];
    for (let i = 0; i < initialCount; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 8 + Math.random() * 10,
        speedX: (Math.random() - 0.5) * 0.6,
        speedY: -0.4 - Math.random() * 0.8,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.04,
        opacity: 0.3 + Math.random() * 0.5,
        type: types[Math.floor(Math.random() * types.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const drawHeart = (c: CanvasRenderingContext2D, size: number) => {
      c.beginPath();
      const topCurveHeight = size * 0.3;
      c.moveTo(0, topCurveHeight);
      // top left curve
      c.bezierCurveTo(
        -size / 2, -topCurveHeight,
        -size, size / 3,
        0, size
      );
      // top right curve
      c.bezierCurveTo(
        size, size / 3,
        size / 2, -topCurveHeight,
        0, topCurveHeight
      );
      c.closePath();
      c.fill();
    };

    const drawSparkle = (c: CanvasRenderingContext2D, size: number) => {
      c.beginPath();
      for (let i = 0; i < 4; i++) {
        c.lineTo(Math.cos((i * Math.PI) / 2) * size, Math.sin((i * Math.PI) / 2) * size);
        c.lineTo(
          Math.cos((i * Math.PI) / 2 + Math.PI / 4) * (size * 0.25),
          Math.sin((i * Math.PI) / 2 + Math.PI / 4) * (size * 0.25)
        );
      }
      c.closePath();
      c.fill();
    };

    const drawPetal = (c: CanvasRenderingContext2D, size: number) => {
      c.beginPath();
      c.ellipse(0, 0, size * 0.45, size * 0.8, 0, 0, Math.PI * 2);
      c.fill();
    };

    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];

        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        // Apply slight drag and gravity for burst particles
        if (Math.abs(p.speedX) > 1 || Math.abs(p.speedY) > 1) {
          p.speedX *= 0.98;
          p.speedY += 0.08; // gravity
          p.opacity -= dt * 0.25;
        }

        // Loop ambient floating particles
        if (p.y < -30 && p.opacity > 0.1) {
          p.y = canvas.height + 20;
          p.x = Math.random() * canvas.width;
        }

        if (p.opacity <= 0.02) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity));
        ctx.fillStyle = p.color;

        if (p.type === 'heart') {
          drawHeart(ctx, p.size);
        } else if (p.type === 'sparkle' || p.type === 'goldStar') {
          drawSparkle(ctx, p.size);
        } else {
          drawPetal(ctx, p.size);
        }

        ctx.restore();
      }

      // Keep minimum ambient floaters
      while (particlesRef.current.length < (prefersReducedMotion ? 10 : 25)) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: canvas.height + 15,
          size: 8 + Math.random() * 8,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: -0.4 - Math.random() * 0.6,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.03,
          opacity: 0.35 + Math.random() * 0.45,
          type: types[Math.floor(Math.random() * types.length)],
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (!interactive) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      spawnBurst(clientX, clientY, 15);
    };

    window.addEventListener('click', handlePointerDown);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('click', handlePointerDown);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [interactive]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-20 overflow-hidden"
      aria-hidden="true"
    />
  );
};
