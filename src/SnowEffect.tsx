import React, { useEffect, useRef } from 'react';

interface Snowflake {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  opacity: number;
  swaySpeed: number;
  swayOffset: number;
}

export const SnowEffect: React.FC<{ count?: number; isDarkMode?: boolean }> = ({
  count = 65,
  isDarkMode = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Initialize snowflakes
    const flakes: Snowflake[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.5 + 1.2,
      speedY: Math.random() * 1.2 + 0.6,
      speedX: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.6 + 0.35,
      swaySpeed: Math.random() * 0.02 + 0.008,
      swayOffset: Math.random() * Math.PI * 2,
    }));

    let step = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      step++;

      for (let i = 0; i < flakes.length; i++) {
        const flake = flakes[i];

        // Update position with natural sine wave drifting
        flake.y += flake.speedY;
        flake.x += Math.sin(step * flake.swaySpeed + flake.swayOffset) * 0.7 + flake.speedX;

        // Wrap around bottom
        if (flake.y > height + 5) {
          flake.y = -5;
          flake.x = Math.random() * width;
        }

        // Wrap horizontally
        if (flake.x > width + 5) {
          flake.x = -5;
        } else if (flake.x < -5) {
          flake.x = width + 5;
        }

        // Draw snowflake with soft subtle glow
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);

        if (isDarkMode) {
          ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
          ctx.shadowBlur = flake.radius > 2.2 ? 5 : 2;
          ctx.shadowColor = 'rgba(212, 175, 55, 0.4)'; // subtle warm festive sparkle
        } else {
          ctx.fillStyle = `rgba(160, 190, 230, ${flake.opacity * 0.85})`;
          ctx.shadowBlur = 3;
          ctx.shadowColor = 'rgba(100, 160, 240, 0.3)';
        }

        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [count, isDarkMode]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[45] select-none"
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    />
  );
};
export default SnowEffect;
