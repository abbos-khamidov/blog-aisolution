"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { pointerTilt } from "./pointer";
import { hexToRgb, prefersReducedMotion, rgba, type Rgb } from "./useCanvasScene";

export type BoardItem = {
  href: string;
  /** Short name drawn on the tile top. */
  label: string;
  /** Full title for the tooltip and the screen-reader list. */
  title: string;
  meta: string;
  /** null = opinion column (no score). */
  rating: number | null;
  verdict: "up" | "average" | "down" | "opinion";
  verdictLabel: string;
};

type Tower = BoardItem & { x: number; y: number; hot: boolean; base: number; h: number; lift: number; order: number; depth: number };

const TILE_W = 200;
const TILE_H = 138;
const GAP = 16;
const LABEL_ON_TILE: Record<BoardItem["verdict"], string> = { up: "#3f6b00", average: "#5b45e0", down: "#c0392b", opinion: "#5b45e0" };

function mix(a: Rgb, b: Rgb, f: number) {
  return `rgb(${[0, 1, 2].map((i) => Math.round(a[i] * f + b[i] * (1 - f))).join(",")})`;
}
function shade(c: Rgb, f: number) {
  return `rgb(${c.map((v) => Math.round(v * f)).join(",")})`;
}

/**
 * Hero board: every razbor is a tower whose height is its score; the best
 * one sits in the middle and glows. Drawn on canvas with an affine
 * projection (no CSS perspective), so every label stays pixel-sharp.
 */
