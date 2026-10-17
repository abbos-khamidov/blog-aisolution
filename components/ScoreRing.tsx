import type { CSSProperties } from "react";
import { getVerdict } from "@/lib/post-display";

type Props = {
  rating: number;
  label?: string;
  size?: "sm" | "md" | "lg";
};

/** Circular 10-point score: the ring fills to rating × 10%. Pure CSS, server-safe. */
export function ScoreRing({ rating, label, size = "md" }: Props) {
  const verdict = getVerdict(rating);

  return (
    <span
      className={`score-ring score-ring-${size} verdict-${verdict}`}
      style={{ "--score": `${Math.min(10, Math.max(0, rating)) * 10}%` } as CSSProperties}
      aria-hidden="true"
    >
      <span>
        <strong>{rating.toFixed(1)}</strong>
        {label && <small>{label}</small>}
      </span>
    </span>
  );
}
