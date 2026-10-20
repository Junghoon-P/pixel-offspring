import { it, expect } from "vitest";
import { z } from "zod";
import { parseBody, limit } from "./http";
it("본문 형식·크기·JSON·스키마를 검증한다", async () => {
  const request = (body?: string, contentType = "application/json"): Request =>
    new Request("https://test.invalid", {
      method: "POST",
      headers: { "Content-Type": contentType },
      body,
    });
  const schema = z.object({ name: z.string() }).strict();
  await expect(
    parseBody(request("{}", "text/plain"), schema),
  ).rejects.toMatchObject({ status: 415 });
  await expect(parseBody(request(), schema)).rejects.toMatchObject({
    status: 400,
  });
  await expect(
    parseBody(request("a".repeat(8193)), schema),
  ).rejects.toMatchObject({ status: 413 });
  await expect(parseBody(request("{broken"), schema)).rejects.toMatchObject({
    status: 400,
  });
  await expect(parseBody(request('{"name":1}'), schema)).rejects.toMatchObject({
    status: 400,
  });
  expect(await parseBody(request('{"name":"이름"}'), schema)).toEqual({
    name: "이름",
  });
});
it("요청 제한 초과는 429를 반환한다", async () => {
  await expect(
    limit({ limit: async () => ({ success: false }) }, "key"),
  ).rejects.toMatchObject({ status: 429 });
  await expect(
    limit({ limit: async () => ({ success: true }) }, "key"),
  ).resolves.toBeUndefined();
});
