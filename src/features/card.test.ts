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

it("합성 공유 카드는 몸통과 두 부모 상반신을 모두 그린다", async () => {
  const saved = await result();
  const recipe = { assetVersion: 4 as const, body: "cat" as const, fusionBody: "raccoon" as const,
    face: "signature" as const, decorations: [], palette: "original" as const };
  await renderCard({ ...saved, child: { ...saved.child, recipe } });
  const sourceDraws = canvasContext.drawImage.mock.calls.filter((args) => args.length === 9);
  expect(sourceDraws.some((args) => args[1] === 0 && args[2] === 748 && args[3] === 1261)).toBe(true);
  expect(sourceDraws.some((args) => args[1] === 0 && args[2] === 0 && args[3] === 1261)).toBe(true);
  expect(sourceDraws.some((args) => args[1] === 0 && args[2] === 0 && args[3] === 1254)).toBe(true);
});
