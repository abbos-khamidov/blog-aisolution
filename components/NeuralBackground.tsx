"use client";

import { useEffect, useRef } from "react";

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
};

function cssVar(name: string, fallback: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const nodes: Node[] = [];
    let width = 0;
    let height = 0;
    let raf = 0;
    let colors = {
      line: "#0d2bff",
      node: "#ff5b1f",
      glow: "#1c9dff"
    };

    const updateColors = () => {
      const isDark = document.documentElement.dataset.theme === "dark";
      colors = {
        line: isDark ? cssVar("--brand-lime", "#d8ff2c") : cssVar("--brand-blue", "#0d2bff"),
        node: cssVar("--brand-orange", "#ff5b1f"),
        glow: isDark ? cssVar("--brand-sky", "#1c9dff") : cssVar("--brand-sky", "#1c9dff")
      };
    };

    const seedNodes = () => {
      const target = Math.round(Math.min(68, Math.max(30, (width * height) / 31000)));
      nodes.length = 0;

      for (let i = 0; i < target; i += 1) {
        const speed = 0.12 + Math.random() * 0.22;
        const angle = Math.random() * Math.PI * 2;
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          phase: Math.random() * Math.PI * 2
        });
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedNodes();
      draw(0);
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      const maxDistance = Math.min(190, Math.max(120, width * 0.12));
      const lineWidth = width < 640 ? 0.7 : 0.95;

      ctx.save();
      ctx.globalCompositeOperation = "source-over";

      for (let i = 0; i < nodes.length; i += 1) {
        const a = nodes[i];
        if (!reduceMotion.matches) {
          a.x += a.vx;
          a.y += a.vy;

          if (a.x < -20) a.x = width + 20;
          if (a.x > width + 20) a.x = -20;
          if (a.y < -20) a.y = height + 20;
          if (a.y > height + 20) a.y = -20;
        }

        for (let j = i + 1; j < nodes.length; j += 1) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.hypot(dx, dy);

          if (distance < maxDistance) {
            const alpha = (1 - distance / maxDistance) * 0.24;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = colors.line;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
          }
        }
      }

      nodes.forEach((node) => {
        const pulse = reduceMotion.matches ? 0.35 : 0.35 + Math.sin(time / 900 + node.phase) * 0.18;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2.1 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = colors.node;
        ctx.globalAlpha = 0.34;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, 7 + pulse * 5, 0, Math.PI * 2);
        ctx.strokeStyle = colors.glow;
        ctx.globalAlpha = 0.08;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      ctx.restore();

      if (!reduceMotion.matches) {
        raf = window.requestAnimationFrame(draw);
      }
    };

    updateColors();
    resize();

    const onResize = () => resize();
    const onMotionChange = () => {
      window.cancelAnimationFrame(raf);
      draw(0);
      if (!reduceMotion.matches) raf = window.requestAnimationFrame(draw);
    };
    const themeObserver = new MutationObserver(() => {
      updateColors();
      draw(0);
    });

    window.addEventListener("resize", onResize);
    reduceMotion.addEventListener("change", onMotionChange);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    if (!reduceMotion.matches) raf = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      reduceMotion.removeEventListener("change", onMotionChange);
      themeObserver.disconnect();
    };
  }, []);

  return <canvas className="neural-background" ref={canvasRef} aria-hidden="true" />;
}
