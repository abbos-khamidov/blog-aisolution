"use client";

import { useMemo } from "react";
import { pointerTilt } from "./pointer";
import { hash, rgba, useCanvasScene, type DrawScene, type Rgb, type SceneColors } from "./useCanvasScene";

const MONO = "11px 'JetBrains Mono', ui-monospace, monospace";

function verdictColor(c: SceneColors, rating: number): Rgb {
  return rating >= 7.5 ? c.up : rating >= 5.5 ? c.average : c.down;
}

/* ---------- Statement: noise on the left settles into one clean signal ---------- */

export function SignalScene({ signalLabel, noiseLabel, total }: { signalLabel: string; noiseLabel: string; total: number }) {
  const draw = useMemo<DrawScene>(
    () => (ctx, w, h, t, c) => {
      if (w < 900) return;
      const x0 = Math.max(w * 0.56, (w - 1240) / 2 + 760);
      const mid = h * 0.45;
      const band = Math.min(130, h * 0.28);
      const clean = (x: number) => {
        const u = Math.min(1, Math.max(0, (x - (x0 + (w - x0) * 0.3)) / ((w - x0) * 0.42)));
        return u * u * (3 - 2 * u);
      };
      for (let i = 0; x0 + i * 14 < w; i++) {
        const x = x0 + i * 14 + 7;
        const cl = clean(x);
        const fin = Math.min(1, (x - x0) / 160);
        if (cl > 0.97) continue;
        for (let y = mid - band; y < mid + band; y += 14) {
          const r = hash(i * 131 + Math.round(y / 14) * 977);
          if (r > 0.55) continue;
          const twinkle = 0.5 + 0.5 * Math.sin(t * 0.0021 + r * 40);
          const edge = 1 - Math.abs(y - mid) / band;
          ctx.fillStyle = rgba(c.ink, (0.05 + 0.32 * twinkle) * (1 - cl) * edge * fin);
          ctx.fillRect(x - 1, y - 1, 2, 2);
        }
      }
      const gradient = ctx.createLinearGradient(x0, 0, w, 0);
      gradient.addColorStop(0, rgba(c.ink, 0));
      gradient.addColorStop(0.35, rgba(c.ink, 0.25));
      gradient.addColorStop(0.7, rgba(c.accent, 0.9));
      gradient.addColorStop(1, rgba(c.accent, 1));
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      const tick = Math.floor(t / 110);
      for (let x = x0; x <= w; x += 4) {
        const c2 = clean(x);
        const noise = (hash(Math.floor(x / 4) * 7 + tick * 977) - 0.5) * 70;
        const y = mid + c2 * 26 * Math.sin(x * 0.011 - t * 0.0016) + (1 - c2) * noise;
        if (x === x0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      const px = w * 0.9;
      const py = mid + 26 * Math.sin(px * 0.011 - t * 0.0016);
      const pulse = (Math.sin(t / 500) + 1) / 2;
      ctx.fillStyle = rgba(c.accent, 0.15 + pulse * 0.15);
      ctx.beginPath();
      ctx.arc(px, py, 8 + pulse * 9, 0, 6.283);
      ctx.fill();
      ctx.fillStyle = rgba(c.accent, 1);
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, 6.283);
      ctx.fill();
      ctx.font = MONO;
      ctx.fillStyle = rgba(c.accent, 0.95);
      ctx.fillText(`${signalLabel} · 1 / ${total}`, Math.min(px + 14, w - 130), mid - 44);
      ctx.fillStyle = rgba(c.ink, 0.4);
      ctx.fillText(noiseLabel, x0 + 40, mid - band - 10);
    },
    [signalLabel, noiseLabel, total]
  );
  const ref = useCanvasScene(draw);
  return <canvas ref={ref} className="live-canvas" aria-hidden="true" />;
}

/* ---------- Core: dotted sphere, comet ring, tracking frames on rated startups ---------- */

export type TrackedStartup = { label: string; rating: number };

const GOLDEN = Math.PI * (3 - Math.sqrt(5));
function fibonacciSphere(count: number): [number, number, number][] {
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - (2 * (i + 0.5)) / count;
    const r = Math.sqrt(1 - y * y);
    return [Math.cos(GOLDEN * i) * r, y, Math.sin(GOLDEN * i) * r];
  });
}
const CORE_POINTS = fibonacciSphere(1100);
const MINI_POINTS = fibonacciSphere(26);

