import { test, expect } from "@playwright/test";
import { sql } from "./database";
test("예약 정리 재실행은 안전하고 원본 답변·관리 토큰을 저장하지 않는다", async ({
  request,
}) => {
  const before = await sql(
    "SELECT COUNT(*)::int AS count FROM characters WHERE snapshot LIKE '%answers%' OR snapshot LIKE '%token%'",
  );
  expect(before[0].rows[0].count).toBe(0);
  expect((await request.get("/api/cron/cleanup")).status()).toBe(401);
  for (let i = 0; i < 2; i++) {
    const response = await request.get("/api/cron/cleanup", {
      headers: { Authorization: `Bearer ${process.env.E2E_DB_TOKEN}` },
    });
    expect(response.ok()).toBe(true);
  }
  const after = await sql(
    "SELECT COUNT(*)::int AS count FROM characters WHERE deleted_at IS NOT NULL OR expires_at<=0",
  );
  expect(after[0].rows[0].count).toBe(0);
});
