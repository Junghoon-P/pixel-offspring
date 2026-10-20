import { expect, it } from "vitest";
import { readConfig } from "./config";
const values = {
  DATABASE_URL: "postgresql://user:password@example.invalid/db",
  APP_ORIGIN: "https://pixel-offspring.vercel.app",
  CRON_SECRET: "test-secret-at-least-32-characters-long",
};
it("운영 설정은 필수 비밀과 정확한 HTTPS Origin을 요구하고 생성은 기본 중지한다", () => {
  expect(readConfig(values).CREATION_ENABLED).toBe("false");
  expect(
    readConfig({ ...values, CREATION_ENABLED: "true" }).CREATION_ENABLED,
  ).toBe("true");
  for (const APP_ORIGIN of [
    "http://localhost:5173",
    "https://example.com/path",
    "https://user:pw@example.com",
    "https://example.com/",
  ])
    expect(() => readConfig({ ...values, APP_ORIGIN })).toThrow();
  expect(() =>
    readConfig({ ...values, DATABASE_URL: "https://example.com" }),
  ).toThrow();
  expect(() => readConfig({ ...values, CRON_SECRET: "short" })).toThrow();
  expect(() => readConfig({})).toThrow();
});
