import { afterEach, expect, it, vi } from "vitest";
const mocked = vi.hoisted(() => ({ neon: vi.fn() }));
vi.mock("./neon", () => ({ createNeonDatabase: mocked.neon }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});
it("운영 환경은 Secure 세션을 강제하고 로컬 DB 설정을 무시한다", async () => {
  vi.stubEnv("DATABASE_URL", "postgresql://user:secret@example.invalid/db");
  vi.stubEnv("APP_ORIGIN", "https://pixel-offspring.vercel.app");
  vi.stubEnv("CRON_SECRET", "test-secret-at-least-32-characters-long");
  vi.stubEnv("VERCEL", "1");
  vi.stubEnv("PIXEL_LOCAL_DB", "true");
  mocked.neon.mockReturnValue({});
  const { runtimeEnvironment } = await import("./runtime");
  const env = await runtimeEnvironment();
  expect(env.LOCAL_DEV).toBe("false");
  expect(await runtimeEnvironment()).toBe(env);
});
it("미설정 운영 환경은 서버 오류로 처리한다", async () => {
  vi.stubEnv("DATABASE_URL", "");
  vi.stubEnv("VERCEL", "1");
  const { runtimeEnvironment } = await import("./runtime");
  await expect(runtimeEnvironment()).rejects.toThrow("Server environment");
});
