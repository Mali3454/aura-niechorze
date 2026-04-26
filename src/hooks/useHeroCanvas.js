import { useEffect, useRef } from 'react';

const WAVE_LAYERS = [
  { ampScale: 0.06, freq: 4.5, speed: 0.55, yOffset:  0.12, color: 'rgba(8,28,52,0.55)' },
  { ampScale: 0.07, freq: 3.8, speed: 0.70, yOffset:  0.05, color: 'rgba(10,40,70,0.60)' },
  { ampScale: 0.08, freq: 3.2, speed: 0.85, yOffset:  0,    color: 'rgba(12,55,88,0.65)' },
  { ampScale: 0.09, freq: 2.6, speed: 1.00, yOffset: -0.05, color: 'rgba(14,68,105,0.55)' },
  { ampScale: 0.07, freq: 2.2, speed: 1.20, yOffset: -0.10, color: 'rgba(16,80,118,0.45)' },
  { ampScale: 0.06, freq: 1.9, speed: 1.40, yOffset: -0.15, color: 'rgba(20,95,130,0.40)' },
  { ampScale: 0.05, freq: 1.6, speed: 1.65, yOffset: -0.20, color: 'rgba(30,115,150,0.30)' },
  { ampScale: 0.04, freq: 1.4, speed: 1.90, yOffset: -0.24, color: 'rgba(55,150,175,0.20)' },
  { ampScale: 0.03, freq: 1.2, speed: 2.20, yOffset: -0.27, color: 'rgba(100,190,210,0.12)' },
];

const PARTICLE_COUNT = 80;

export function useHeroCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const mouse = { x: 0.5, y: 0.5 };

    function resize() {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.offsetWidth;
      const h = parent.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
    }

    const onMouseMove = (e) => {
      mouse.x = e.clientX / window.innerWidth;
      mouse.y = e.clientY / window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('mousemove', onMouseMove);

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random(),
      r: 0.8 + Math.random() * 2.5,
      speed: 0.0002 + Math.random() * 0.0004,
      phase: Math.random() * Math.PI * 2,
    }));

    let t = 0;
    let animId;

    function drawWave(W, H, amp, freq, speed, yBase, color) {
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 3) {
        const nx = x / W;
        const y = yBase
          + Math.sin(nx * freq + t * speed) * amp
          + Math.sin(nx * freq * 1.6 + t * speed * 0.7 + 1.2) * amp * 0.55
          + Math.cos(nx * freq * 0.8 - t * speed * 1.1 + mouse.x * 2) * amp * 0.35;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    function draw() {
      animId = requestAnimationFrame(draw);
      t += 0.012;

      const W = canvas.width / dpr;
      const H = canvas.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const yc = H * (0.62 + mouse.y * 0.06);

      for (const layer of WAVE_LAYERS) {
        drawWave(W, H, H * layer.ampScale, layer.freq, layer.speed, yc + H * layer.yOffset, layer.color);
      }

      for (const p of particles) {
        p.x += p.speed;
        if (p.x > 1) p.x -= 1;
        const wy = yc - H * 0.22
          + Math.sin(p.x * 3.8 + t * 1.4) * H * 0.05
          + Math.sin(p.x * 2.2 + t * 0.9 + p.phase) * H * 0.03;
        const alpha = 0.25 + Math.sin(t * 2 + p.phase) * 0.12;
        ctx.beginPath();
        ctx.arc(p.x * W, wy, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,230,240,${alpha})`;
        ctx.fill();
      }

      const shimY = yc - H * 0.28;
      const grad = ctx.createLinearGradient(0, shimY - 2, 0, shimY + 3);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.5, `rgba(140,210,230,${0.15 + Math.sin(t * 0.8) * 0.05})`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, shimY - 2, W, 5);
    }

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return canvasRef;
}
