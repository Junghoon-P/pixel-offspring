import { afterEach, expect, it, vi } from "vitest";
import { usesLocalDatabase } from "./local";
import { POST } from "../src/app/api/testing/sql/route";
afterEach(() => vi.unstubAllEnvs());
it("Vercel은 개발 DB와 SQL 테스트 경로를 환경 플래그와 무관하게 차단한다", async () => {
  vi.stubEnv("VERCEL", "1");
  vi.stubEnv("PIXEL_LOCAL_DB", "true");
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("E2E_DB_TOKEN", "test-token");
  expect(usesLocalDatabase()).toBe(false);
  const response = await POST(
    new Request("http://localhost/api/testing/sql", {
      method: "POST",
      headers: { Authorization: "Bearer test-token" },
      body: "SELECT 1",
    }),
  );
  expect(response.status).toBe(404);
});
it("로컬에서도 테스트 토큰이 없거나 일치하지 않으면 SQL을 실행하지 않는다", async () => {
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("NODE_ENV", "development");
  expect(usesLocalDatabase()).toBe(true);
  for (const token of ["", "expected-token"]) {
    vi.stubEnv("E2E_DB_TOKEN", token);
    expect(
      (
        await POST(
          new Request("http://localhost/api/testing/sql", { method: "POST" }),
        )
      ).status,
    ).toBe(404);
  }
});
