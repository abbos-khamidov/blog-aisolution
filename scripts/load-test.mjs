#!/usr/bin/env node
/**
 * Load test without extra packages (Node 18+).
 *
 *   node scripts/load-test.mjs http://localhost:3002/ru
 *   node scripts/load-test.mjs http://localhost:3002/ru --steps 10,50,100,200 --requests 1000
 *   node scripts/load-test.mjs http://localhost:3002/api/stats --stats      (POST, a new visitor id each time)
 *
 * Each step sends --requests requests with that many in flight at once and
 * prints speed (req/s), latency (p50/p95/p99/max) and errors. If p95 grows
 * many times over between steps, or errors/timeouts appear, the server is
 * choking at that load.
 *
 * Production is protected: any host other than localhost needs
 * --i-have-permission (ask the server owner first and test at a quiet time —
 * a heavy test looks like an attack to the hosting provider).
 */

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith("--"));
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const has = (name) => args.includes(`--${name}`);

if (!url) {
  console.log("Usage: node scripts/load-test.mjs <url> [--steps 10,50,100] [--requests 1000] [--timeout 10000] [--stats]");
  process.exit(1);
}

const target = new URL(url);
const local = ["localhost", "127.0.0.1", "::1"].includes(target.hostname);
if (!local && !has("i-have-permission")) {
  console.error(`Refusing to load-test ${target.host}: it is not your computer.`);
  console.error("Ask the server owner, pick a quiet time, then add --i-have-permission.");
  process.exit(1);
}

const steps = String(flag("steps", "10,50,100,200")).split(",").map(Number).filter((n) => n > 0);
const perStep = Number(flag("requests", 1000));
const timeoutMs = Number(flag("timeout", 10_000));
const statsMode = has("stats");

const randomId = () => `load-${Math.random().toString(36).slice(2, 12)}-${Date.now().toString(36)}`;

async function one() {
  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(target, {
      method: statsMode ? "POST" : "GET",
      headers: statsMode ? { "Content-Type": "application/json" } : undefined,
      body: statsMode ? JSON.stringify({ id: randomId() }) : undefined,
      signal: controller.signal
    });
    await response.arrayBuffer();
    return { ms: performance.now() - started, status: response.status };
  } catch (error) {
    return { ms: performance.now() - started, status: error.name === "AbortError" ? "timeout" : "network" };
  } finally {
    clearTimeout(timer);
  }
}

const pct = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];

async function step(concurrency) {
  const results = [];
  let next = 0;
  const started = performance.now();
  const worker = async () => {
    while (next < perStep) {
      next++;
      results.push(await one());
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, perStep) }, worker));
  const seconds = (performance.now() - started) / 1000;
  const ok = results.filter((r) => typeof r.status === "number" && r.status < 400);
  const failed = {};
  for (const r of results) if (!(typeof r.status === "number" && r.status < 400)) failed[r.status] = (failed[r.status] ?? 0) + 1;
  const ms = ok.map((r) => r.ms).sort((a, b) => a - b);
  const f = (v) => (v === undefined ? "-" : `${Math.round(v)}ms`);
  return {
    concurrency,
    requests: results.length,
    ok: ok.length,
    errors: Object.keys(failed).length ? Object.entries(failed).map(([k, v]) => `${k}×${v}`).join(" ") : "0",
    "req/s": Math.round(results.length / seconds),
    p50: f(pct(ms, 50)),
    p95: f(pct(ms, 95)),
    p99: f(pct(ms, 99)),
    max: f(ms.at(-1))
  };
}

console.log(`${statsMode ? "POST" : "GET"} ${target.href} — ${perStep} requests per step, timeout ${timeoutMs}ms`);
const rows = [];
for (const concurrency of steps) {
  const row = await step(concurrency);
  rows.push(row);
  console.log(`  ${String(concurrency).padStart(4)} at once: ${row["req/s"]} req/s, p95 ${row.p95}, errors ${row.errors}`);
}
console.table(rows);

const first = rows[0];
const last = rows.at(-1);
const p95 = (r) => parseInt(r.p95, 10) || 0;
if (rows.some((r) => r.errors !== "0")) console.log("⚠️  Errors or timeouts appeared — the server could not keep up at that step.");
else if (rows.some((r) => p95(r) > 2000)) console.log("⚠️  p95 over 2 s — visitors would feel the site hanging.");
else if (rows.length > 1 && p95(last) > Math.max(50, p95(first)) * 10) console.log("⚠️  p95 latency grew more than 10× — requests are queueing up.");
else console.log("✅ No errors; latency stayed reasonable.");
