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
it("Vercel Preview는 운영 주소 대신 해당 배포의 HTTPS 주소를 사용한다", () => {
  const preview = {
    ...values,
    VERCEL: "1",
    VERCEL_ENV: "preview",
    VERCEL_URL: "pixel-offspring-preview.vercel.app",
  };
  expect(readConfig(preview).APP_ORIGIN).toBe(
    "https://pixel-offspring-preview.vercel.app",
  );
  expect(readConfig({ ...preview, VERCEL_ENV: "production" }).APP_ORIGIN).toBe(
    values.APP_ORIGIN,
  );
  expect(readConfig({ ...preview, VERCEL: undefined }).APP_ORIGIN).toBe(
    values.APP_ORIGIN,
  );
});
it("Preview의 배포 호스트가 없거나 잘못되면 운영 주소로 우회하지 않는다", () => {
  for (const VERCEL_URL of [
    undefined, "", "evil.invalid", "a.vercel.app/path",
    "user@a.vercel.app", "a.vercel.app:443", "a.vercel.app/",
  ]) {
    expect(() =>
      readConfig({ ...values, VERCEL: "1", VERCEL_ENV: "preview", VERCEL_URL }),
    ).toThrow("Server environment");
  }
});