export function ScoreBoard({ items, label }: { items: BoardItem[]; label: string }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tip, setTip] = useState<{ item: BoardItem; x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = prefersReducedMotion();
    const towers: Tower[] = items.map((item, order) => ({
      ...item, x: 0, y: 0, hot: order === 0, h: 0, lift: 0, order, depth: 0,
      base: item.rating === null ? 4 : (item.rating - 4.8) * 10
    }));
    let cols = 0, rows = 0, boardW = 0, boardH = 0, w = 1, h = 1, dpr = 1, raf = 0, visible = true;
    // Towers on screen right now — on phones only the first few, so tiles stay big enough to read.
    let active: Tower[] = towers;
    let hover: Tower | null = null;
    const start = performance.now();

    const layout = (nextCols: number, count: number) => {
      if (nextCols === cols && count === active.length) return;
      cols = nextCols;
      active = towers.slice(0, Math.min(count, towers.length));
      rows = Math.ceil(active.length / cols);
      const cells: { r: number; c: number; d: number }[] = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push({ r, c, d: Math.hypot(c - (cols - 1) / 2, (r - (rows - 1) / 2) * 1.3) });
      cells.sort((a, b) => a.d - b.d);
      active.forEach((tower, k) => {
        tower.x = cells[k].c * (TILE_W + GAP);
        tower.y = cells[k].r * (TILE_H + GAP);
      });
      boardW = cols * TILE_W + (cols - 1) * GAP;
      boardH = rows * TILE_H + (rows - 1) * GAP;
    };
    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      w = Math.max(1, canvas.clientWidth);
      h = Math.max(1, canvas.clientHeight);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };
    const projection = () => {
      const small = w < 700;
      // Phone: 2 columns × 4 rows (the 8 best) — the full list is right below the board.
      if (w < 520) layout(2, 8);
      else layout(small ? 3 : 5, towers.length);
      const tilt = reduce ? { x: 0, y: 0 } : pointerTilt();
      const a = (((small ? -6 : -8) + tilt.x * 5) * Math.PI) / 180;
      const rx = (((small ? 44 : 50) - tilt.y * 4) * Math.PI) / 180;
      const c = Math.cos(a), s = Math.sin(a), k = Math.cos(rx);
      const spanX = boardW * Math.abs(c) + boardH * Math.abs(s);
      const spanY = (boardW * Math.abs(s) + boardH * Math.abs(c)) * k;
      const sc = Math.min((w * 0.9) / spanX, (h * 0.96) / (spanY + 30));
      const m = { a: c * sc, b: s * k * sc, c: -s * sc, d: c * k * sc, e: 0, f: 0, sc, camX: s / c };
      m.e = w / 2 - (m.a * boardW + m.c * boardH) / 2;
      m.f = h / 2 + 6 - (m.b * boardW + m.d * boardH) / 2;
      return m;
    };
    type M = ReturnType<typeof projection>;
    const P = (m: M, x: number, y: number, z: number) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f - z * m.sc] as const;
    const quad = (pts: (readonly [number, number])[]) => {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath();
    };
    const roundRect = (x: number, y: number, rw: number, rh: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + rw, y, x + rw, y + rh, r);
      ctx.arcTo(x + rw, y + rh, x, y + rh, r);
      ctx.arcTo(x, y + rh, x, y, r);
      ctx.arcTo(x, y, x + rw, y, r);
      ctx.closePath();
    };
    const pulses = Array.from({ length: 8 }, (_, q) => ({ v: q % 2 === 0, k: q % 4, sp: 0.09 + ((q * 37) % 10) / 200, o: ((q * 53) % 100) / 100 }));
    let lastM: M | null = null;

    const draw = (now: number) => {
      const t = now - start;
      const css = getComputedStyle(document.documentElement);
      const v = (name: string) => css.getPropertyValue(name);
      const col = {
        tile: hexToRgb(v("--tile"), [246, 246, 248]), tileInk: v("--tile-ink").trim() || "#0b0b10",
        fill: hexToRgb(v("--fill")), onFill: v("--on-fill").trim() || "#0b0b10",
        panel: hexToRgb(v("--panel"), [19, 19, 26]), a2: hexToRgb(v("--accent-2"), [157, 144, 255]),
        accent: hexToRgb(v("--accent")), ink: v("--ink").trim() || "#f5f5f7"
      };
      const dark = document.documentElement.dataset.theme !== "light";
      const m = projection();
      lastM = m;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // glowing seams on the ground plane
      ctx.save();
      ctx.setTransform(m.a * dpr, m.b * dpr, m.c * dpr, m.d * dpr, m.e * dpr, m.f * dpr);
      const xs = Array.from({ length: cols + 1 }, (_, i) => i * (TILE_W + GAP) - GAP / 2);
      const ys = Array.from({ length: rows + 1 }, (_, j) => j * (TILE_H + GAP) - GAP / 2);
      ctx.lineWidth = 1.4 / m.sc;
      ctx.strokeStyle = rgba(col.accent, dark ? 0.38 : 0.45);
      ctx.shadowColor = rgba(col.accent, 0.8);
      ctx.shadowBlur = 6;
      ctx.beginPath();
      for (const x of xs) { ctx.moveTo(x, ys[0]); ctx.lineTo(x, ys[rows]); }
      for (const y of ys) { ctx.moveTo(xs[0], y); ctx.lineTo(xs[cols], y); }
      ctx.stroke();
      if (!reduce) {
        for (const p of pulses) {
          const f = (t * 0.001 * p.sp + p.o) % 1, L = 90;
          let x: number, y: number, g: CanvasGradient;
          if (p.v) { x = xs[(p.k + 1) % (cols + 1)]; y = ys[0] + f * (ys[rows] - ys[0]); g = ctx.createLinearGradient(x, y - L, x, y); }
          else { y = ys[p.k % (rows + 1)]; x = xs[0] + f * (xs[cols] - xs[0]); g = ctx.createLinearGradient(x - L, y, x, y); }
          g.addColorStop(0, rgba(col.accent, 0));
          g.addColorStop(1, rgba(col.accent, 1));
          ctx.strokeStyle = g;
          ctx.lineWidth = 3 / m.sc;
          ctx.shadowBlur = 14;
          ctx.beginPath();
          if (p.v) { ctx.moveTo(x, y - L); ctx.lineTo(x, y); } else { ctx.moveTo(x - L, y); ctx.lineTo(x, y); }
          ctx.stroke();
        }
      }
      ctx.restore();

      // towers, far to near
      const leftVisible = -m.camX > 0;
      for (const tower of active) {
        let grow = reduce ? 1 : Math.min(1, Math.max(0, (t - 300 - tower.order * 60) / 1100));
        grow = 1 - Math.pow(1 - grow, 3);
        tower.lift += ((hover === tower ? 12 : 0) - tower.lift) * 0.18;
        tower.h = tower.base * grow + tower.lift;
        tower.depth = (tower.x + TILE_W / 2) * m.camX + (tower.y + TILE_H / 2);
      }
      for (const tower of [...active].sort((a, b) => a.depth - b.depth)) {
        const x0 = tower.x, y0 = tower.y, x1 = x0 + TILE_W, y1 = y0 + TILE_H, th = tower.h;
        const opinion = tower.verdict === "opinion";
        const face = opinion ? col.panel : tower.verdict === "up" ? col.fill : col.tile;
        if (th > 0.5) {
          ctx.fillStyle = opinion ? mix(col.a2, col.panel, 0.16) : shade(face, 0.62);
          quad([P(m, x0, y1, th), P(m, x1, y1, th), P(m, x1, y1, 0), P(m, x0, y1, 0)]);
          ctx.fill();
          const sx = leftVisible ? x0 : x1;
          ctx.fillStyle = opinion ? mix(col.a2, col.panel, 0.08) : shade(face, 0.45);
          quad([P(m, sx, y0, th), P(m, sx, y1, th), P(m, sx, y1, 0), P(m, sx, y0, 0)]);
          ctx.fill();
        }
        ctx.save();
        ctx.setTransform(m.a * dpr, m.b * dpr, m.c * dpr, m.d * dpr, m.e * dpr, (m.f - th * m.sc) * dpr);
        if (tower.hot) { ctx.shadowColor = rgba(col.fill, 0.9); ctx.shadowBlur = 50 * m.sc; }
        roundRect(x0, y0, TILE_W, TILE_H, 12);
        ctx.fillStyle = opinion ? mix(col.a2, col.panel, 0.24) : `rgb(${face.join(",")})`;
        ctx.fill();
        ctx.shadowBlur = 0;
        if (opinion) { ctx.strokeStyle = rgba(col.a2, 0.6); ctx.lineWidth = 1.2; ctx.stroke(); }
        if (hover === tower) { ctx.strokeStyle = rgba(col.accent, 1); ctx.lineWidth = 3; roundRect(x0, y0, TILE_W, TILE_H, 12); ctx.stroke(); }
        ctx.fillStyle = opinion ? col.ink : tower.verdict === "up" ? col.onFill : col.tileInk;
        ctx.textBaseline = "alphabetic";
        ctx.font = "600 17px 'Onest', system-ui, sans-serif";
        ctx.fillText(tower.label, x0 + 16, y0 + 30, TILE_W - 32);
        if (opinion) {
          ctx.fillStyle = `rgb(${col.a2.join(",")})`;
          ctx.font = "500 14px 'JetBrains Mono', ui-monospace, monospace";
          ctx.fillText(tower.verdictLabel, x0 + 16, y1 - 18, TILE_W - 32);
        } else if (tower.rating !== null) {
          ctx.font = "400 46px 'Onest', system-ui, sans-serif";
          ctx.fillText(tower.rating.toFixed(1), x0 + 14, y1 - 16);
          ctx.font = "500 12px 'JetBrains Mono', ui-monospace, monospace";
          ctx.textAlign = "right";
          ctx.fillStyle = tower.verdict === "up" ? "rgba(11,11,16,.7)" : LABEL_ON_TILE[tower.verdict];
          ctx.fillText(tower.verdictLabel, x1 - 16, y1 - 20);
          ctx.textAlign = "left";
        }
        ctx.restore();
      }
      if (!reduce && visible) raf = requestAnimationFrame(draw);
    };

    const hit = (event: PointerEvent | MouseEvent): Tower | null => {
      const m = lastM;
      if (!m) return null;
      const rect = canvas.getBoundingClientRect();
      const sx = event.clientX - rect.left, sy = event.clientY - rect.top;
      const det = m.a * m.d - m.b * m.c;
      for (const tower of [...active].sort((a, b) => b.depth - a.depth)) {
        const X = sx - m.e, Y = sy + tower.h * m.sc - m.f;
        const bx = (m.d * X - m.c * Y) / det, by = (-m.b * X + m.a * Y) / det;
        if (bx >= tower.x && bx <= tower.x + TILE_W && by >= tower.y && by <= tower.y + TILE_H) return tower;
      }
      return null;
    };
    const onMove = (event: PointerEvent) => {
      hover = hit(event);
      canvas.style.cursor = hover ? "pointer" : "default";
      setTip(hover ? { item: hover, x: event.clientX, y: event.clientY } : null);
      if (reduce) draw(performance.now());
    };
    const onLeave = () => { hover = null; setTip(null); };
    const onClick = (event: MouseEvent) => { const tower = hit(event); if (tower) router.push(tower.href); };

    size();
    const resizeObserver = new ResizeObserver(() => { size(); if (reduce || !visible) draw(performance.now()); });
    resizeObserver.observe(canvas);
    const viewObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !visible && !reduce) { visible = true; cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }
      visible = entry.isIntersecting;
    });
    viewObserver.observe(canvas);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("click", onClick);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      viewObserver.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("click", onClick);
    };
  }, [items, router]);

  return (
    <div className="score-board">
      <canvas ref={canvasRef} className="live-canvas" aria-hidden="true" />
      <ul className="sr-only" aria-label={label}>
        {items.map((item) => (
          <li key={item.href}>
            <a href={item.href}>
              {item.title}, {item.rating === null ? item.verdictLabel : `${item.rating.toFixed(1)} — ${item.verdictLabel}`}
            </a>
          </li>
        ))}
      </ul>
      {tip && (
        <div className="board-tip" style={{ left: Math.min(tip.x + 16, window.innerWidth - 300), top: tip.y + 18 }}>
          <span>{tip.item.meta}</span>
          {tip.item.title}
          <b>{tip.item.rating === null ? tip.item.verdictLabel : `${tip.item.rating.toFixed(1)} / 10 · ${tip.item.verdictLabel}`}</b>
        </div>
      )}
    </div>
  );
}
