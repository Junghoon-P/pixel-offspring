// @vitest-environment jsdom
import { it, expect, vi } from "vitest";
import { Invite } from "./Invite";
import {
  setupDom,
  render,
  click,
  button,
  text,
  select,
} from "../../tests/unit/dom";
import { character, ok, failure } from "../../tests/unit/fixtures";
setupDom();
it("세션 없는 친구에게 설문 복귀 링크를 제공한다", async () => {
  const host = character(),
    id = crypto.randomUUID();
  const { traits: _, createdAt: __, expiresAt: ___, ...parent } = host;
  vi.stubGlobal("fetch", async (path: string) => {
    if (path.includes("invites"))
      return ok({ parent, expiresAt: host.expiresAt });
    if (path.includes("characters")) return failure("세션 없음", 401);
    return ok({ active: true, accepted: true });
  });
  await render(<Invite id={id} navigate={vi.fn()} />);
  expect(text()).toContain("10문항에 답하면");
  expect(
    document.querySelector('a[href^="/create"]')?.getAttribute("href"),
  ).toBe(`/create?invite=${id}`);
  expect(sessionStorage.getItem("pending-invite")).toBe(id);
});
it("생물을 선택하고 조합 실패 후 같은 생물로 재시도한다", async () => {
  const host = character(),
    a = character("하나"),
    b = character("둘"),
    id = crypto.randomUUID(),
    resultId = crypto.randomUUID();
  const { traits: _, createdAt: __, expiresAt: ___, ...parent } = host;
  let failed = true;
  const sent: string[] = [],
    navigate = vi.fn();
  vi.stubGlobal("fetch", async (path: string, init?: RequestInit) => {
    if (path.endsWith("/pair")) {
      sent.push(JSON.parse(String(init?.body)).characterId);
      return failed
        ? failure("조합 실패")
        : ok({
            resultId,
            resultUrl: `/r/${resultId}`,
            created: true,
            expiresAt: host.expiresAt,
          });
    }
    if (path.includes("invites"))
      return ok({ parent, expiresAt: host.expiresAt });
    if (path.includes("characters")) return ok([a, b]);
    return ok({ active: true, accepted: true });
  });
  await render(<Invite id={id} navigate={navigate} />);
  await select("#my-character", b.id);
  await click(button("우리 조합 보기"));
  expect(text()).toContain("조합 실패");
  failed = false;
  await click(button("우리 조합 보기"));
  expect(sent).toEqual([b.id, b.id]);
  expect(navigate).toHaveBeenCalledWith(`/r/${resultId}`);
  expect(sessionStorage.getItem("pending-invite")).toBeNull();
  expect(sessionStorage.getItem("birth-result")).toBe(resultId);
});
it("초대 조회 오류에서 재시도한다", async () => {
  vi.stubGlobal("fetch", async () => failure("만료된 초대", 410));
  await render(<Invite id={crypto.randomUUID()} navigate={vi.fn()} />);
  expect(text()).toContain("초대를 확인해 주세요");
  expect(text()).toContain("만료된 초대");
  await click(button("다시 시도"));
  expect(text()).toContain("만료된 초대");
});
