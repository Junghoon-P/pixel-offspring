// @vitest-environment jsdom
import { it, expect, vi } from "vitest";
import { Quiz } from "./Quiz";
import {
  setupDom,
  render,
  click,
  input,
  button,
  text,
} from "../../tests/unit/dom";
import { character, ok, failure } from "../../tests/unit/fixtures";
setupDom();
it("닉네임·선택 검증 후 10문항을 저장하고 초대로 복귀한다", async () => {
  const navigate = vi.fn(),
    saved = character();
  const invite = crypto.randomUUID();
  history.replaceState(null, "", `/create?invite=${invite}`);
  const requests: unknown[] = [];
  vi.stubGlobal("fetch", async (path: string, init?: RequestInit) => {
    if (path === "/api/characters") {
      requests.push(JSON.parse(String(init?.body)));
      return ok(saved);
    }
    return ok({ active: true, accepted: true });
  });
  await render(<Quiz navigate={navigate} />);
  await click(button("다음"));
  expect(text()).toContain("닉네임은");
  await input("#nickname", "테스트");
  await click(button("다음"));
  expect(text()).toContain("답 하나를");
  for (let i = 0; i < 10; i++) {
    await click(
      document.querySelector<HTMLInputElement>('input[type="radio"]')!,
    );
    await click(button(i === 9 ? "내 캐릭터 확인하기" : "다음"));
  }
  expect(requests).toHaveLength(1);
  expect(requests[0]).toMatchObject({
    quizVersion: 4,
    nickname: "테스트",
    answers: expect.any(Array),
  });
  expect(navigate).toHaveBeenCalledWith(`/i/${invite}`);
  expect(sessionStorage.getItem("quiz-draft")).toBeNull();
});
it("저장 오류는 마지막 답변과 요청 키를 유지하고 재시도한다", async () => {
  const saved = character(),
    navigate = vi.fn(),
    key = crypto.randomUUID();
  sessionStorage.setItem(
    "quiz-draft",
    JSON.stringify({
      quizVersion: 4,
      nickname: "복구",
      choices: Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => [`q${i + 1}`, "a"]),
      ),
      step: 9,
      key,
    }),
  );
  let failed = true;
  const keys: string[] = [];
  vi.stubGlobal("fetch", async (path: string, init?: RequestInit) => {
    if (path !== "/api/characters") return ok({ active: true, accepted: true });
    keys.push(JSON.parse(String(init?.body)).idempotencyKey);
    return failed ? failure("저장 오류") : ok(saved);
  });
  await render(<Quiz navigate={navigate} />);
  await click(button("내 캐릭터 확인하기"));
  expect(text()).toContain("저장 오류");
  failed = false;
  await click(button("내 캐릭터 확인하기"));
  expect(keys).toEqual([key, key]);
  expect(navigate).toHaveBeenCalledWith("/me");
});
it("구버전 초안은 닉네임만 유지하고 이전·초기화가 동작한다", async () => {
  sessionStorage.setItem(
    "quiz-draft",
    JSON.stringify({ quizVersion: 3, nickname: "옛친구", choices: { q1: "b" }, step: 3 }),
  );
  const navigate = vi.fn();
  await render(<Quiz navigate={navigate} />);
  expect(text()).toContain("10문항으로 새로워졌어요");
  expect(document.querySelector<HTMLInputElement>("#nickname")?.value).toBe(
    "옛친구",
  );
  await click(document.querySelector<HTMLInputElement>('input[type="radio"]')!);
  await click(button("다음"));
  await click(button("이전"));
  expect(
    document.querySelector<HTMLInputElement>('input[type="radio"]')?.checked,
  ).toBe(true);
  await click(button("처음부터 다시"));
  expect(document.querySelector<HTMLInputElement>("#nickname")?.value).toBe("");
  await click(button("이전"));
  expect(navigate).toHaveBeenCalledWith("/");
});
