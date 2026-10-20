// @vitest-environment jsdom
import { it, expect, vi } from "vitest";
import { StrictMode } from "react";
import { Result } from "./Result";
import { setupDom, render, click, button, text } from "../../tests/unit/dom";
import { result, ok, failure } from "../../tests/unit/fixtures";
setupDom();
it("저장 결과·부모·능력을 표시하고 탄생 건너뛰기·PNG·링크 공유를 제공한다", async () => {
  const saved = await result();
  sessionStorage.setItem("birth-result", saved.resultId);
  vi.stubGlobal("fetch", async (path: string) =>
    ok(path.includes("results") ? saved : { accepted: true }),
  );
  const anchor = vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => undefined);
  await render(
    <StrictMode>
      <Result id={saved.resultId} />
    </StrictMode>,
  );
  expect(text()).toContain(saved.child.name);
  expect(text()).toContain(saved.child.ability);
  expect(text()).toContain("첫친구");
  expect(text()).toContain("새 생물이 눈을");
  await click(button("연출 건너뛰기"));
  expect(text()).not.toContain("새 생물이 눈을");
  expect(button("PNG 저장").disabled).toBe(false);
  await click(button("PNG 저장"));
  expect(anchor).toHaveBeenCalledOnce();
  await click(button("링크 복사"));
  expect(text()).toContain("링크를 복사했어요");
  await click(button("이미지 공유"));
  expect(text()).toContain("공유 창을 지원하지 않아요");
  const revoke = URL.revokeObjectURL;
  await render(<div />);
  expect(revoke).toHaveBeenCalledWith("blob:result");
});
it("PNG 변환 실패 후 다시 준비하고 공유·복사 실패 대안을 보여준다", async () => {
  const saved = await result();
  vi.stubGlobal("fetch", async () => ok(saved));
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementationOnce(
    (callback) => callback(null),
  );
  await render(<Result id={saved.resultId} />);
  expect(text()).toContain("카드 준비에 실패");
  expect(button("PNG 저장").disabled).toBe(true);
  await click(button("카드 다시 준비"));
  expect(button("PNG 저장").disabled).toBe(false);
  vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
    new Error("denied"),
  );
  await click(button("링크 복사"));
  expect(text()).toContain("길게 눌러 복사");
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: async () => {
      throw new Error("denied");
    },
  });
  await click(button("이미지 공유"));
  expect(text()).toContain("공유하지 못했어요");
});
it("공유 취소를 실패로 안내하지 않고 동작 줄이기에서 탄생 연출을 생략한다", async () => {
  const saved = await result();
  sessionStorage.setItem("birth-result", saved.resultId);
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  vi.stubGlobal("fetch", async () => ok(saved));
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: async () => {
      throw new DOMException("cancel", "AbortError");
    },
  });
  Object.defineProperty(navigator, "canShare", {
    configurable: true,
    value: () => true,
  });
  await render(<Result id={saved.resultId} />);
  await click(button("이미지 공유"));
  expect(text()).not.toContain("공유하지 못했어요");
  expect(text()).not.toContain("새 생물이 눈을");
});
it("조회 오류에서 재시도하여 저장된 결과를 표시한다", async () => {
  const saved = await result();
  let failed = true;
  vi.stubGlobal("fetch", async () =>
    failed ? failure("잠시 연결 실패") : ok(saved),
  );
  await render(<Result id={saved.resultId} />);
  expect(text()).toContain("결과를 볼 수 없어요");
  failed = false;
  await click(button("다시 시도"));
  expect(text()).toContain(saved.child.name);
});
