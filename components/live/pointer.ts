"use client";

/** One shared, smoothed mouse position (-0.5…0.5) for every scene that tilts toward the pointer. */
const target = { x: 0, y: 0 };
const smooth = { x: 0, y: 0 };
let listening = false;

export function pointerTilt(): { x: number; y: number } {
  if (!listening && typeof window !== "undefined") {
    listening = true;
    window.addEventListener(
      "pointermove",
      (event) => {
        target.x = event.clientX / window.innerWidth - 0.5;
        target.y = event.clientY / window.innerHeight - 0.5;
      },
      { passive: true }
    );
  }
  smooth.x += (target.x - smooth.x) * 0.06;
  smooth.y += (target.y - smooth.y) * 0.06;
  return smooth;
}