export function CoreScene({ startups }: { startups: TrackedStartup[] }) {
  const draw = useMemo<DrawScene>(
    () => (ctx, w, h, t, c) => {
      const small = w < 760;
      const cx = small ? w * 0.5 : w * 0.66;
      const cy = small ? h * 0.66 : h * 0.5;
      const R = Math.min(h * (small ? 0.15 : 0.24), w * (small ? 0.22 : 0.15));
      const tilt = pointerTilt();
      const ry = t * 0.00016 + tilt.x * 0.5;
      const rx = -0.3 + tilt.y * 0.25;
      const cyr = Math.cos(ry), syr = Math.sin(ry), cxr = Math.cos(rx), sxr = Math.sin(rx);
      const project = (v: [number, number, number]) => {
        const x1 = v[0] * cyr + v[2] * syr;
        const z1 = -v[0] * syr + v[2] * cyr;
        const y1 = v[1] * cxr - z1 * sxr;
        const z2 = v[1] * sxr + z1 * cxr;
        const k = 1 / (1 - z2 * 0.16);
        return [cx + x1 * R * k, cy - y1 * R * k, z2, k] as const;
      };

      const halo = ctx.createRadialGradient(cx, cy, R * 0.3, cx, cy, R * 2.4);
      halo.addColorStop(0, rgba(c.accent2, 0.22));
      halo.addColorStop(0.5, rgba(c.accent2, 0.07));
      halo.addColorStop(1, rgba(c.accent2, 0));
      ctx.fillStyle = halo;
      ctx.fillRect(cx - R * 2.4, cy - R * 2.4, R * 4.8, R * 4.8);

      const ta = 1.32, tz = 0.28;
      const cta = Math.cos(ta), sta = Math.sin(ta), ctz = Math.cos(tz), stz = Math.sin(tz);
      const head = t * 0.00055;
      const ring: [number, number, number, number][] = [];
      for (let q = 0; q < 1500; q++) {
        const a = hash(q * 13 + 7) * 6.283 + t * 0.00022 * (0.8 + 0.4 * hash(q));
        const rad = 1.62 + (hash(q * 5 + 3) - 0.5) * 0.5;
        const off = (hash(q * 17 + 9) - 0.5) * 0.3;
        const lx = Math.cos(a) * rad, ly = Math.sin(a) * rad;
        const y3 = ly * cta - off * sta, z3 = ly * sta + off * cta;
        const x4 = lx * ctz - y3 * stz, y4 = lx * stz + y3 * ctz;
        const k = 1 / (1 - z3 * 0.16);
        const d = (((a - head) % 6.283) + 6.283) % 6.283;
        ring.push([cx + x4 * R * k, cy - y4 * R * k, z3, 0.16 + 0.84 * Math.exp(-d * 0.55)]);
      }
      const drawRing = (front: boolean) => {
        for (const p of ring) {
          if (p[2] >= 0 !== front) continue;
          ctx.fillStyle = rgba(p[3] > 0.55 ? c.ink : c.accent2, p[3] * (front ? 1 : 0.5));
          const s = 1 + p[3] * 1.6;
          ctx.fillRect(p[0] - s / 2, p[1] - s / 2, s, s);
        }
      };

      ctx.strokeStyle = rgba(c.ink, 0.08);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * 2.4, R * 1.05, -0.18, 0, 6.283);
      ctx.stroke();
      drawRing(false);
      const band = Math.sin(t * 0.0007) * 0.7;
      for (const v of CORE_POINTS) {
        const p = project(v);
        if (p[2] < -0.15) continue;
        const hot = Math.abs(v[1] - band) < 0.07;
        ctx.fillStyle = hot ? rgba(c.accent2, 0.7 + 0.3 * Math.max(0, p[2])) : rgba(c.ink, 0.1 + 0.62 * Math.max(0, p[2]));
        const s = (hot ? 2 : 1.6) * p[3];
        ctx.fillRect(p[0] - s / 2, p[1] - s / 2, s, s);
      }
      drawRing(true);

      const oa = head + 0.05;
      const olx = Math.cos(oa) * 1.62, oly = Math.sin(oa) * 1.62;
      const oy3 = oly * cta, oz3 = oly * sta;
      const ox4 = olx * ctz - oy3 * stz, oy4 = olx * stz + oy3 * ctz;
      const ok = 1 / (1 - oz3 * 0.16);
      const ox = cx + ox4 * R * ok, oy = cy - oy4 * R * ok, orr = 14 * ok;
      const orb = ctx.createRadialGradient(ox, oy, 0, ox, oy, orr * 2.6);
      orb.addColorStop(0, rgba(c.ink, 0.95));
      orb.addColorStop(0.35, rgba(c.accent2, 0.55));
      orb.addColorStop(1, rgba(c.accent2, 0));
      ctx.fillStyle = orb;
      ctx.beginPath();
      ctx.arc(ox, oy, orr * 2.6, 0, 6.283);
      ctx.fill();

      ctx.font = MONO;
      startups.forEach((startup, i) => {
        const ang = (i / startups.length) * 6.283 + t * 0.00005;
        const ex = Math.cos(ang) * 2.4, ey = Math.sin(ang) * 1.05;
        const px = cx + (ex * Math.cos(-0.18) - ey * Math.sin(-0.18)) * R;
        const py = cy + (ex * Math.sin(-0.18) + ey * Math.cos(-0.18)) * R;
        const dim = Math.sin(ang) < 0 ? 0.45 : 1;
        const col = verdictColor(c, startup.rating);
        for (const v of MINI_POINTS) {
          const mx = v[0] * cyr + v[2] * syr;
          ctx.fillStyle = rgba(c.ink, 0.55 * dim);
          ctx.fillRect(px + mx * 8 - 0.7, py - v[1] * 8 - 0.7, 1.4, 1.4);
        }
        const phase = (t / 1000 + i * 0.83) % 5;
        const box = 22 * (phase < 0.5 ? 1 + 1.4 * (1 - phase / 0.5) : 1);
        const corner = 7;
        ctx.strokeStyle = rgba(col, 0.85 * dim);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          const x0 = px + sx * box, y0 = py + sy * box;
          ctx.moveTo(x0, y0 - sy * corner);
          ctx.lineTo(x0, y0);
          ctx.lineTo(x0 - sx * corner, y0);
        }
        ctx.stroke();
        if (!small) {
          ctx.fillStyle = rgba(col, 0.9 * dim);
          ctx.fillText(`${startup.label} · ${startup.rating.toFixed(1)}`, px - box, py - box - 7);
        }
      });
    },
    [startups]
  );
  const ref = useCanvasScene(draw);
  return <canvas ref={ref} className="live-canvas" aria-hidden="true" />;
}

