"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type YmWindow = Window & { ym?: (id: number, method: "hit", url: string, options?: { referer?: string }) => void };

/**
 * Metrica counts the first page itself; later pages open without a reload
 * (Next.js client navigation), so each one is reported as a "hit" here.
 */
export function YandexPageviews({ ymId }: { ymId: number }) {
  const pathname = usePathname();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    const url = window.location.href;
    if (previous.current !== null && previous.current !== url) {
      (window as YmWindow).ym?.(ymId, "hit", url, { referer: previous.current });
    }
    previous.current = url;
  }, [pathname, ymId]);

  return null;
}
