import { it, expect, vi, afterEach } from "vitest";
import { z } from "zod";
import { api } from "./api";
afterEach(() => vi.unstubAllGlobals());
it("네트워크·HTML 오류·손상된 성공 응답을 사용자 안내로 변환한다", async () => {
  vi.stubGlobal("fetch", async () => {
    throw new TypeError("offline");
  });
  await expect(api("/api/test", z.string())).rejects.toMatchObject({
    code: "NETWORK",
  });
  vi.stubGlobal(
    "fetch",
    async () => new Response("<html>Bad Gateway</html>", { status: 502 }),
  );
  await expect(api("/api/test", z.string())).rejects.toMatchObject({
    code: "SERVER",
    message: "잠시 연결이 어려워요. 다시 시도해 주세요.",
  });
  vi.stubGlobal("fetch", async () => Response.json({ data: 42 }));
  await expect(api("/api/test", z.string())).rejects.toMatchObject({
    code: "RESPONSE",
    message: "응답을 확인하지 못했어요. 다시 시도해 주세요.",
  });
});
it("유효 응답과 삭제 응답 및 서버 안내를 유지한다", async () => {
  vi.stubGlobal("fetch", async () => Response.json({ data: "ok" }));
  expect(await api("/api/test", z.string(), "POST", {})).toBe("ok");
  vi.stubGlobal("fetch", async () => new Response(null, { status: 204 }));
  expect(await api("/api/test", z.undefined(), "DELETE")).toBeUndefined();
  vi.stubGlobal("fetch", async () =>
    Response.json(
      { error: { code: "PAUSED", message: "잠시 쉬어요" } },
      { status: 503 },
    ),
  );
  await expect(api("/api/test", z.string())).rejects.toMatchObject({
    code: "PAUSED",
    message: "잠시 쉬어요",
  });
});
