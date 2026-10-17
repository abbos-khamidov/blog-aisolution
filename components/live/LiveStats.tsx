"use client";

import { useEffect, useState } from "react";

const ID_KEY = "aisolution-visitor";
const PING_MS = 25_000;

function visitorId(): string | null {
  try {
    let id = localStorage.getItem(ID_KEY);
    if (!id) {
      id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Header pill: people on the site right now + all-time unique visitors (see app/api/stats). */
export function LiveStats({ onlineLabel, visitorsLabel }: { onlineLabel: string; visitorsLabel: string }) {
  const [stats, setStats] = useState<{ online: number; visitors: number } | null>(null);

  useEffect(() => {
    const id = visitorId();
    if (!id) return;
    let alive = true;
    const ping = () => {
      if (document.visibilityState === "hidden") return;
      fetch("/api/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (alive && data && typeof data.online === "number" && typeof data.visitors === "number") setStats(data);
        })
        .catch(() => {});
    };
    ping();
    const timer = window.setInterval(ping, PING_MS);
    document.addEventListener("visibilitychange", ping);
    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", ping);
    };
  }, []);

  const format = (n: number) => new Intl.NumberFormat("ru-RU").format(n);
  return (
    <div className="live-stats" aria-live="polite">
      <span title={onlineLabel} aria-label={`${onlineLabel}: ${stats ? stats.online : "—"}`}>
        <i className="live-dot" aria-hidden="true" />
        <b key={stats?.online}>{stats ? format(stats.online) : "—"}</b>
      </span>
      <span className="live-stats-sep" aria-hidden="true" />
      <span title={visitorsLabel} aria-label={`${visitorsLabel}: ${stats ? stats.visitors : "—"}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <b key={stats?.visitors}>{stats ? format(stats.visitors) : "—"}</b>
      </span>
    </div>
  );
}
