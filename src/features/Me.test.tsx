// @vitest-environment jsdom
import { act } from "react";
import { it, expect, vi } from "vitest";
import { Me } from "./Me";
import { setupDom, render, click, button, text } from "../../tests/unit/dom";
import { character, result, ok, failure } from "../../tests/unit/fixtures";
setupDom();
it("빈 목록과 조회 실패에서 다시 시도할 수 있다", async () => {
  let failed = true;
  vi.stubGlobal("fetch", async (path: string) =>
    failed
      ? failure()
      : ok(path.includes("characters") ? [] : { items: [], nextCursor: null }),
  );
  await render(<Me />);
  expect(text()).toContain("연결 실패");
  failed = false;
  await click(button("다시 시도"));
  expect(text()).toContain("아직 생물이 없어요");
  expect(text()).toContain("우리는 무슨 조합일까요?");
});
it("내 생물 초대·복사·결과 더보기·삭제 및 포커스 재조회를 수행한다", async () => {
  const parent = character(),
    first = await result(),
    second = await result();
  const invite = {
    id: crypto.randomUUID(),
    url: "https://example.com/i/friend",
    expiresAt: Date.now() + 10000,
  };
  let deleted = false;
  const calls: string[] = [];
  vi.stubGlobal("fetch", async (path: string, init?: RequestInit) => {
    calls.push(`${init?.method} ${path}`);
    if (init?.method === "DELETE") {
      deleted = true;
      return new Response(null, { status: 204 });
    }
    if (path === "/api/invites") return ok(invite);
    if (path.includes("characters")) return ok(deleted ? [] : [parent]);
    if (path.includes("cursor="))
      return ok({ items: [second], nextCursor: null });
    if (path.includes("results"))
      return ok({ items: [first], nextCursor: "next page" });
    return ok({ accepted: true });
  });
  await render(<Me />);
  expect(text()).toContain(parent.nickname);
  await click(button("함께할 사람 초대하기"));
  expect(document.querySelector<HTMLInputElement>("#invite-url")?.value).toBe(
    invite.url,
  );
  await click(button("초대 링크 복사"));
  expect(text()).toContain("링크를 복사했어요");
  await click(button("더 보기"));
  expect(document.querySelectorAll('a[href^="/r/"]')).toHaveLength(2);
  expect(calls.some((path) => path.includes("next%20page"))).toBe(true);
  await click(button("목록 새로고침"));
  expect(document.querySelectorAll('a[href^="/r/"]')).toHaveLength(1);
  vi.stubGlobal("confirm", () => false);
  await click(button("이 생물 삭제"));
  expect(deleted).toBe(false);
  vi.stubGlobal("confirm", () => true);
  await click(button("이 생물 삭제"));
  expect(text()).toContain("아직 생물이 없어요");
  expect(document.querySelector("#invite-url")).toBeNull();
  const count = calls.length;
  await act(async () => window.dispatchEvent(new Event("focus")));
  expect(calls.length).toBeGreaterThan(count);
});
it("초대 생성·클립보드 오류를 표시하고 수동 복사를 안내한다", async () => {
  let failed = true;
  vi.stubGlobal("fetch", async (path: string) => {
    if (path.includes("characters")) return ok([character()]);
    if (path.includes("results")) return ok({ items: [], nextCursor: null });
    if (path === "/api/invites")
      return failed
        ? failure("초대 오류")
        : ok({
            id: crypto.randomUUID(),
            url: "https://example.com/i/test",
            expiresAt: Date.now(),
          });
    return ok({ accepted: true });
  });
  await render(<Me />);
  await click(button("함께할 사람 초대하기"));
  expect(text()).toContain("초대 오류");
  failed = false;
  await click(button("함께할 사람 초대하기"));
  vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
    new Error("blocked"),
  );
  await click(button("초대 링크 복사"));
  expect(text()).toContain("직접 선택해 복사");
});
