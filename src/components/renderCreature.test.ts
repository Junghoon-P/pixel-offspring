import { afterEach, it, expect, vi } from "vitest";
import { parentRecipe } from "../domain/engine";
class PendingImage {
  static instances: PendingImage[] = [];
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = "";
  constructor() {
    PendingImage.instances.push(this);
  }
}
const recipe = parentRecipe(
  Array.from({ length: 6 }, (_, i) => ({
    questionId: `q${i + 1}`,
    optionId: "a",
  })),
);
const context = {
  save: vi.fn(),
  restore: vi.fn(),
  drawImage: vi.fn(),
  imageSmoothingEnabled: true,
} as unknown as CanvasRenderingContext2D;
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  PendingImage.instances = [];
});
it("응답 없는 이미지 요청은 시간 제한 후 실패하며 재시도할 수 있다", async () => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.stubGlobal("Image", PendingImage);
  const { drawCreature } = await import("./renderCreature");
  let error = "";
  const first = drawCreature(context, recipe).catch((e: Error) => {
    error = e.message;
  });
  await vi.advanceTimersByTimeAsync(10001);
  expect(error).toContain("불러오지 못했어요");
  await first;
  const prior = PendingImage.instances.length;
  const retry = drawCreature(context, recipe);
  expect(PendingImage.instances.length).toBeGreaterThan(prior);
  for (const image of PendingImage.instances.slice(prior)) image.onload?.();
  await expect(retry).resolves.toBeUndefined();
});
it("이미지 오류와 잘못된 배율을 거부한다", async () => {
  vi.resetModules();
  vi.stubGlobal("Image", PendingImage);
  const { drawCreature } = await import("./renderCreature");
  await expect(drawCreature(context, recipe, 0, 0, 1.5)).rejects.toThrow(
    "정수 배율",
  );
  const drawing = drawCreature(context, recipe);
  const failed = expect(drawing).rejects.toThrow("불러오지 못했어요");
  for (const image of PendingImage.instances) image.onerror?.();
  await failed;
});
