import { it, expect } from "vitest";
import { shareFile, wrapText } from "./share";
it("공유 취소는 오류가 아니며 미지원은 fallback이다", async () => {
  const file = new File(["png"], "result.png", { type: "image/png" });
  expect(await shareFile(file, "https://example.com", {})).toBe("unsupported");
  expect(
    await shareFile(file, "https://example.com", {
      canShare: () => true,
      share: async () => {
        throw new DOMException("cancel", "AbortError");
      },
    }),
  ).toBe("cancelled");
  await expect(
    shareFile(file, "https://example.com", {
      canShare: () => true,
      share: async () => {
        throw new Error("failed");
      },
    }),
  ).rejects.toThrow("failed");
});
it("한글·결합 이모지를 깨뜨리지 않고 줄바꿈한다", () => {
  const text = "가나다👨‍👩‍👧‍👦라마";
  const lines = wrapText(
    text,
    (t) =>
      Array.from(
        new Intl.Segmenter("ko", { granularity: "grapheme" }).segment(t),
      ).length,
    3,
  );
  expect(lines.join("")).toBe(text);
  expect(lines).toContain("👨‍👩‍👧‍👦라마");
});
