"use client";

import { hash, rgba, useCanvasScene, type DrawScene } from "./useCanvasScene";

const STARS = Array.from({ length: 140 }, (_, i) => [hash(i * 3 + 1), hash(i * 7 + 2) * 0.75, hash(i * 11 + 3), hash(i * 13 + 4) * 6.283]);

/** Twinkling stars plus one shooting star every 3 seconds, each from a new place. */
const drawSky: DrawScene = (ctx, w, h, t, c) => {
  for (const [x, y, size, phase] of STARS) {
    const alpha = (0.15 + 0.6 * size) * (0.6 + 0.4 * Math.sin(t * 0.0012 + phase));
    ctx.fillStyle = rgba(c.ink, alpha * (c.dark ? 1 : 0.35));
    const s = size > 0.92 ? 2 : 1.1;
    ctx.fillRect(x * w, y * h, s, s);
  }
  if (!t) return;

  const cycle = Math.floor(t / 3000);
  const progress = (t % 3000) / 1100;
  if (progress > 1) return;
  const rnd = (n: number) => hash((cycle + 1) * 91.7 + n * 47.3);
  const length = Math.min(w, 1200) * (0.38 + 0.2 * rnd(1));
  const angle = ((14 + 12 * rnd(2)) * Math.PI) / 180;
  const dir = rnd(3) < 0.5 ? 1 : -1;
  const sx = dir > 0 ? w * (0.08 + 0.45 * rnd(4)) : w * (0.47 + 0.45 * rnd(4));
  const sy = h * (0.04 + 0.14 * rnd(5));
  const eased = 1 - Math.pow(1 - progress, 2);
  const hx = sx + dir * Math.cos(angle) * length * eased;
  const hy = sy + Math.sin(angle) * length * eased;
  const tail = (220 + 120 * rnd(6)) * Math.min(1, progress * 3);
  const tx = hx - dir * Math.cos(angle) * tail;
  const ty = hy - Math.sin(angle) * tail;
  const fade = progress < 0.75 ? 1 : 1 - (progress - 0.75) / 0.25;
  const color = c.dark ? c.ink : c.accent2;

  const gradient = ctx.createLinearGradient(tx, ty, hx, hy);
  gradient.addColorStop(0, rgba(color, 0));
  gradient.addColorStop(1, rgba(color, 0.95 * fade));
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.shadowColor = rgba(color, 0.9);
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.lineTo(hx, hy);
  ctx.stroke();
  ctx.shadowBlur = 0;
  const glow = ctx.createRadialGradient(hx, hy, 0, hx, hy, 12);
  glow.addColorStop(0, rgba(color, fade));
  glow.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(hx, hy, 12, 0, 6.283);
  ctx.fill();
};

export function StarSky() {
  const ref = useCanvasScene(drawSky);
  return <canvas ref={ref} className="live-canvas" aria-hidden="true" />;
}
