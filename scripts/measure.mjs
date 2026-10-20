import { randomBytes } from "node:crypto";
import next from "next";
import { createServer } from "node:http";
import { writeFileSync } from "node:fs";
process.env.E2E_DB_TOKEN = randomBytes(32).toString("hex");
const origin = "http://127.0.0.1:5175";
process.env.APP_ORIGIN = origin;
process.env.PIXEL_LOCAL_DB = "true";
const app = next({ dev: false, hostname: "127.0.0.1", port: 5175 });
await app.prepare();
const handler = app.getRequestHandler();
const server = createServer((req, res) => {
  void handler(req, res);
});
await new Promise((resolve) => server.listen(5175, "127.0.0.1", resolve));
const stats = [];
const db = async () => {
  const response = await fetch(`${origin}/api/testing/sql`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.E2E_DB_TOKEN}` },
    body: "SELECT (SELECT count(*)::int FROM sessions) sessions,(SELECT count(*)::int FROM characters) characters,(SELECT count(*)::int FROM invites) invites,(SELECT count(*)::int FROM results) results,(SELECT coalesce(sum(octet_length(snapshot)),0)::int FROM characters)+(SELECT coalesce(sum(octet_length(snapshot)),0)::int FROM results) snapshot_bytes;",
  });
  if (!response.ok)
    throw new Error(`Local measurement failed: ${response.status}`);
  return (await response.json())[0].rows[0];
};
const before = await db();
const client = () => {
  let cookie = "";
  return async (path, method = "GET", body) => {
    const start = performance.now();
    const response = await fetch(origin + path, {
      method,
      headers: {
        Origin: origin,
        Cookie: cookie,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) cookie = setCookie.split(";")[0];
    stats.push({
      method,
      category: path.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/g, ":id"),
      status: response.status,
      wallMs: Number((performance.now() - start).toFixed(2)),
    });
    const value = await response.json();
    if (!response.ok) throw new Error(`measurement failed: ${response.status}`);
    return value.data;
  };
};
const create = async (api, name) => {
  await api("/api/session", "POST");
  return api("/api/characters", "POST", {
    quizVersion: 1,
    nickname: name,
    answers: Array.from({ length: 6 }, (_, i) => ({
      questionId: `q${i + 1}`,
      optionId: "b",
    })),
    idempotencyKey: crypto.randomUUID(),
  });
};
try {
  const a = client(),
    b = client();
  const A = await create(a, "측정 A");
  await a("/api/me/characters");
  await a("/api/me/results");
  const invite = await a("/api/invites", "POST", {
    characterId: A.id,
    idempotencyKey: crypto.randomUUID(),
  });
  await b(`/api/invites/${invite.id}`);
  const B = await create(b, "측정 B");
  const pair = await b(`/api/invites/${invite.id}/pair`, "POST", {
    characterId: B.id,
  });
  await b(`/api/results/${pair.resultId}`);
  await a("/api/me/results");
  await a(`/api/results/${pair.resultId}`);
  const after = await db();
  const times = stats.map((v) => v.wallMs).sort((x, y) => x - y);
  const report = {
    environment: "local Next.js + PGlite PostgreSQL, not cloud billing metrics",
    timestamp: new Date().toISOString(),
    requestCount: stats.length,
    p50WallMs: times[Math.floor(times.length * 0.5)],
    p95WallMs: times[Math.floor(times.length * 0.95)],
    rowGrowth: Object.fromEntries(
      Object.keys(before).map((key) => [key, after[key] - before[key]]),
    ),
    requests: stats,
    cloudCpuMs: null,
    cloudRowsRead: null,
    cloudRowsWritten: null,
    notes:
      "Wall time is not CPU. Snapshot bytes exclude indexes, cookies, metrics and PostgreSQL pages. Browser telemetry, revalidation and HTML reads add requests.",
  };
  writeFileSync(
    "docs/measurement.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  process.stdout.write(
    JSON.stringify({ ...report, requests: undefined }, null, 2) + "\n",
  );
} finally {
  await new Promise((resolve) => server.close(resolve));
  await app.close();
}
