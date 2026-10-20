"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion } from "./useCanvasScene";

export type MethodStep = { title: string; copy: string };

/** Four evaluation steps that advance by themselves until the reader picks one. */
export function MethodSteps({ steps }: { steps: MethodStep[] }) {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto || prefersReducedMotion()) return;
    const timer = window.setInterval(() => setActive((i) => (i + 1) % steps.length), 3400);
    return () => window.clearInterval(timer);
  }, [auto, steps.length]);

  return (
    <ol className="method-steps">
      <span className="method-flow" aria-hidden="true" />
      {steps.map((step, i) => (
        <li key={step.title}>
          <button
            type="button"
            className="method-step"
            aria-pressed={active === i}
            onClick={() => {
              setAuto(false);
              setActive(i);
            }}
          >
            <span className="method-no">{String(i + 1).padStart(2, "0")}</span>
            <strong>{step.title}</strong>
            <span className="method-copy">{step.copy}</span>
            {active === i && auto && <span className="method-progress" aria-hidden="true" />}
          </button>
        </li>
      ))}
    </ol>
  );
}
