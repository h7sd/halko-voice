import { useEffect, useRef } from 'react';

export default function AuroraBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const blobs = [
      { x: w => w * 0.15, y: h => h * 0.3, r: 340, color: [0, 80, 255], speed: 0.00008 },
      { x: w => w * 0.7,  y: h => h * 0.6, r: 280, color: [0, 122, 255], speed: 0.00011 },
      { x: w => w * 0.5,  y: h => h * 0.1, r: 200, color: [0, 60, 255], speed: 0.00009 },
    ];

    const draw = (now) => {
      if (!canvas) return;
      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);

      blobs.forEach((b, i) => {
        const t = now * b.speed;
        const ox = Math.sin(t + i * 2.1) * 55;
        const oy = Math.cos(t * 0.8 + i * 1.4) * 38;
        const bx = b.x(w) + ox;
        const by = b.y(h) + oy;
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, b.r);
        const [r, g2, bl] = b.color;
        g.addColorStop(0, `rgba(${r},${g2},${bl},0.15)`);
        g.addColorStop(1, `rgba(${r},${g2},${bl},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(bx, by, b.r, 0, Math.PI * 2);
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 0,
        pointerEvents: 'none',
        background: 'linear-gradient(135deg, #000814 0%, #00122e 50%, #000814 100%)',
      }}
    />
  );
}
