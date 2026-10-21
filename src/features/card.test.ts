// @vitest-environment jsdom
import { it, expect, vi } from "vitest";
import { renderCard } from "./card";
import { setupDom, canvasContext } from "../../tests/unit/dom";
import { result } from "../../tests/unit/fixtures";
setupDom();
it("구버전·새버전 카드의 크기와 닉네임·유전 설명을 보존한다", async () => {
  const saved = await result();
  const createElement = vi.spyOn(document, "createElement");
  expect((await renderCard(saved)).type).toBe("image/png");
  await renderCard({ ...saved, child: { ...saved.child, copyVersion: 1 } });
  const sizes = createElement.mock.results
    .map((entry) => entry.value)
    .filter(
      (element): element is HTMLCanvasElement =>
        element instanceof HTMLCanvasElement && element.width === 1080,
    )
    .map((canvas) => [canvas.width, canvas.height]);
  expect(sizes).toEqual([
    [1080, 1600],
    [1080, 1350],
  ]);
  expect(
    canvasContext.fillText.mock.calls.some(([text]) =>
      String(text).includes("첫친구"),
    ),
  ).toBe(true);
  expect(
    canvasContext.fillText.mock.calls.some(([text]) =>
      String(text).includes("특수 능력"),
    ),
  ).toBe(true);
});
it("Canvas 또는 PNG 변환이 불가능하면 명확한 오류를 반환한다", async () => {
  const saved = await result();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValueOnce(null);
  await expect(renderCard(saved)).rejects.toThrow(
    "이미지 저장을 준비할 수 없어요",
  );
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
    (callback) => callback(null),
  );
  await expect(renderCard(saved)).rejects.toThrow("PNG 변환에 실패");
});

it("합성 공유 카드는 절단 없이 완성 원화 전체를 그린다", async () => {
  const saved = await result();
  const recipe = { assetVersion: 4 as const, body: "cat" as const, fusionBody: "raccoon" as const, fusionStyle: "meme" as const,
    face: "signature" as const, decorations: [], palette: "original" as const };
  await renderCard({ ...saved, child: { ...saved.child, recipe } });
  const sourceDraws = canvasContext.drawImage.mock.calls.filter(([image, ...args]) =>
    args.length === 8 && image.src === "/creatures/v5/fusions/cat-raccoon.png");
  expect(sourceDraws).toHaveLength(1);
  expect(sourceDraws[0].slice(1, 5)).toEqual([0, 0, 1254, 1254]);
});

it("레전드·궁합 카드에 풀이와 팁이 포함되고 문장이 카드 아래로 넘치지 않는다", async () => {
  const { createSurveyV3 } = await import("../domain/surveyV3");
  const { QUESTIONS_V3 } = await import("../domain/surveyV3Questions");
  const { offspring } = await import("../domain/engine");
  const profile = createSurveyV3(QUESTIONS_V3.map((q) => ({ questionId: q.id, optionId: q.aScore > 0 ? "a" : "e" })));
  const parents = ["첫친구", "둘째친구"].map((nickname) => ({ ...profile, id: crypto.randomUUID(), nickname, quizVersion: 3 as const, assetVersion: 4 as const }));
  const child = await offspring(parents[0], parents[1]);
  const saved = { ...await result(), parents, child };
  const createElement = vi.spyOn(document, "createElement");
  await renderCard(saved);
  const card = createElement.mock.results.map((entry) => entry.value).find((value) => value instanceof HTMLCanvasElement && value.width === 1080);
  expect(card).toBeDefined();
  const texts = canvasContext.fillText.mock.calls.map(([value]) => String(value)).join("");
  expect(texts).toContain("레전드");
  expect(texts).toContain(child.compatibility!.title);
  expect(texts).toContain("둘만의 공략법");
  expect(canvasContext.fillText.mock.calls.every((args) => Number(args[2]) < card.height)).toBe(true);
});

it("새 카드에는 근거 한 쌍만 담아 공유하고 긴 전체 궁합은 반복하지 않는다", async () => {
  const saved = await result();
  const reading = { version: 1 as const, headline: "속도가 달라도 같이 가는 조합", evidence: [{
    axis: "energy" as const, title: "함께 쉬는 방식",
    parents: saved.parents.map((parent, index) => ({ parentId: parent.id, question: "쉬는 날에는?", answer: index ? "편한 곳에서 쉬기" : "밖에서 놀기" })),
    interpretation: "갈 곳 하나와 쉴 곳 하나를 정해보세요.",
  }] };
  const createElement = vi.spyOn(document, "createElement");
  await renderCard({ ...saved, child: { ...saved.child, combinationReading: reading } });
  const texts = canvasContext.fillText.mock.calls.map(([value]) => String(value)).join("");
  expect(texts).toContain("우리 무슨 조합?");
  expect(texts).toContain("우리, 이런 점이 닮고 달라요");
  expect(texts).toContain("밖에서 놀기");
  expect(texts).not.toContain("특수 능력");
  const card = createElement.mock.results.map((entry) => entry.value).find((value) => value instanceof HTMLCanvasElement && value.width === 1080);
  expect(canvasContext.fillText.mock.calls.every((args) => Number(args[2]) < card.height)).toBe(true);
});
