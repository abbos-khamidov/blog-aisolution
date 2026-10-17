"use client";

import { Fragment, useEffect, useRef, type CSSProperties } from "react";
import { prefersReducedMotion } from "./useCanvasScene";

type Props = {
  as?: "h1" | "h2";
  id?: string;
  className?: string;
  text: string;
  /** Optional second part, set in a softer color. */
  soft?: string;
  /** Hero heading: animate on load instead of when scrolled into view. */
  immediate?: boolean;
};

function Letters({ text, start }: { text: string; start: number }) {
  let n = start;
  return (
    <>
      {text.split(/(\s+)/).map((part, i) =>
        /^\s+$/.test(part) || !part ? (
          <Fragment key={i}> </Fragment>
        ) : (
          <span className="mt-word" key={i}>
            {Array.from(part).map((ch, j) => (
              <span className="mt-ch" key={j} style={{ "--n": Math.min(n++, 40) } as CSSProperties}>
                {ch}
              </span>
            ))}
          </span>
        )
      )}
    </>
  );
}

/**
 * Heading whose letters rise in one by one. The text is server-rendered and
 * fully visible without JavaScript; the script only hides it right before
 * the animation, and only if the heading is still below the fold.
 */
export function MotionHeading({ as: Tag = "h2", id, className, text, soft, immediate }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const play = () => {
      el.classList.add("mt-wait");
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("mt-in")));
    };
    if (immediate) {
      play();
      return;
    }
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    el.classList.add("mt-wait");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.classList.add("mt-in");
        observer.disconnect();
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [immediate]);

  const full = soft ? `${text} ${soft}` : text;
  return (
    <Tag ref={ref} id={id} className={`motion-heading ${className ?? ""}`} aria-label={full}>
      <span aria-hidden="true">
        <Letters text={text} start={0} />
        {soft && (
          <>
            {" "}
            <span className="mt-soft">
              <Letters text={soft} start={Array.from(text).length} />
            </span>
          </>
        )}
      </span>
    </Tag>
  );
}
