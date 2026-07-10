"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";

/**
 * Generic scroll-reveal wrapper: direct children fade/rise into place the
 * first time they cross into the viewport, staggered by DOM order. One
 * IntersectionObserver drives the whole group instead of one per child.
 */
export function Reveal({ children, className, y = 26 }: { children: ReactNode; className?: string; y?: number }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = Array.from(root.children);
    if (!items.length) return undefined;

    if (reduceMotion) {
      gsap.set(items, { opacity: 1, y: 0 });
      return undefined;
    }

    if (typeof IntersectionObserver === "undefined") {
      gsap.set(items, { opacity: 1, y: 0 });
      return undefined;
    }

    gsap.set(items, { opacity: 0, y });

    const revealed = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        const toReveal = entries
          .filter((entry) => entry.isIntersecting && !revealed.has(entry.target))
          .sort((a, b) => items.indexOf(a.target) - items.indexOf(b.target));

        toReveal.forEach((entry) => {
          revealed.add(entry.target);
          observer.unobserve(entry.target);
        });

        if (toReveal.length) {
          gsap.to(
            toReveal.map((entry) => entry.target),
            { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: "power3.out" }
          );
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
    );

    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [y]);

  return (
    <div className={className} ref={rootRef}>
      {children}
    </div>
  );
}