/* ---------- Verdicts: a quiet rain of the real scores ---------- */

export function ScoreRain({ ratings }: { ratings: number[] }) {
  const draw = useMemo<DrawScene>(
    () => (ctx, w, h, t, c) => {
      if (!ratings.length) return;
      ctx.font = MONO;
      for (let col = 0; col * 30 < w; col++) {
        const x = col * 30 + 4;
        const speed = 0.025 + 0.03 * hash(col * 7 + 2);
        const head = ((t * speed + hash(col * 19) * (h + 300)) % (h + 300)) - 120;
        for (let k = 0; k < 9; k++) {
          const y = head - k * 20;
          if (y < -10 || y > h + 10) continue;
          const value = ratings[(col * 3 + Math.floor(y / 20 + 1000)) % ratings.length];
          const hot = k === 0 && value >= 7.5;
          ctx.fillStyle = hot ? rgba(c.accent, 0.95) : rgba(c.ink, (k === 0 ? 0.55 : 0.28) * (1 - k / 9));
          ctx.fillText(value.toFixed(1), x, y);
        }
      }
    },
    [ratings]
  );
  const ref = useCanvasScene(draw);
  return <canvas ref={ref} className="live-canvas" aria-hidden="true" />;
}

/* ---------- Subscribe: a new verdict broadcasts rings to readers ---------- */

const drawBroadcast: DrawScene = (ctx, w, h, t, c) => {
  const cx = w / 2, cy = h * 0.66, maxR = Math.max(w * 0.55, h);
  ctx.lineWidth = 1;
  for (let k = 1; k <= 6; k++) {
    ctx.strokeStyle = rgba(c.ink, 0.06);
    ctx.beginPath();
    ctx.ellipse(cx, cy, (maxR * k) / 6, ((maxR * k) / 6) * 0.55, 0, 0, 6.283);
    ctx.stroke();
  }
  const pulses: number[] = [];
  for (let p = 0; p < 3; p++) {
    const phase = (t * 0.00016 + p / 3) % 1;
    pulses.push(phase * maxR);
    ctx.strokeStyle = rgba(c.accent, 0.5 * (1 - phase));
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.ellipse(cx, cy, phase * maxR, phase * maxR * 0.55, 0, 0, 6.283);
    ctx.stroke();
  }
  for (let i = 0; i < 70; i++) {
    const a = hash(i * 17 + 3) * 6.283 + t * 0.00002 * (i % 2 ? 1 : -1);
    const rr = maxR * (0.18 + 0.82 * Math.sqrt(hash(i * 29 + 11)));
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.55;
    let hit = 0;
    for (const pr of pulses) hit = Math.max(hit, 1 - Math.abs(pr - rr) / 60);
    ctx.fillStyle = rgba(hit > 0.05 ? c.accent : c.ink, 0.2 + hit * 0.75);
    ctx.beginPath();
    ctx.arc(x, y, 1.8 + hit * 2.2, 0, 6.283);
    ctx.fill();
  }
};

export function BroadcastScene() {
  const ref = useCanvasScene(drawBroadcast);
  return <canvas ref={ref} className="live-canvas" aria-hidden="true" />;
}
