import { expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ environment: vi.fn(), fetch: vi.fn() }));
vi.mock("./runtime", () => ({ runtimeEnvironment: mock.environment }));
vi.mock("./index", async (original) => ({
  ...(await original<typeof import("./index")>()),
  default: { fetch: mock.fetch },
}));
import { GET, POST, DELETE } from "../src/app/api/[...path]/route";
it("Next API의 모든 메서드는 기존 요청을 전달하고 서버 비밀을 숨긴다", async () => {
  mock.environment.mockResolvedValue({});
  mock.fetch.mockImplementation(() => Promise.resolve(new Response("ok")));
  const request = new Request("https://example.com/api/session");
  for (const handler of [GET, POST, DELETE])
    expect(await (await handler(request)).text()).toBe("ok");
  expect(mock.fetch).toHaveBeenCalledWith(request, {});
  mock.environment.mockRejectedValue(new Error("postgresql://secret"));
  const response = await POST(request);
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain("secret");
});
