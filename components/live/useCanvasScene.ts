"use client";

import { useEffect, useRef } from "react";

export type Rgb = readonly [number, number, number];

export type SceneColors = {
  ink: Rgb;
  accent: Rgb;
  fill: Rgb;
  accent2: Rgb;
  up: Rgb;
  average: Rgb;
  down: Rgb;
  dark: boolean;
};

export type DrawScene = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, c: SceneColors) => void;

export function hexToRgb(hex: string, fallback: Rgb = [216, 255, 44]): Rgb {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return fallback;
  const n = parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(c: Rgb, a: number): string {
  return `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
}

/** Deterministic pseudo-random in [0,1) — same picture on every frame and every render. */
export function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function readColors(): SceneColors {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name);
  return {
    ink: hexToRgb(v("--ink"), [245, 245, 247]),
    accent: hexToRgb(v("--accent")),
    fill: hexToRgb(v("--fill")),
    accent2: hexToRgb(v("--accent-2"), [157, 144, 255]),
    up: hexToRgb(v("--up")),
    average: hexToRgb(v("--average"), [169, 155, 255]),
    down: hexToRgb(v("--down"), [255, 107, 91]),
    dark: document.documentElement.dataset.theme !== "light"
  };
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Runs a canvas animation: sizes the canvas to its box at device pixel ratio,
 * re-reads the theme colors every frame (the theme toggle just works), pauses
 * while the canvas is off screen and draws a single still frame when the
 * reader asked for reduced motion.
 */
export function useCanvasScene(draw: DrawScene) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = prefersReducedMotion();
    let w = 1;
    let h = 1;
    let raf = 0;
    let visible = true;

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, canvas.clientWidth);
      h = Math.max(1, canvas.clientHeight);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const frame = (time: number) => {
      ctx.clearRect(0, 0, w, h);
      drawRef.current(ctx, w, h, reduce ? 0 : time, readColors());
      if (!reduce && visible) raf = requestAnimationFrame(frame);
    };

    size();
    const resizeObserver = new ResizeObserver(() => {
      size();
      if (reduce || !visible) frame(0);
    });
    resizeObserver.observe(canvas);
    const viewObserver = new IntersectionObserver(([entry]) => {
      const now = entry.isIntersecting;
      if (now && !visible && !reduce) {
        visible = true;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(frame);
      }
      visible = now;
    });
    viewObserver.observe(canvas);
    const themeObserver = new MutationObserver(() => {
      if (reduce) frame(0);
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      viewObserver.disconnect();
      themeObserver.disconnect();
    };
  }, []);

  return ref;
}
